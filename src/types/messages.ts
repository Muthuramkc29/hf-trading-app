/**
 * Wire-format types — exactly what the mock server emits.
 * All numeric fields arrive as strings; orderbook timestamps are in microseconds.
 */

export const SYMBOLS = [
  "BTCUSD",
  "ETHUSD",
  "XRPUSD",
  "SOLUSD",
  "PAXGUSD",
  "DOGEUSD",
] as const;

export type Symbol = (typeof SYMBOLS)[number];

export const SYMBOL_META: Record<Symbol, { name: string; priceDecimals: number }> = {
  BTCUSD: { name: "Bitcoin", priceDecimals: 1 },
  ETHUSD: { name: "Ethereum", priceDecimals: 2 },
  XRPUSD: { name: "XRP", priceDecimals: 4 },
  SOLUSD: { name: "Solana", priceDecimals: 4 },
  PAXGUSD: { name: "PAX Gold", priceDecimals: 2 },
  DOGEUSD: { name: "Dogecoin", priceDecimals: 6 },
};

export type ChannelName =
  | "v2/ticker"
  | "l2_orderbook"
  | "all_trades"
  | `candlestick_${"1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w"}`;

export interface SubscribeFrame {
  type: "subscribe" | "unsubscribe";
  payload: {
    channels: Array<{ name: ChannelName; symbols?: Symbol[] }>;
  };
}

export interface WireTicker {
  type: "v2/ticker";
  symbol: Symbol;
  mark_price: string;
  spot_price: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume?: number | string;
  turnover_usd?: number;
  funding_rate: string;
  timestamp: number;
  quotes: {
    best_ask: string;
    best_bid: string;
    ask_size: string;
    bid_size: string;
  };
}

export interface WireOrderbook {
  type: "l2_orderbook";
  symbol: Symbol;
  timestamp: number; // microseconds
  bids: Array<[string, string]>; // [price, size]
  asks: Array<[string, string]>;
}

export interface WireTrade {
  type: "all_trades";
  symbol: Symbol;
  price: string;
  size: string;
  timestamp: number;
  buyer_role: string;
  seller_role: string;
  product_id?: string;
}

export interface WireCandle {
  type: "candlestick";
  symbol: Symbol;
  resolution: string;
  candle_start_time: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  timestamp: number;
}

export interface SubscriptionsAck {
  type: "subscriptions";
  payload: { channels: Array<{ name: ChannelName; symbols: Symbol[] }> };
}

export type IncomingMessage =
  | WireTicker
  | WireOrderbook
  | WireTrade
  | WireCandle
  | SubscriptionsAck;
