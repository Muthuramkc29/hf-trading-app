import { useEffect, useState } from "react";
import { socket } from "@/api/socket";
import type { Symbol } from "@/types/messages";
import { parseTicker } from "@/lib/parse";
import type { Ticker } from "@/types/domain";
import { createRafBatcher } from "@/lib/rafBatch";

/**
 * Single-symbol ticker subscription, RAF-batched (60fps cap).
 * Used on the detail view where we want responsive updates but bounded renders.
 */
export function useTicker(symbol: Symbol | undefined): Ticker | null {
  const [ticker, setTicker] = useState<Ticker | null>(null);

  useEffect(() => {
    if (!symbol) return;

    let latest: Ticker | null = null;
    const batcher = createRafBatcher(() => {
      if (latest) setTicker(latest);
    });

    const unsub = socket.subscribe("v2/ticker", symbol, (msg) => {
      if (msg.type !== "v2/ticker") return;
      latest = parseTicker(msg);
      batcher.schedule();
    });
    
    return () => {
      unsub();
      batcher.cancel();
    };
  }, [symbol]);

  return ticker;
}
