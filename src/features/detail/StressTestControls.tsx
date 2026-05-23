import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  PRESETS,
  setIntervals,
  type StressPreset,
} from "@/api/intervals";
import { cx } from "@/lib/classNames";

const KEY = "crypto-tracker:stress";

function loadPreset(): StressPreset {
  return (localStorage.getItem(KEY) as StressPreset) || "normal";
}

export function StressTestControls() {
  const [current, setCurrent] = useState<StressPreset>(loadPreset);
  const mutation = useMutation({
    mutationFn: (preset: StressPreset) => setIntervals(PRESETS[preset]),
    onSuccess: (_data, preset) => {
      localStorage.setItem(KEY, preset);
      setCurrent(preset);
    },
  });

  return (
    <section className="rounded-lg border border-border bg-surface px-3 py-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold">Stress Test</h2>
          <p className="text-xs text-muted">
            Adjusts the mock server's update frequency via{" "}
            <span className="font-mono text-[11px]">POST /intervals</span>.
          </p>
        </div>
        <div className="inline-flex rounded-md border border-border bg-surface-2 p-0.5">
          {(["normal", "fast", "extreme"] as StressPreset[]).map((p) => (
            <button
              key={p}
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(p)}
              className={cx(
                "px-3 py-1.5 text-xs font-medium rounded transition capitalize",
                current === p
                  ? "bg-text text-bg shadow-sm"
                  : "text-muted hover:text-text",
                mutation.isPending && "opacity-60 cursor-wait",
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      {mutation.isError && (
        <p className="mt-2 text-xs text-down">
          Failed to update intervals: {(mutation.error as Error).message}
        </p>
      )}
    </section>
  );
}
