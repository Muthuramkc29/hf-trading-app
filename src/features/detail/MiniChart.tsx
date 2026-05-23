import { useEffect, useRef } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useCandles } from "@/hooks/useCandles";
import type { Symbol } from "@/types/messages";
import { useThemeStore } from "@/store/theme.store";

interface Props {
  symbol: Symbol;
}

/**
 * Canvas-backed candlestick chart — feeds the live `candlestick_1m` stream.
 * lightweight-charts handles 60+ updates/sec on its own; we just need to call
 * `update()` with the latest candle. No history endpoint is exposed by the
 * mock server, so the chart fills in over time as candles arrive.
 */
export function MiniChart({ symbol }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const theme = useThemeStore((s) => s.theme);
  const { candles, last } = useCandles(symbol, "1m");

  // Create chart once per symbol.
  useEffect(() => {
    if (!containerRef.current) return;
    const isDark = theme === "dark";
    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: isDark ? "#94a3b8" : "#64748b",
      },
      grid: {
        vertLines: { color: isDark ? "#1f2a3d" : "#eef0f4" },
        horzLines: { color: isDark ? "#1f2a3d" : "#eef0f4" },
      },
      timeScale: { timeVisible: true, secondsVisible: false },
      rightPriceScale: { borderColor: isDark ? "#243049" : "#e2e6ec" },
      crosshair: { mode: 0 },
    });
    const series = chart.addCandlestickSeries({
      upColor: "#16a34a",
      downColor: "#dc2626",
      borderUpColor: "#16a34a",
      borderDownColor: "#dc2626",
      wickUpColor: "#16a34a",
      wickDownColor: "#dc2626",
    });
    chartRef.current = chart;
    seriesRef.current = series;
    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [symbol, theme]);

  // Seed full history on mount / when candles array identity changes.
  useEffect(() => {
    if (!seriesRef.current) return;
    if (candles.length > 0) {
      seriesRef.current.setData(
        candles.map((c) => ({
          time: c.time as UTCTimestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        })),
      );
    }
    // We don't re-call setData on every new candle — only on first batch.
    // Live updates use the `last` effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles.length === 0]);

  // Live update the most recent bar — cheap on lightweight-charts.
  useEffect(() => {
    if (!seriesRef.current || !last) return;
    seriesRef.current.update({
      time: last.time as UTCTimestamp,
      open: last.open,
      high: last.high,
      low: last.low,
      close: last.close,
    });
  }, [last]);

  return (
    <section
      className="rounded-lg border border-border bg-surface"
      aria-label="Mini price chart"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h2 className="text-sm font-semibold">Price · 1m</h2>
        <span className="text-[10px] uppercase tracking-wider text-muted">
          live
        </span>
      </div>
      <div ref={containerRef} className="h-56 sm:h-64" />
    </section>
  );
}
