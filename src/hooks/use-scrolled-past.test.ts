import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { scrollTo } from "@/test-utils/scroll";
import { useScrolledPast } from "./use-scrolled-past";

afterEach(() => {
  window.scrollY = 0;
});

describe("useScrolledPast", () => {
  it("is false at the top of the page", () => {
    const { result } = renderHook(() => useScrolledPast(24));
    expect(result.current).toBe(false);
  });

  it("turns true once the page is scrolled past the threshold", () => {
    const { result } = renderHook(() => useScrolledPast(24));
    scrollTo(25);
    expect(result.current).toBe(true);
  });

  it("stays false exactly at the threshold", () => {
    const { result } = renderHook(() => useScrolledPast(24));
    scrollTo(24);
    expect(result.current).toBe(false);
  });

  it("turns back off when the page is scrolled back to the top", () => {
    const { result } = renderHook(() => useScrolledPast(24));
    scrollTo(200);
    scrollTo(0);
    expect(result.current).toBe(false);
  });

  it("reads the position it was mounted at, not a hardcoded top", () => {
    // A visitor who reloads mid-page, or follows a link to an anchor, must not
    // get a transparent header floating over their content.
    window.scrollY = 400;
    const { result } = renderHook(() => useScrolledPast(24));
    expect(result.current).toBe(true);
  });

  it("stops listening once unmounted", () => {
    const removeEventListener = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useScrolledPast(24));

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function)
    );
    removeEventListener.mockRestore();
  });
});
