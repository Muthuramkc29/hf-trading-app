import { parseOrderbook, parseTicker, parseTrade } from "./parse";
import type {
  WireOrderbook,
  WireTicker,
  WireTrade,
} from "@/types/messages";

describe("parseOrderbook", () => {
  test("slices top-N and computes cumulative totals", () => {
    const wire: WireOrderbook = {
      type: "l2_orderbook",
      symbol: "BTCUSD",
      timestamp: 1_700_000_000_000_000, // µs
      bids: [
        ["100.0", "1"],
        ["99.5", "2"],
        ["99.0", "3"],
        ["98.5", "4"],
      ],
      asks: [
        ["100.5", "1"],
        ["101.0", "2"],
        ["101.5", "3"],
      ],
    };
    const snap = parseOrderbook(wire, 3);
    expect(snap.bids).toEqual([
      { price: 100, size: 1, total: 1 },
      { price: 99.5, size: 2, total: 3 },
      { price: 99, size: 3, total: 6 },
    ]);
    expect(snap.asks).toEqual([
      { price: 100.5, size: 1, total: 1 },
      { price: 101, size: 2, total: 3 },
      { price: 101.5, size: 3, total: 6 },
    ]);
    expect(snap.spread).toBeCloseTo(0.5);
    expect(snap.midPrice).toBeCloseTo(100.25);
    // µs timestamp normalized to ms
    expect(snap.timestamp).toBe(1_700_000_000_000);
  });

  test("handles fewer levels than requested depth", () => {
    const wire: WireOrderbook = {
      type: "l2_orderbook",
      symbol: "BTCUSD",
      timestamp: 1_700_000_000_000_000,
      bids: [["100", "1"]],
      asks: [["101", "2"]],
    };
    const snap = parseOrderbook(wire, 10);
    expect(snap.bids).toHaveLength(1);
    expect(snap.asks).toHaveLength(1);
  });
});

describe("parseTicker", () => {
  test("computes change percent from open/close", () => {
    const wire: WireTicker = {
      type: "v2/ticker",
      symbol: "BTCUSD",
      mark_price: "100.5",
      spot_price: "100.5",
      open: 100,
      close: 105,
      high: 110,
      low: 99,
      volume: 1_500_000,
      funding_rate: "0.0001",
      timestamp: 1_700_000_000_000_000,
      quotes: {
        best_ask: "100.6",
        best_bid: "100.4",
        ask_size: "5",
        bid_size: "5",
      },
    };
    const t = parseTicker(wire);
    expect(t.changePct).toBeCloseTo(5);
    expect(t.markPrice).toBe(100.5);
    expect(t.bestBid).toBe(100.4);
  });
});

describe("parseTrade", () => {
  test("buyer_role taker → buy side", () => {
    const wire: WireTrade = {
      type: "all_trades",
      symbol: "BTCUSD",
      price: "100.5",
      size: "0.5",
      timestamp: 1_700_000_000_000,
      buyer_role: "taker",
      seller_role: "maker",
    };
    const t = parseTrade(wire);
    expect(t.side).toBe("buy");
    expect(t.price).toBe(100.5);
    expect(t.size).toBe(0.5);
    expect(t.timestamp).toBe(1_700_000_000_000);
  });

  test("buyer_role maker → sell side", () => {
    const wire: WireTrade = {
      type: "all_trades",
      symbol: "BTCUSD",
      price: "100",
      size: "1",
      timestamp: 1_700_000_000_000,
      buyer_role: "maker",
      seller_role: "taker",
    };
    expect(parseTrade(wire).side).toBe("sell");
  });
});
