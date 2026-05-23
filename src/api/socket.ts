import type {
  ChannelName,
  IncomingMessage,
  SubscribeFrame,
  Symbol,
} from "@/types/messages";
import { useConnectionStore } from "@/store/connection.store";

/** Callback signature for a single (channel, symbol) subscriber. */
type Listener = (msg: IncomingMessage) => void;

/**
 * WebSocket endpoint. Read from `VITE_WS_URL` at build time, falling back to
 * the local mock server for development.
 */
const WS_URL =
  (import.meta as unknown as { env: { VITE_WS_URL?: string } }).env
    ?.VITE_WS_URL ?? "ws://localhost:8080";

/** Lower bound (ms) for the exponential reconnect backoff. */
const MIN_BACKOFF = 250;
/** Upper bound (ms) for the exponential reconnect backoff. */
const MAX_BACKOFF = 4000;

/**
 * Builds the `"channel::symbol"` key used to index the listeners map.
 * The `::` separator is safe because neither {@link ChannelName} nor
 * {@link Symbol} contains it.
 */
function channelKey(channel: ChannelName, symbol: Symbol): string {
  return `${channel}::${symbol}`;
}

/**
 * Inverse of {@link channelKey}. Used by `replayActiveSubs` to rebuild a
 * subscribe frame from the live listener keys after a reconnect.
 */
function parseKey(key: string): { channel: ChannelName; symbol: Symbol } {
  const [channel, symbol] = key.split("::");
  return { channel: channel as ChannelName, symbol: symbol as Symbol };
}

/**
 * Reference-counted WebSocket subscription manager.
 * - One WS connection for the whole app.
 * - Multiple components can subscribe to the same (channel, symbol); only one
 *   subscribe frame is sent (on 0→1) and one unsubscribe on 1→0.
 * - On disconnect, queues outgoing frames; on reconnect, replays all active subs.
 * - Per-(channel,symbol) listeners receive ONE message, not a flood of duplicates.
 */
class SocketClient {
  /** The live WebSocket. `null` before `connect()` and after `disconnect()`. */
  private ws: WebSocket | null = null;
  /**
   * Map from `channelKey` → set of subscriber callbacks. The set's size acts as
   * the reference count: a wire `subscribe` is sent on the 0→1 transition and
   * an `unsubscribe` is sent on the 1→0 transition.
   */
  private listeners = new Map<string, Set<Listener>>();
  /**
   * Frames buffered while the socket is not `OPEN`. Drained in FIFO order by
   * `flushOutbox()` once the connection comes up.
   */
  private outbox: SubscribeFrame[] = [];
  /**
   * Current reconnect attempt count. Reset to 0 on a successful `open`. Drives
   * the backoff exponent and is mirrored into the connection store for UI.
   */
  private retry = 0;
  /**
   * Handle for the pending reconnect `setTimeout`. Cleared by `disconnect()`
   * so we don't fire a zombie reconnect after an intentional teardown.
   */
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  /**
   * Distinguishes a user-initiated `disconnect()` from a network-loss `close`.
   * When true, the `close` handler reports `"closed"` instead of scheduling a
   * reconnect.
   */
  private intentionallyClosed = false;

  /**
   * Opens the WebSocket and wires up its event handlers. Idempotent — a no-op
   * if the socket is already connecting or open.
   *
   * Handlers:
   * - `open`    → reset retry counter, replay active subs, flush outbox.
   * - `message` → forward to `dispatch()`.
   * - `close`   → schedule a reconnect, unless `disconnect()` was called.
   * - `error`   → record the error message on the connection store.
   */
  connect() {
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) return;
    this.intentionallyClosed = false;
    useConnectionStore.getState().setStatus(
      this.retry > 0 ? "reconnecting" : "connecting",
    );
    try {
      this.ws = new WebSocket(WS_URL);
    } catch (err) {
      useConnectionStore.getState().setError((err as Error).message);
      this.scheduleReconnect();
      return;
    }

    this.ws.addEventListener("open", () => {
      this.retry = 0;
      useConnectionStore.getState().setStatus("open");
      useConnectionStore.getState().setRetry(0);
      useConnectionStore.getState().setError(undefined);
      this.replayActiveSubs();
      this.flushOutbox();
    });

    this.ws.addEventListener("message", (ev) => {
      this.dispatch(ev.data);
    });

    this.ws.addEventListener("close", () => {
      if (this.intentionallyClosed) {
        useConnectionStore.getState().setStatus("closed");
        return;
      }
      this.scheduleReconnect();
    });

