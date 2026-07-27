import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { usePointerNdc } from "./use-pointer-ndc";

const movePointerTo = (clientX: number, clientY: number) => {
  act(() => {
    window.dispatchEvent(
      new MouseEvent("pointermove", { clientX, clientY })
    );
  });
};

afterEach(() => {
  window.innerWidth = 1024;
  window.innerHeight = 768;
});

describe("usePointerNdc", () => {
  it("starts at the centre, where the composition is as framed", () => {
    const { result } = renderHook(() => usePointerNdc());
    expect(result.current.current).toEqual({ x: 0, y: 0 });
  });

  it("reports the centre of the viewport as the origin", () => {
    const { result } = renderHook(() => usePointerNdc());
    movePointerTo(window.innerWidth / 2, window.innerHeight / 2);
    expect(result.current.current).toEqual({ x: 0, y: 0 });
  });

  it("runs -1 to +1 left to right", () => {
    const { result } = renderHook(() => usePointerNdc());

    movePointerTo(0, window.innerHeight / 2);
    expect(result.current.current.x).toBe(-1);

    movePointerTo(window.innerWidth, window.innerHeight / 2);
    expect(result.current.current.x).toBe(1);
  });

  it("runs +1 to -1 top to bottom, as NDC does", () => {
    const { result } = renderHook(() => usePointerNdc());

    movePointerTo(window.innerWidth / 2, 0);
    expect(result.current.current.y).toBe(1);

    movePointerTo(window.innerWidth / 2, window.innerHeight);
    expect(result.current.current.y).toBe(-1);
  });

  it("does not re-render on pointer movement", () => {
    // It is read inside `useFrame`, sixty times a second. A hook that rendered
    // on every pointer event would re-render the whole scene tree to lean a
    // camera by 1.5%.
    const render = vi.fn();
    renderHook(() => {
      render();
      return usePointerNdc();
    });

    movePointerTo(10, 10);
    movePointerTo(20, 20);

    expect(render).toHaveBeenCalledTimes(1);
  });

  it("stops listening once unmounted", () => {
    const removeEventListener = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => usePointerNdc());

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith(
      "pointermove",
      expect.any(Function)
    );
    removeEventListener.mockRestore();
  });
});
