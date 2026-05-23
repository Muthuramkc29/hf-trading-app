import { useEffect, useState } from "react";
import { socket } from "@/api/socket";
import type { Symbol } from "@/types/messages";
import { parseOrderbook } from "@/lib/parse";
import type { OrderbookSnapshot } from "@/types/domain";
import { createRafBatcher } from "@/lib/rafBatch";

/**
 * Subscribes to l2_orderbook and emits top-N snapshots, RAF-coalesced.
 *
 * Why RAF: server sends FULL 500-level snapshots every 10–40 ms. Without
 * batching, React would attempt ~25–100 commits/sec — pure waste, the screen
 * only paints at ~60 Hz. We keep the latest snapshot in a closure variable
 * and let the RAF tick read it. Bursty inputs collapse to ≤ 1 render/frame.
 *
 * Why we slice in the hook (not in the component): keeping 500 levels in
 * React state would bloat memo equality checks and the reconciler. The hook
 * does the parse + slice once per frame; the component only ever sees N rows.
 */
export function useOrderbook(
  symbol: Symbol | undefined,
  depth = 10,
): OrderbookSnapshot | null {
  const [snapshot, setSnapshot] = useState<OrderbookSnapshot | null>(null);

  useEffect(() => {
    if (!symbol) return;
    
    setSnapshot(null);
    let latest: OrderbookSnapshot | null = null;
    
    const batcher = createRafBatcher(() => {
      if (latest) setSnapshot(latest);
    });

    const unsub = socket.subscribe("l2_orderbook", symbol, (msg) => {
      if (msg.type !== "l2_orderbook") return;
      latest = parseOrderbook(msg, depth);
      batcher.schedule();
    });

    return () => {
      unsub();
      batcher.cancel();
    };
  }, [symbol, depth]);

  return snapshot;
}