    this.ws.addEventListener("error", (ev) => {
      useConnectionStore
        .getState()
        .setError((ev as Event).type || "WebSocket error");
    });
  }

  /**
   * Closes the socket and cancels any pending reconnect. Sets
   * `intentionallyClosed` so the `close` handler does not auto-reconnect.
   */
  disconnect() {
    this.intentionallyClosed = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    this.ws?.close();
    this.ws = null;
  }

  /**
   * Registers a listener for `(channel, symbol)` and returns an unsubscribe
   * function.
   *
   * A wire `subscribe` frame is sent only on the 0→1 transition (first
   * listener for this pair); an `unsubscribe` is sent only on the 1→0
   * transition (last listener removed). The returned unsubscribe is safe to
   * call multiple times — additional calls are no-ops.
   */
  subscribe(
    channel: ChannelName,
    symbol: Symbol,
    listener: Listener,
  ): () => void {
    const key = channelKey(channel, symbol);
    let set = this.listeners.get(key);
    if (!set) {
      set = new Set();
      this.listeners.set(key, set);
      this.send({
        type: "subscribe",
        payload: { channels: [{ name: channel, symbols: [symbol] }] },
      });
    }
    set.add(listener);

    return () => {
      const current = this.listeners.get(key);
      if (!current) return;
      current.delete(listener);
      if (current.size === 0) {
        this.listeners.delete(key);
        this.send({
          type: "unsubscribe",
          payload: { channels: [{ name: channel, symbols: [symbol] }] },
        });
      }
    };
  }

  /**
   * Returns the current active subscription keys (`"channel::symbol"`).
   * Intended for tests and devtools, not for application code.
   */
  getActiveSubs(): string[] {
    return [...this.listeners.keys()];
  }

  /**
   * Parses one incoming raw frame and routes it to listeners for its
   * `(channel, symbol)`.
   *
   * Two non-obvious behaviors:
   * - Candlestick messages carry `type: "candlestick"` but were subscribed
   *   under `candlestick_<resolution>`, so the channel name is reconstructed
   *   from `msg.resolution` before lookup.
   * - Listeners are invoked over a snapshot of the set so a listener can
   *   safely unsubscribe itself during dispatch. Errors from one listener are
   *   logged and swallowed so they cannot break the others.
   */
  private dispatch(raw: unknown) {
    if (typeof raw !== "string") return;
    let msg: IncomingMessage;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (msg.type === "subscriptions") return;

    // Resolve channel key — candlesticks use type "candlestick" but were
    // subscribed via channel name `candlestick_<res>`. Map both directions.
    const channel =
      msg.type === "candlestick"
        ? (`candlestick_${msg.resolution}` as ChannelName)
        : (msg.type as ChannelName);

    if (!("symbol" in msg)) return;
    const key = channelKey(channel, msg.symbol);
    const listeners = this.listeners.get(key);
    if (!listeners) return;
    // Iterate over a snapshot in case a listener unsubscribes itself.
    for (const fn of [...listeners]) {
      try {
        fn(msg);
      } catch (err) {
        console.error("[socket] listener error", err);
      }
    }
  }

  /**
   * Sends a frame immediately if the socket is `OPEN`; otherwise queues it on
   * the outbox for `flushOutbox()` to drain on the next successful connect.
   */
  private send(frame: SubscribeFrame) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(frame));
    } else {
      this.outbox.push(frame);
    }
  }

  /**
   * Drains all queued frames in FIFO order. Called from the `open` handler
   * after `replayActiveSubs()`. No-op if the socket is not yet `OPEN`.
   */
  private flushOutbox() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const pending = this.outbox.splice(0);
    for (const f of pending) this.ws.send(JSON.stringify(f));
  }

  /**
   * After a reconnect, re-subscribes to every `(channel, symbol)` currently in
   * `listeners`. Pairs are coalesced by channel into a single `subscribe`
   * frame to minimize wire traffic. No-op if there are no active subscriptions.
   */
  private replayActiveSubs() {
    if (this.listeners.size === 0) return;
    const channels = [...this.listeners.keys()].map(parseKey);
    // Coalesce by channel name for fewer frames.
    const byChannel = new Map<ChannelName, Symbol[]>();
    for (const { channel, symbol } of channels) {
      const arr = byChannel.get(channel) ?? [];
      arr.push(symbol);
      byChannel.set(channel, arr);
    }
    const frame: SubscribeFrame = {
      type: "subscribe",
      payload: {
        channels: [...byChannel.entries()].map(([name, symbols]) => ({
          name,
          symbols,
        })),
      },
    };
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(frame));
    }
  }

  /**
   * Schedules the next `connect()` attempt with exponential backoff:
   * `MIN_BACKOFF * 2^(retry-1)` capped at `MAX_BACKOFF`, plus up to 25% jitter
   * to avoid the thundering-herd problem when many clients reconnect at the
   * same instant. Increments `retry` and mirrors it onto the connection store.
   */
  private scheduleReconnect() {
    useConnectionStore.getState().setStatus("reconnecting");
    this.retry += 1;
    useConnectionStore.getState().setRetry(this.retry);
    const base = Math.min(MIN_BACKOFF * 2 ** (this.retry - 1), MAX_BACKOFF);
    const jitter = Math.random() * base * 0.25; // To avoid all clients reconnecting at the same time (thundering herd problem)
    const delay = base + jitter;
    this.retryTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }
}

/**
 * Singleton SocketClient instance. Hooks and components should import this
 * directly; do not instantiate `SocketClient` elsewhere.
 */
export const socket = new SocketClient();
