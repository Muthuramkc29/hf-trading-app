import { useFavoritesStore } from "@/store/favorites.store";
import type { Symbol } from "@/types/messages";
import { cx } from "@/lib/classNames";

interface Props {
  symbol: Symbol;
  size?: number;
}

export function StarToggle({ symbol, size = 18 }: Props) {
  const isFav = useFavoritesStore((s) => s.favorites.includes(symbol));
  const toggle = useFavoritesStore((s) => s.toggle);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggle(symbol);
      }}
      aria-label={isFav ? `Unfavorite ${symbol}` : `Favorite ${symbol}`}
      aria-pressed={isFav}
      className={cx(
        "inline-flex items-center justify-center transition",
        isFav ? "text-star" : "text-muted hover:text-star",
      )}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </button>
  );
}
