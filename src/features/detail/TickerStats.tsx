import type { Ticker } from "@/types/domain";
import { SYMBOL_META, type Symbol } from "@/types/messages";
import {
  formatPercent,
  formatPriceUsd,
  formatVolume,
} from "@/lib/format";

interface Props {
  symbol: Symbol;
  ticker: Ticker | null;
}

export function TickerStats({ symbol, ticker }: Props) {
  const dp = SYMBOL_META[symbol].priceDecimals;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-3 px-4 py-4 border-b border-border">
      <Stat label="Mark Price" value={ticker ? formatPriceUsd(ticker.markPrice, dp) : "—"} />
      <Stat label="24h High" value={ticker ? formatPriceUsd(ticker.high, dp) : "—"} />
      <Stat label="24h Low" value={ticker ? formatPriceUsd(ticker.low, dp) : "—"} />
      <Stat label="24h Volume" value={ticker ? formatVolume(ticker.volume) : "—"} />
      <Stat label="Funding Rate" value={ticker ? formatPercent(ticker.fundingRate * 100, 4) : "—"} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className="num text-sm font-semibold text-text mt-0.5">{value}</div>
    </div>
  );
}
