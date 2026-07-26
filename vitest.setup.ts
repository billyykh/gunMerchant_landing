import "@testing-library/jest-dom/vitest";

/*
 * jsdom implements no layout, so a handful of browser APIs that headless UI
 * libraries reach for simply do not exist. Stub the ones our components need
 * to mount — cmdk observes its list for resize, and scrolls the active option
 * into view as you arrow through it.
 */

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}
