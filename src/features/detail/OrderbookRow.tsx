import { memo } from "react";
import type { OrderbookLevel } from "@/types/domain";
import { formatPrice, formatSize } from "@/lib/format";
import { cx } from "@/lib/classNames";

interface Props {
  level: OrderbookLevel;
  side: "bid" | "ask";
  /** Width % of the depth bar, 0–100. */
  depthPct: number;
  priceDecimals: number;
}

function OrderbookRowImpl({ level, side, depthPct, priceDecimals }: Props) {
  return (
    <div className="relative grid grid-cols-3 gap-2 px-3 py-0.5 text-xs num">
      <div
        className={cx(
          "depth-bar",
          side === "bid" ? "bg-up/10" : "bg-down/10",
        )}
        style={{ width: `${depthPct}%` }}
        aria-hidden="true"
      />
      <div
        className={cx(
          "relative z-[1]",
          side === "bid" ? "text-up" : "text-down",
        )}
      >
        {formatPrice(level.price, priceDecimals)}
      </div>
      <div className="relative z-[1] text-right">{formatSize(level.size)}</div>
      <div className="relative z-[1] text-right text-muted">
        {formatSize(level.total)}
      </div>
    </div>
  );
}

export const OrderbookRow = memo(OrderbookRowImpl, (prev, next) => {
  // Re-render only when something visible to this row changes.
  return (
    prev.side === next.side &&
    prev.priceDecimals === next.priceDecimals &&
    prev.depthPct === next.depthPct &&
    prev.level.price === next.level.price &&
    prev.level.size === next.level.size &&
    prev.level.total === next.level.total
  );
});
