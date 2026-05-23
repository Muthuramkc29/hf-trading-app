import type { Symbol } from "./messages";

/**
 * Domain (parsed) types — what components and hooks consume.
 * Strings → numbers; microsecond timestamps → milliseconds.
 */

export interface Ticker {
  symbol: Symbol;
  markPrice: number;
  lastPrice: number; // close
  open: number;
  high: number;
  low: number;
  volume: number;
  fundingRate: number;
  bestBid: number;
  bestAsk: number;
  changePct: number; // (close - open) / open * 100
  timestamp: number; // ms
}

export interface OrderbookLevel {
  price: number;
  size: number;
  total: number; // cumulative size from top of book
}

export interface OrderbookSnapshot {
  symbol: Symbol;
  bids: OrderbookLevel[]; // top-N, sorted desc by price
  asks: OrderbookLevel[]; // top-N, sorted asc by price
  spread: number;
  spreadPct: number;
  midPrice: number;
  timestamp: number; // ms
}

export type TradeSide = "buy" | "sell";

export interface Trade {
  id: string; // synthetic, derived from timestamp+price+size
  symbol: Symbol;
  price: number;
  size: number;
  side: TradeSide;
  timestamp: number; // ms
}

export interface Candle {
  time: number; // seconds (lightweight-charts convention)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "open"
  | "reconnecting"
  | "closed";
