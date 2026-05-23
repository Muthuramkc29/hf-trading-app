import { Link } from "react-router-dom";
import type { Ticker } from "@/types/domain";
import { SYMBOL_META, type Symbol } from "@/types/messages";
import { StarToggle } from "@/components/StarToggle";
import { formatPercent, formatPriceUsd } from "@/lib/format";
import { cx } from "@/lib/classNames";

interface Props {
  symbol: Symbol;
  ticker: Ticker | null;
}

export function DetailHeader({ symbol, ticker }: Props) {
  const meta = SYMBOL_META[symbol];
  const change = ticker?.changePct ?? 0;
  const changeClass =
    change > 0 ? "text-up" : change < 0 ? "text-down" : "text-muted";

  return (
    <header className="border-b border-border px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-muted hover:text-text hover:bg-surface-2"
          >
            ← Back
          </Link>
          <div>
            <div className="text-xl font-semibold tracking-tight">{symbol}</div>
            <div className="text-xs text-muted">{meta.name} · Perpetual</div>
          </div>
        </div>
        <StarToggle symbol={symbol} size={22} />
      </div>
      <div className="mt-3 flex items-end gap-3 num">
        <div className="text-3xl sm:text-4xl font-bold">
          {ticker
            ? formatPriceUsd(ticker.lastPrice, meta.priceDecimals)
            : <span className="text-muted">—</span>}
        </div>
        <div className={cx("text-sm font-semibold pb-1", changeClass)}>
          {ticker ? formatPercent(change) : ""}
        </div>
      </div>
    </header>
  );
}
