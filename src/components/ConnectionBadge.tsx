import { useConnectionStore } from "@/store/connection.store";
import { cx } from "@/lib/classNames";

const LABEL: Record<string, { dot: string; text: string }> = {
  idle: { dot: "bg-muted", text: "Idle" },
  connecting: { dot: "bg-accent animate-pulse", text: "Connecting…" },
  open: { dot: "bg-up", text: "Connected" },
  reconnecting: {
    dot: "bg-star animate-pulse",
    text: "Reconnecting…",
  },
  closed: { dot: "bg-down", text: "Offline" },
};

export function ConnectionBadge() {
  const status = useConnectionStore((s) => s.status);
  const retry = useConnectionStore((s) => s.retryAttempt);
  const meta = LABEL[status] ?? LABEL.idle;
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full bg-surface-2 border border-border px-3 py-1 text-xs font-medium"
      aria-live="polite"
      data-testid="connection-badge"
    >
      <span className={cx("h-2 w-2 rounded-full", meta.dot)} />
      <span className="text-text">{meta.text}</span>
      {status === "reconnecting" && retry > 0 && (
        <span className="text-muted">#{retry}</span>
      )}
    </div>
  );
}
