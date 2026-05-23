const HTTP_URL =
  (import.meta as unknown as { env: { VITE_HTTP_URL?: string } }).env
    ?.VITE_HTTP_URL ?? "http://localhost:3000";

export interface IntervalRange {
  min: number;
  max: number;
}

export type IntervalsConfig = Partial<
  Record<"all_trades" | "l2_orderbook" | "v2/ticker" | "candlestick", IntervalRange>
>;

export type StressPreset = "normal" | "fast" | "extreme";

export const PRESETS: Record<StressPreset, IntervalsConfig> = {
  normal: {
    all_trades: { min: 200, max: 400 },
    l2_orderbook: { min: 200, max: 400 },
    "v2/ticker": { min: 200, max: 400 },
    candlestick: { min: 200, max: 400 },
  },
  fast: {
    all_trades: { min: 50, max: 100 },
    l2_orderbook: { min: 50, max: 100 },
    "v2/ticker": { min: 50, max: 100 },
    candlestick: { min: 50, max: 100 },
  },
  extreme: {
    all_trades: { min: 5, max: 20 },
    l2_orderbook: { min: 10, max: 40 },
    "v2/ticker": { min: 10, max: 50 },
    candlestick: { min: 5, max: 20 },
  },
};

export async function getIntervals(): Promise<IntervalsConfig> {
  const res = await fetch(`${HTTP_URL}/intervals`);
  if (!res.ok) throw new Error(`GET /intervals failed: ${res.status}`);
  return res.json();
}

export async function setIntervals(cfg: IntervalsConfig): Promise<IntervalsConfig> {
  const res = await fetch(`${HTTP_URL}/intervals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cfg),
  });
  if (!res.ok) throw new Error(`POST /intervals failed: ${res.status}`);
  return res.json();
}
