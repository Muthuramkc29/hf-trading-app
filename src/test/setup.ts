import "@testing-library/jest-dom";

// jsdom does not provide rAF in a way that fires synchronously; provide a
// micro-task based fallback so tests can flush updates with await Promise.resolve().
if (typeof globalThis.requestAnimationFrame !== "function") {
  globalThis.requestAnimationFrame = (cb) => {
    return setTimeout(() => cb(performance.now()), 0) as unknown as number;
  };
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id as unknown as number);
}
