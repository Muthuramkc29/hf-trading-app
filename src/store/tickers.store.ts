import { create } from "zustand";
import type { Symbol } from "@/types/messages";
import type { Ticker } from "@/types/domain";

interface TickersState {
  tickers: Partial<Record<Symbol, Ticker>>;
  set: (s: Symbol, t: Ticker) => void;
}

export const useTickersStore = create<TickersState>((set) => ({
  tickers: {},
  set: (s, t) =>
    set((state) => ({ tickers: { ...state.tickers, [s]: t } })),
}));
