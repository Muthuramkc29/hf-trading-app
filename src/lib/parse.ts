import type {
  WireTicker,
  WireOrderbook,
  WireTrade,
  WireCandle,
} from "@/types/messages";
import type {
  Ticker,
  OrderbookLevel,
  OrderbookSnapshot,
  Trade,
  Candle,
} from "@/types/domain";

const num = (v: string | number | undefined): number => {
  if (v === undefined || v === null) return NaN;
  return typeof v === "number" ? v : parseFloat(v);
};

/**
 * Normalize a server timestamp (which can be ms or µs depending on channel)
 * to milliseconds. Anything above ~1e14 is microseconds.
 */
const toMs = (ts: number): number => (ts > 1e14 ? Math.floor(ts / 1000) : ts);

export function parseTicker(w: WireTicker): Ticker {
  const open = num(w.open);
  const close = num(w.close);
  const changePct = open ? ((close - open) / open) * 100 : 0;
  return {
    symbol: w.symbol,
    markPrice: num(w.mark_price),
    lastPrice: close,
    open,
    high: num(w.high),
    low: num(w.low),
    volume: num(w.volume),
    fundingRate: num(w.funding_rate),
    bestBid: num(w.quotes?.best_bid),
    bestAsk: num(w.quotes?.best_ask),
    changePct,
    timestamp: toMs(w.timestamp),
  };
}

/**
 * Build top-N orderbook with cumulative totals.
 * - Bids: sorted high→low, totals are cumulative from top.
 * - Asks: sorted low→high, totals are cumulative from top.
 * The server already sends 500-level sorted snapshots, so we just slice and
 * compute cumulative size — no full re-sort per tick.
 */
export function parseOrderbook(
  w: WireOrderbook,
  depth: number,
): OrderbookSnapshot {
  const bids: OrderbookLevel[] = [];
  let bidTotal = 0;
  for (let i = 0; i < Math.min(depth, w.bids.length); i++) {
    const price = num(w.bids[i][0]);
    const size = num(w.bids[i][1]);
    bidTotal += size;
    bids.push({ price, size, total: bidTotal });
  }
  const asks: OrderbookLevel[] = [];
  let askTotal = 0;
  for (let i = 0; i < Math.min(depth, w.asks.length); i++) {
    const price = num(w.asks[i][0]);
    const size = num(w.asks[i][1]);
    askTotal += size;
    asks.push({ price, size, total: askTotal });
  }
  const bestBid = bids[0]?.price ?? NaN;
  const bestAsk = asks[0]?.price ?? NaN;
  const spread = bestAsk - bestBid;
  const midPrice = (bestBid + bestAsk) / 2;
  const spreadPct = midPrice ? (spread / midPrice) * 100 : 0;
  return {
    symbol: w.symbol,
    bids,
    asks,
    spread,
    spreadPct,
    midPrice,
    timestamp: toMs(w.timestamp),
  };
}

export function parseTrade(w: WireTrade): Trade {
  const price = num(w.price);
  const size = num(w.size);
  // Buyer is taker (aggressor) on a buy; if buyer_role === 'taker', side='buy'.
  // Fallback: trades with buyer_role='taker' or seller_role='maker' are buys.
  const side: Trade["side"] = w.buyer_role === "taker" ? "buy" : "sell";
  return {
    id: `${w.timestamp}-${w.price}-${w.size}`,
    symbol: w.symbol,
    price,
    size,
    side,
    timestamp: toMs(w.timestamp),
  };
}

export function parseCandle(w: WireCandle): Candle {
  return {
    time: Math.floor(toMs(w.candle_start_time) / 1000), // → seconds (lwc convention)
    open: num(w.open),
    high: num(w.high),
    low: num(w.low),
    close: num(w.close),
    volume: num(w.volume),
  };
}
