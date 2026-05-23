/**
 * Test-only fake of the SocketClient. Lets a test push canned messages
 * to specific (channel, symbol) listeners and assert subscribe/unsubscribe
 * counts.
 */
import type {
  ChannelName,
  IncomingMessage,
  Symbol,
} from "@/types/messages";

type Listener = (msg: IncomingMessage) => void;

export function createFakeSocket() {
  const listeners = new Map<string, Set<Listener>>();
  const subscribed: string[] = [];
  const unsubscribed: string[] = [];

  function key(c: ChannelName, s: Symbol) {
    return `${c}::${s}`;
  }

  return {
    subscribe(channel: ChannelName, symbol: Symbol, listener: Listener) {
      const k = key(channel, symbol);
      let set = listeners.get(k);
      if (!set) {
        set = new Set();
        listeners.set(k, set);
        subscribed.push(k);
      }
      set.add(listener);
      return () => {
        const cur = listeners.get(k);
        if (!cur) return;
        cur.delete(listener);
        if (cur.size === 0) {
          listeners.delete(k);
          unsubscribed.push(k);
        }
      };
    },
    push(channel: ChannelName, symbol: Symbol, msg: IncomingMessage) {
      const set = listeners.get(key(channel, symbol));
      if (!set) return;
      for (const fn of [...set]) fn(msg);
    },
    get subscribed() {
      return [...subscribed];
    },
    get unsubscribed() {
      return [...unsubscribed];
    },
    get active() {
      return [...listeners.keys()];
    },
    connect() {},
    disconnect() {},
  };
}
