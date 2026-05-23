# Crypto Price Tracker

Real-time crypto market UI built against the [`saxenanickk/socket-custom-load`](https://github.com/saxenanickk/socket-custom-load) mock WebSocket server. React 18 + TypeScript (strict), Vite, Zustand, TanStack Query, Tailwind CSS, lightweight-charts, Jest + React Testing Library.

## Quick start

You need **two** processes: the mock server and the app.

### 1. Mock server (`./server`)

Already cloned alongside the app. Requires [Bun](https://bun.sh/).

```bash
# from repo root
cd server
bun install
bun start            # WebSocket :8080, HTTP :3000
```

If you don't have Bun: `curl -fsSL https://bun.sh/install | bash`.

### 2. App

```bash
# from repo root
npm install
npm start            # http://localhost:5173
```

Override the WS/HTTP endpoints if needed via `.env` (see `.env.example`).

```
VITE_WS_URL=ws://localhost:8080
VITE_HTTP_URL=http://localhost:3000
```

### Tests

```bash
npm test
```

## What's in the box

- **List view** (`/`): all 6 perpetuals with live last price, 24h change, volume; search by name/symbol; All / ★ Favorites filter; favorites persisted in `localStorage`.
- **Detail view** (`/symbol/:symbol`): live ticker (mark, 24h high/low, volume, funding rate), 10-deep orderbook with depth bars + spread, last 30 trades with side-coloured flash-in animation, 1-minute candlestick chart, **Stress Test** controls (Normal / Fast / Extreme — re-tunes the server via `POST /intervals`).
- **Connection badge** in the header: idle / connecting / connected / reconnecting (with attempt #) / offline.
- **Light + dark** themes (system-preferred on first load, persisted thereafter).
- **Responsive** down to 375 px; the orderbook + trades stack vertically below `lg`.

## Architecture

```
src/
  api/
    socket.ts         WS singleton, ref-counted subs, exponential reconnect
    intervals.ts      GET/POST /intervals
  hooks/
    useTickerMap      list view: throttled per-symbol writes to tickers store
    useTicker         detail view: RAF-batched single-symbol ticker
    useOrderbook      RAF-batched top-N orderbook with cumulative totals
    useTrades         RAF-flushed ring buffer (max 30)
    useCandles        seeds + live-updates 1m bars
  store/              zustand: connection, tickers, favorites (persisted), theme
  features/list/      ListView, TickerRow (memoized, per-symbol selector)
  features/detail/    DetailView, OrderbookPanel, TradesPanel, MiniChart, StressTestControls
  lib/                format, parse (wire → domain), rafBatch, throttle
  types/              messages (wire), domain (parsed)
```

### One WebSocket, many subscribers

`api/socket.ts` owns the only `WebSocket`. Each `subscribe(channel, symbol, listener)` call increments a per-`(channel, symbol)` reference count and only emits a `{type: subscribe}` frame on the **0 → 1** transition (and one `unsubscribe` on **1 → 0**). The list view and detail view can both ask for `v2/ticker:BTCUSD` and the server only sees a single subscribe.

On disconnect we replay every currently-active key in a single coalesced frame and apply exponential backoff with jitter (250 ms → 4 s). The outgoing frame queue is flushed on `open`.

## Performance plan

The mock server is brutal by default: `l2_orderbook` ships **500-level full snapshots** every 10–40 ms, `v2/ticker` every 10–50 ms, `all_trades` every 5–20 ms. Naively wiring these into React state would attempt 50+ commits per second on each panel — pure waste, the screen only paints at ~60 Hz.

| Concern | Mitigation |
| --- | --- |
| Orderbook re-render storm | Listener writes the latest parsed snapshot to a closure variable and `requestAnimationFrame`s a single state commit. Bursty inputs collapse to **≤ 1 render per frame** regardless of message rate. The hook slices to top-N (default 10) and computes cumulative totals once, before React state sees the data — we never push 500 levels through the reconciler. |
| Trades flicker | Ring buffer in a ref (max 30), RAF flush. Stable `id` keys keep React reusing rows; only the freshly mounted top row plays a CSS `@keyframes` flash. No JS animation, no extra renders. |
| Ticker fan-out (6 symbols × 50 Hz) | Per-symbol **trailing throttle** to 200 ms before writing to the Zustand `tickers` store. Each `TickerRow` subscribes with a **selector** (`tickers[symbol]`), so updates to one row never re-render the others. |
| Memoization | `TickerRow`, `OrderbookRow`, `TradeRow` are all `React.memo`'d with shallow prop equality; the orderbook row uses a custom comparator on visible fields. |
| Chart | Canvas-backed `lightweight-charts` — handles 60 Hz `update()` calls natively, no DOM blow-up. |
| Search | Filters in-memory (6 entries) inside `useMemo`. Trivially cheap but keeps the pattern correct if the symbol list grows. |
| Memory | Every hook returns the `socket.subscribe` unsubscribe and calls it in cleanup. No global timers without cleanup. RAF handles are cancelled on unmount. Verified clean under React StrictMode (double-mount). |

### Verifying it under stress

1. In the app, open BTCUSD's detail view.
2. Click **Extreme** in the Stress Test panel — server now ticks every 5–50 ms.
3. Open Chrome DevTools → Performance. Recording for 10 s should show:
   - One commit-per-frame for the orderbook (≤ 16.6 ms each).
   - Stable heap; no growth across multiple navigations between products.
4. Kill the server (`Ctrl-C` in `bun start`) — badge flips to **Reconnecting**, retries with jittered backoff. Restart `bun start`; subscriptions auto-replay, no manual refresh.

## Type safety

- `src/types/messages.ts` mirrors the **wire format** exactly (prices as strings, timestamps as microseconds where the server emits them).
- `src/types/domain.ts` is the **parsed shape** components consume (numbers, ms).
- Parsing happens once at the socket boundary (`src/lib/parse.ts`) — components never see strings.

## Tests

- `src/lib/format.test.ts` — number/volume/percent formatting.
- `src/lib/parse.test.ts` — wire → domain conversions, including µs timestamp normalization.
- `src/hooks/useOrderbook.test.tsx` — verifies the RAF-batched commit and that bursts coalesce into a single render.
- `src/features/list/TickerRow.test.tsx` — render correctness, up/down colour class, favorite toggle.

`jest.config.cjs` uses `ts-jest` with `jsdom`, `identity-obj-proxy` for CSS, and a polyfilled rAF.

## What I'd do with more time

- Web worker for parsing 500-level orderbook snapshots — keep the main thread under the 16 ms budget even with N = 50 levels visible.
- Virtualize the trades list (e.g. `react-virtual`) once the cap goes above ~100.
- Per-row sparklines on the list view fed by `candlestick_1m`.
- Heartbeat-driven "stale data" surface — show a warning if a subscribed channel goes silent > 3 s while the socket is still open.
- Wider test coverage: `socket.ts` reconnect path under a fake WS, error boundary recovery, theme persistence.
- Accessibility audit: focus order, ARIA live regions for price updates that don't spam SRs.
