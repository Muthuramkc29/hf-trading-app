import { useParams, Navigate } from "react-router-dom";
import { SYMBOLS, type Symbol } from "@/types/messages";
import { useTicker } from "@/hooks/useTicker";
import { DetailHeader } from "./DetailHeader";
import { TickerStats } from "./TickerStats";
import { OrderbookPanel } from "./OrderbookPanel";
import { TradesPanel } from "./TradesPanel";
import { StressTestControls } from "./StressTestControls";

function isSymbol(s: string | undefined): s is Symbol {
  return !!s && (SYMBOLS as readonly string[]).includes(s);
}

export function DetailView() {
  const { symbol } = useParams<{ symbol: string }>();
  if (!isSymbol(symbol)) return <Navigate to="/" replace />;

  return (
    <DetailViewInner symbol={symbol} />
  );
}

function DetailViewInner({ symbol }: { symbol: Symbol }) {
  const ticker = useTicker(symbol);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-surface overflow-hidden">
        <DetailHeader symbol={symbol} ticker={ticker} />
        <TickerStats symbol={symbol} ticker={ticker} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
          <OrderbookPanel symbol={symbol} depth={10} />
          <TradesPanel symbol={symbol} />
        </div>
      </section>

      <StressTestControls />
    </div>
  );
}
