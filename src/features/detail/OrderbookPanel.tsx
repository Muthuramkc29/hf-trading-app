import { useMemo } from "react";
import { useOrderbook } from "@/hooks/useOrderbook";
import type { Symbol } from "@/types/messages";
import { SYMBOL_META } from "@/types/messages";
import { OrderbookRow } from "./OrderbookRow";
import { formatPrice, formatPercent } from "@/lib/format";

interface Props {
  symbol: Symbol;
  depth?: number;
}

export function OrderbookPanel({ symbol, depth = 10 }: Props) {
  const snapshot = useOrderbook(symbol, depth);
  const priceDecimals = SYMBOL_META[symbol].priceDecimals;

  // Max cumulative total across BOTH sides defines the depth-bar scale,
  // so bids and asks share a comparable visual width.
  const maxTotal = useMemo(() => {
    if (!snapshot) return 0;
    const lastBid = snapshot.bids[snapshot.bids.length - 1]?.total ?? 0;
    const lastAsk = snapshot.asks[snapshot.asks.length - 1]?.total ?? 0;
    return Math.max(lastBid, lastAsk, 1);
  }, [snapshot]);

  return (
    <section
      className="rounded-lg border border-border bg-surface flex flex-col min-h-[440px]"
      aria-label="Orderbook"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h2 className="text-sm font-semibold">Orderbook</h2>
        <div className="text-[10px] uppercase tracking-wider text-muted">
          Top {depth}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 px-3 py-1 text-[10px] uppercase tracking-wider text-muted border-b border-border">
        <div>Price</div>
        <div className="text-right">Size</div>
        <div className="text-right">Total</div>
      </div>

      {!snapshot ? (
        <div className="flex-1 flex items-center justify-center text-xs text-muted">
          Awaiting orderbook…
        </div>
      ) : (
        <>
          {/* Asks: shown reversed so the best ask sits adjacent to the spread row */}
          <div className="py-1">
            {[...snapshot.asks].reverse().map((level, i) => (
              <OrderbookRow
                key={`a-${i}-${level.price}`}
                level={level}
                side="ask"
                depthPct={(level.total / maxTotal) * 100}
                priceDecimals={priceDecimals}
              />
            ))}
          </div>

          <div className="px-3 py-1.5 border-y border-border bg-surface-2 text-xs flex items-center justify-between num">
            <span className="text-muted">Spread</span>
            <span className="font-medium">
              {formatPrice(snapshot.spread, priceDecimals)} (
              {formatPercent(snapshot.spreadPct, 3)})
            </span>
          </div>

          <div className="py-1">
            {snapshot.bids.map((level, i) => (
              <OrderbookRow
                key={`b-${i}-${level.price}`}
                level={level}
                side="bid"
                depthPct={(level.total / maxTotal) * 100}
                priceDecimals={priceDecimals}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
