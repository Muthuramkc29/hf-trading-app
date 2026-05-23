import { memo } from "react";
import { Link } from "react-router-dom";
import { useTickersStore } from "@/store/tickers.store";
import { SYMBOL_META, type Symbol } from "@/types/messages";
import {
  formatPercent,
  formatPriceUsd,
  formatVolume,
} from "@/lib/format";
import { StarToggle } from "@/components/StarToggle";
import { cx } from "@/lib/classNames";

interface Props {
  symbol: Symbol;
}

function TickerRowImpl({ symbol }: Props) {
  // Selector: this row only re-renders when its own ticker changes.
  const ticker = useTickersStore((s) => s.tickers[symbol]);
  const meta = SYMBOL_META[symbol];

  const change = ticker?.changePct ?? 0;
  const changeClass =
    change > 0 ? "text-up" : change < 0 ? "text-down" : "text-muted";

  return (
    <Link
      to={`/symbol/${symbol}`}
      className="grid grid-cols-12 items-center gap-2 px-4 py-3 hover:bg-surface-2 transition border-b border-border last:border-b-0"
    >
      <div className="col-span-5 sm:col-span-4 flex items-center gap-3 min-w-0">
        <StarToggle symbol={symbol} />
        <div className="min-w-0">
          <div className="font-semibold text-text truncate">{symbol}</div>
          <div className="text-xs text-muted truncate">{meta.name}</div>
        </div>
      </div>
      <div className="col-span-4 sm:col-span-3 text-right num font-medium">
        {ticker
          ? formatPriceUsd(ticker.lastPrice, meta.priceDecimals)
          : <span className="text-muted">—</span>}
      </div>
      <div className={cx("col-span-3 sm:col-span-2 text-right num font-medium", changeClass)}>
        {ticker ? formatPercent(change) : "—"}
      </div>
      <div className="hidden sm:block col-span-3 text-right num text-muted">
        {ticker ? formatVolume(ticker.volume) : "—"}
      </div>
    </Link>
  );
}

export const TickerRow = memo(TickerRowImpl);
