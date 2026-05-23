/**
 * Trailing-edge throttle: ensures the most recent call within the window
 * is eventually delivered (so the UI doesn't lag behind by an entire window).
 */
export function throttleTrailing<T extends (...args: never[]) => void>(
  fn: T,
  wait: number,
): T & { cancel(): void } {
  let lastInvoke = 0;
  let pendingTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: Parameters<T> | null = null;

  const invoke = (args: Parameters<T>) => {
    lastInvoke = Date.now();
    pendingArgs = null;
    fn(...args);
  };

  const throttled = ((...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - lastInvoke);
    pendingArgs = args;
    if (remaining <= 0) {
      if (pendingTimer) {
        clearTimeout(pendingTimer);
        pendingTimer = null;
      }
      invoke(args);
    } else if (!pendingTimer) {
      pendingTimer = setTimeout(() => {
        pendingTimer = null;
        if (pendingArgs) invoke(pendingArgs);
      }, remaining);
    }
  }) as T & { cancel(): void };

  throttled.cancel = () => {
    if (pendingTimer) clearTimeout(pendingTimer);
    pendingTimer = null;
    pendingArgs = null;
  };

  return throttled;
}
