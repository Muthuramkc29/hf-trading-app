import { Outlet, Link } from "react-router-dom";
import { useSocketLifecycle } from "@/hooks/useSocketLifecycle";
import { ConnectionBadge } from "@/components/ConnectionBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export function App() {
  useSocketLifecycle();
  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-bg/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-lg font-semibold tracking-tight">
              <span className="text-accent">●</span> Live Price Tracker
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ConnectionBadge />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
      <footer className="border-t border-border py-3 text-center text-xs text-muted">
        Data from local mock server · WS {`ws://localhost:8080`}
      </footer>
    </div>
  );
}
