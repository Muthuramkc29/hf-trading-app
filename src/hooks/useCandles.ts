import { useEffect, useRef, useState } from "react";
import { socket } from "@/api/socket";
import type { ChannelName, Symbol } from "@/types/messages";
import { parseCandle } from "@/lib/parse";
import type { Candle } from "@/types/domain";

type Resolution = "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
const MAX_CANDLES = 120;

/**
 * Subscribes to a candlestick channel and seeds + updates a rolling window.
 *
 * The mock server doesn't expose history via HTTP, so the chart starts empty
 * and fills as ticks arrive. New candles (different candle_start_time) are
 * appended; the current candle (same start_time) is merged in place.
 */
export function useCandles(
  symbol: Symbol | undefined,
  resolution: Resolution = "1m",
): { candles: Candle[]; last: Candle | null } {
  const [candles, setCandles] = useState<Candle[]>([]);
  const lastRef = useRef<Candle | null>(null);

  useEffect(() => {
    if (!symbol) return;
    setCandles([]);
    lastRef.current = null;
    const channel = `candlestick_${resolution}` as ChannelName;
    const unsub = socket.subscribe(channel, symbol, (msg) => {
      if (msg.type !== "candlestick") return;
      const c = parseCandle(msg);
      lastRef.current = c;
      setCandles((prev) => {
        if (prev.length === 0) return [c];
        const last = prev[prev.length - 1];
        if (last.time === c.time) {
          // Same candle, update in place (immutable).
          const next = prev.slice();
          next[next.length - 1] = c;
          return next;
        }
        // New candle.
        const next = prev.concat(c);
        return next.length > MAX_CANDLES
          ? next.slice(next.length - MAX_CANDLES)
          : next;
      });
    });
    return () => unsub();
  }, [symbol, resolution]);

  return { candles, last: lastRef.current };
}
