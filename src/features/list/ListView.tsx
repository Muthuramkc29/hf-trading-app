import { useMemo, useState } from "react";
import { useTickerMap } from "@/hooks/useTickerMap";
import { useFavoritesStore } from "@/store/favorites.store";
import { SYMBOL_META, SYMBOLS, type Symbol } from "@/types/messages";
import { TickerRow } from "./TickerRow";
import { cx } from "@/lib/classNames";

type Filter = "all" | "favorites";

export function ListView() {
  useTickerMap();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const favorites = useFavoritesStore((s) => s.favorites);

  const filteredSymbols = useMemo<Symbol[]>(() => {
    const q = query.trim().toLowerCase();
    let pool: Symbol[] =
      filter === "favorites"
        ? SYMBOLS.filter((s) => favorites.includes(s))
        : [...SYMBOLS];
    if (q) {
      pool = pool.filter(
        (s) =>
          s.toLowerCase().includes(q) ||
          SYMBOL_META[s].name.toLowerCase().includes(q),
      );
    }
    return pool;
  }, [filter, favorites, query]);

  return (
    <section className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <h1 className="text-lg font-semibold">Markets</h1>
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="inline-flex rounded-md border border-border bg-surface-2 p-0.5 self-start">
            <FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>
              All
            </FilterBtn>
            <FilterBtn
              active={filter === "favorites"}
              onClick={() => setFilter("favorites")}
            >
              ★ Favorites
            </FilterBtn>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder="Search by name or symbol…"
            className="flex-1 min-w-0 rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs uppercase tracking-wider text-muted bg-surface-2 border-b border-border">
        <div className="col-span-5 sm:col-span-4">Symbol</div>
        <div className="col-span-4 sm:col-span-3 text-right">Last Price</div>
        <div className="col-span-3 sm:col-span-2 text-right">24h Change</div>
        <div className="hidden sm:block col-span-3 text-right">Volume</div>
      </div>

      {filteredSymbols.length === 0 ? (
        <div className="px-4 py-10 text-center text-muted text-sm">
          {filter === "favorites" && favorites.length === 0
            ? "No favorites yet — tap the ★ on any market to add it."
            : "No matches."}
        </div>
      ) : (
        <ul role="list">
          {filteredSymbols.map((symbol) => (
            <li key={symbol}>
              <TickerRow symbol={symbol} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FilterBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "px-3 py-1.5 text-xs font-medium rounded transition",
        active
          ? "bg-text text-bg shadow-sm"
          : "text-muted hover:text-text",
      )}
    >
      {children}
    </button>
  );
}
