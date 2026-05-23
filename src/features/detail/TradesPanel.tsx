import { useTrades } from "@/hooks/useTrades";
import { SYMBOL_META, type Symbol } from "@/types/messages";
import { TradeRow } from "./TradeRow";

interface Props {
  symbol: Symbol;
}

export function TradesPanel({ symbol }: Props) {
  const trades = useTrades(symbol);
  const priceDecimals = SYMBOL_META[symbol].priceDecimals;

  return (
    <section
      className="rounded-lg border border-border bg-surface flex flex-col min-h-[440px]"
      aria-label="Recent trades"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h2 className="text-sm font-semibold">Recent Trades</h2>
        <div className="text-[10px] uppercase tracking-wider text-muted">
          Last {trades.length || 0}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-2 px-3 py-1 text-[10px] uppercase tracking-wider text-muted border-b border-border">
        <div className="col-span-4">Price</div>
        <div className="col-span-3 text-right">Size</div>
        <div className="col-span-2">Side</div>
        <div className="col-span-3 text-right">Time</div>
      </div>

      {trades.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-muted">
          Awaiting trades…
        </div>
      ) : (
        <div className="py-1 overflow-y-auto">
          {trades.map((t, idx) => (
            <TradeRow
              key={t.id}
              trade={t}
              priceDecimals={priceDecimals}
              fresh={idx === 0}
            />
          ))}
        </div>
      )}
    </section>
  );
}
