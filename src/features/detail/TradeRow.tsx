import { memo } from "react";
import type { Trade } from "@/types/domain";
import { formatPrice, formatSize, formatTime } from "@/lib/format";
import { cx } from "@/lib/classNames";

interface Props {
  trade: Trade;
  priceDecimals: number;
  /** Whether to play the flash-in animation. Only the latest row should. */
  fresh: boolean;
}

function TradeRowImpl({ trade, priceDecimals, fresh }: Props) {
  const colorClass = trade.side === "buy" ? "text-up" : "text-down";
  const animClass =
    fresh && trade.side === "buy"
      ? "animate-flash-up"
      : fresh
        ? "animate-flash-down"
        : "";
  return (
    <div
      className={cx(
        "grid grid-cols-12 gap-2 px-3 py-1 text-xs num",
        animClass,
      )}
    >
      <div className={cx("col-span-4", colorClass)}>
        {formatPrice(trade.price, priceDecimals)}
      </div>
      <div className="col-span-3 text-right">{formatSize(trade.size)}</div>
      <div className={cx("col-span-2 uppercase font-medium", colorClass)}>
        {trade.side}
      </div>
      <div className="col-span-3 text-right text-muted">
        {formatTime(trade.timestamp)}
      </div>
    </div>
  );
}

export const TradeRow = memo(TradeRowImpl);
