import { useEffect } from "react";
import { socket } from "@/api/socket";
import { SYMBOLS, type Symbol, type WireTicker } from "@/types/messages";
import { parseTicker } from "@/lib/parse";
import { useTickersStore } from "@/store/tickers.store";
import { throttleTrailing } from "@/lib/throttle";

const LIST_THROTTLE_MS = 200;

/**
 * Subscribes to ticker for every symbol; updates the global tickers store.
 * The store update is throttled per-symbol so the list view re-renders ≤ 5x/s
 * per row regardless of server cadence (which can be 10–50ms in extreme mode).
 */
export function useTickerMap(symbols: readonly Symbol[] = SYMBOLS) {
  useEffect(() => {
    const unsubs: Array<() => void> = [];

    for (const sym of symbols) {
      const setOne = useTickersStore.getState().set;

      const throttled = throttleTrailing((wire: WireTicker) => {
        setOne(sym, parseTicker(wire));
      }, LIST_THROTTLE_MS);

      const unsub = socket.subscribe("v2/ticker", sym, (msg) => {
        if (msg.type === "v2/ticker") throttled(msg);
      });
      
      unsubs.push(() => {
        throttled.cancel();
        unsub();
      });
    }

    return () => {
      for (const u of unsubs) u();
    };
  }, [symbols]);
}
