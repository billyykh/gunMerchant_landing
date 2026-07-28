import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PAGE_CLOSE_ATTRIBUTE } from "@/lib/page-close";
import { useOccludedBottom, usePageCloseInView } from "./use-occluded-bottom";

/** jsdom ships no IntersectionObserver; this one is driven by hand. */
function stubIntersectionObserver() {
  const instances: Array<(entries: { isIntersecting: boolean }[]) => void> = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
        instances.push(cb);
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    }
  );
  return instances;
}

/**
 * jsdom has no layout, so the page's closing surface is placed by hand: the
 * hook only ever asks it where its top edge is.
 */
function placeFooter(top: number) {
  const footer = document.createElement("footer");
  footer.setAttribute(PAGE_CLOSE_ATTRIBUTE, "");
  footer.getBoundingClientRect = () => ({ top }) as DOMRect;
  document.body.append(footer);
  return footer;
}

const scroll = () => window.dispatchEvent(new Event("scroll"));

afterEach(() => {
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

describe("whether the page has started closing", () => {
  it("says no while the closing surface is still below the fold", () => {
    stubIntersectionObserver();
    placeFooter(window.innerHeight + 500);

    expect(renderHook(() => usePageCloseInView()).result.current).toBe(false);
  });

  it("says yes as soon as any of it is showing", () => {
    // The compact hotspot list is fixed to the bottom of the window, which is
    // exactly where the footer arrives.
    const observers = stubIntersectionObserver();
    placeFooter(window.innerHeight - 10);
    const { result } = renderHook(() => usePageCloseInView());

    act(() => observers[0]([{ isIntersecting: true }]));
    expect(result.current).toBe(true);

    act(() => observers[0]([{ isIntersecting: false }]));
    expect(result.current).toBe(false);
  });

  it("says no when there is no closing surface", () => {
    stubIntersectionObserver();
    expect(renderHook(() => usePageCloseInView()).result.current).toBe(false);
  });
});

describe("how much of the viewport the page has covered", () => {
  it("measures from the closing surface's top edge to the bottom of the window", () => {
    placeFooter(window.innerHeight - 200);
    const { result } = renderHook(() => useOccludedBottom());
    expect(result.current.current).toBe(200);
  });

  it("covers nothing while the surface is still below the fold", () => {
    // Negative overlap would push Callouts *past* the bottom of the window.
    placeFooter(window.innerHeight + 500);
    const { result } = renderHook(() => useOccludedBottom());
    expect(result.current.current).toBe(0);
  });

  it("follows the surface as the page scrolls", () => {
    const footer = placeFooter(window.innerHeight);
    const { result } = renderHook(() => useOccludedBottom());
    expect(result.current.current).toBe(0);

    footer.getBoundingClientRect = () =>
      ({ top: window.innerHeight - 340 }) as DOMRect;
    scroll();

    expect(result.current.current).toBe(340);
  });

  it("stops listening when it goes away", () => {
    // The listeners are on `window`, which outlives the component — left
    // attached they measure a footer that has been removed, on every scroll,
    // forever.
    const remove = vi.spyOn(window, "removeEventListener");
    placeFooter(window.innerHeight);
    renderHook(() => useOccludedBottom()).unmount();

    expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function));
    expect(remove).toHaveBeenCalledWith("resize", expect.any(Function));
    remove.mockRestore();
  });

  it("covers nothing when there is no closing surface at all", () => {
    // The styleguide route mounts the scene without the page's footer.
    const { result } = renderHook(() => useOccludedBottom());
    expect(result.current.current).toBe(0);
    expect(() => scroll()).not.toThrow();
  });
});
