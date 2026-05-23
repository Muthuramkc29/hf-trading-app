import { create } from "zustand";

type Theme = "light" | "dark";
const KEY = "crypto-tracker:theme";

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  set: (t: Theme) => void;
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",
  toggle: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    apply(next);
    localStorage.setItem(KEY, next);
    set({ theme: next });
  },
  set: (t) => {
    apply(t);
    localStorage.setItem(KEY, t);
    set({ theme: t });
  },
}));

export function initTheme() {
  const stored = localStorage.getItem(KEY) as Theme | null;
  const preferred: Theme =
    stored ??
    (window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light");
  apply(preferred);
  useThemeStore.setState({ theme: preferred });
}
