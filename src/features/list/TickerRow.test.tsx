import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TickerRow } from "./TickerRow";
import { useTickersStore } from "@/store/tickers.store";
import { useFavoritesStore } from "@/store/favorites.store";
import type { Ticker } from "@/types/domain";

const baseTicker: Ticker = {
  symbol: "BTCUSD",
  markPrice: 96440,
  lastPrice: 96432.5,
  open: 94200,
  high: 97100,
  low: 94200,
  volume: 1_200_000_000,
  fundingRate: 0.0001,
  bestBid: 96430,
  bestAsk: 96435,
  changePct: 2.37,
  timestamp: Date.now(),
};

function renderWith(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("TickerRow", () => {
  beforeEach(() => {
    useTickersStore.setState({ tickers: { BTCUSD: baseTicker } });
    useFavoritesStore.setState({ favorites: [] });
  });

  test("renders symbol, last price, and 24h change with up color", () => {
    renderWith(<TickerRow symbol="BTCUSD" />);
    expect(screen.getByText("BTCUSD")).toBeInTheDocument();
    expect(screen.getByText("Bitcoin")).toBeInTheDocument();
    expect(screen.getByText(/\$96,432\.5/)).toBeInTheDocument();
    const pct = screen.getByText("+2.37%");
    expect(pct).toHaveClass("text-up");
  });

  test("favorite toggle flips state without navigating", () => {
    renderWith(<TickerRow symbol="BTCUSD" />);
    const star = screen.getByRole("button", { name: /favorite btcusd/i });
    fireEvent.click(star);
    expect(useFavoritesStore.getState().favorites).toContain("BTCUSD");
    // Toggle off
    fireEvent.click(star);
    expect(useFavoritesStore.getState().favorites).not.toContain("BTCUSD");
  });

  test("renders em-dash placeholders when no ticker yet", () => {
    useTickersStore.setState({ tickers: {} });
    renderWith(<TickerRow symbol="BTCUSD" />);
    expect(screen.getByText("BTCUSD")).toBeInTheDocument();
    // No price/percent shown
    expect(screen.queryByText(/\+\d/)).toBeNull();
  });
});
