/**
 * Coalesces high-frequency updates into one flush per animation frame.
 * Usage:
 *   const batcher = createRafBatcher(() => commitLatestToState());
 *   onMessage(m => { stash(m); batcher.schedule(); });
 *   onUnmount(() => batcher.cancel());
 */
export function createRafBatcher(flush: () => void) {
  let handle: number | null = null;

  function tick() {
    handle = null;
    flush();
  }

  return {
    schedule() {
      if (handle != null) return;
      handle = requestAnimationFrame(tick);
    },
    cancel() {
      if (handle != null) {
        cancelAnimationFrame(handle);
        handle = null;
      }
    },
    isScheduled() {
      return handle != null;
    },
  };
}
