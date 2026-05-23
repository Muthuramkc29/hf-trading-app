import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Symbol } from "@/types/messages";

interface FavoritesState {
  favorites: Symbol[];
  toggle: (s: Symbol) => void;
  has: (s: Symbol) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggle: (s) =>
        set((state) => {
          const has = state.favorites.includes(s);
          return {
            favorites: has
              ? state.favorites.filter((x) => x !== s)
              : [...state.favorites, s],
          };
        }),
      has: (s) => get().favorites.includes(s),
    }),
    { name: "crypto-tracker:favorites" },
  ),
);
