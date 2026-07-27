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

// GSAP's ScrollTrigger probes media queries the moment it registers, and the
// reduced-motion hook asks for one directly. Tests that care about the answer
// stub this themselves; this default just lets the modules load.
if (!globalThis.matchMedia) {
  globalThis.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof globalThis.matchMedia;
}
