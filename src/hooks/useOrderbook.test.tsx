import { act, render, screen, waitFor } from "@testing-library/react";
import { useOrderbook } from "./useOrderbook";
import { createFakeSocket } from "@/test/fakeSocket";
import type { WireOrderbook } from "@/types/messages";

jest.mock("@/api/socket", () => {
  const { createFakeSocket } = require("@/test/fakeSocket");
  return { socket: createFakeSocket() };
});

import { socket } from "@/api/socket";

function makeSnapshot(bids: number, asks: number): WireOrderbook {
  return {
    type: "l2_orderbook",
    symbol: "BTCUSD",
    timestamp: Date.now() * 1000,
    bids: Array.from({ length: bids }, (_, i) => [
      String(100 - i),
      String(i + 1),
    ]),
    asks: Array.from({ length: asks }, (_, i) => [
      String(101 + i),
      String(i + 1),
    ]),
  };
}

function Probe({ depth = 3 }: { depth?: number }) {
  const snap = useOrderbook("BTCUSD", depth);
  if (!snap) return <div data-testid="state">empty</div>;
  return (
    <div data-testid="state">
      bids:{snap.bids.length} asks:{snap.asks.length} top:
      {snap.bids[0]?.price ?? 0}
    </div>
  );
}

describe("useOrderbook", () => {
  test("starts empty and renders top-N snapshot after a RAF tick", async () => {
    render(<Probe depth={3} />);
    expect(screen.getByTestId("state").textContent).toBe("empty");

    act(() => {
      (socket as unknown as ReturnType<typeof createFakeSocket>).push(
        "l2_orderbook",
        "BTCUSD",
        makeSnapshot(10, 10),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("state").textContent).toContain("bids:3");
    });
    const text = screen.getByTestId("state").textContent ?? "";
    expect(text).toContain("asks:3");
    expect(text).toContain("top:100");
  });

  test("coalesces bursts: multiple snapshots between frames → one commit", async () => {
    const renders = jest.fn();
    function CountedProbe() {
      const snap = useOrderbook("BTCUSD", 3);
      renders();
      return <div data-testid="counted">{snap?.bids[0]?.price ?? "n"}</div>;
    }
    render(<CountedProbe />);
    const initialRenders = renders.mock.calls.length;

    act(() => {
      const fake = socket as unknown as ReturnType<typeof createFakeSocket>;
      fake.push("l2_orderbook", "BTCUSD", makeSnapshot(5, 5));
      fake.push("l2_orderbook", "BTCUSD", makeSnapshot(6, 6));
      fake.push("l2_orderbook", "BTCUSD", makeSnapshot(7, 7));
    });
    await waitFor(() => {
      expect(screen.getByTestId("counted").textContent).not.toBe("n");
    });

    // StrictMode-free harness: at most one extra render for the commit.
    expect(renders.mock.calls.length - initialRenders).toBeLessThanOrEqual(2);
  });
});
