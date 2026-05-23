import { useEffect, useState } from "react";
import { socket } from "@/api/socket";
import type { Symbol } from "@/types/messages";
import { parseTrade } from "@/lib/parse";
import type { Trade } from "@/types/domain";
import { createRafBatcher } from "@/lib/rafBatch";

const MAX_TRADES = 30;

/**
 * Subscribes to all_trades and returns the most recent N trades.
 *
 * Implementation: incoming trades accumulate in a ref-backed ring buffer; a
 * single RAF tick copies the buffer into React state, capped at MAX_TRADES.
 * The newest trade is always at index 0 so React can keep stable keys for
 * older rows and the CSS flash animation only triggers on the newly mounted
 * top row.
 */
export function useTrades(symbol: Symbol | undefined): Trade[] {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    if (!symbol) return;
    setTrades([]);
    
    let buffer: Trade[] = [];
    const batcher = createRafBatcher(() => {
      if (buffer.length === 0) return;
      // Prepend new, keep MAX_TRADES.
      setTrades((prev) => {
        const merged = buffer.concat(prev);
        buffer = [];
        return merged.length > MAX_TRADES
          ? merged.slice(0, MAX_TRADES)
          : merged;
      });
    });

    const unsub = socket.subscribe("all_trades", symbol, (msg) => {
      if (msg.type !== "all_trades") return;
      const t = parseTrade(msg);
      // Newest first.
      buffer.unshift(t);
      // Bound the buffer so a slow frame doesn't grow it unbounded.
      if (buffer.length > MAX_TRADES) buffer.length = MAX_TRADES;
      batcher.schedule();
    });

    return () => {
      unsub();
      batcher.cancel();
    };
  }, [symbol]);

  return trades;
}
