import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PAGE_CLOSE_ATTRIBUTE } from "@/lib/page-close";
import { useOccludedBottom } from "./use-occluded-bottom";

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
