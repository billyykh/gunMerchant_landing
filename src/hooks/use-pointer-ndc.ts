"use client";

import * as React from "react";

import type { PointerNdc } from "@/lib/parallax";

/**
 * The pointer's position in normalised device coordinates.
 *
 * Returned as a ref, not as state: this is read inside `useFrame`, sixty times
 * a second, to lean the camera by a fraction of a world unit. Rendering on
 * every pointer event would re-render the scene tree to do it.
 *
 * Listened for on `window` rather than on the canvas. React Three Fiber's own
 * `state.pointer` only updates from events that reach the canvas element, and
 * the whole page — the Act sections and the HUD — sits over it. It would go
 * stale the moment the pointer crossed anything.
 */
export function usePointerNdc(): React.RefObject<PointerNdc> {
  const pointer = React.useRef<PointerNdc>({ x: 0, y: 0 });

  React.useEffect(() => {
    const handlePointerMove = (event: PointerEvent | MouseEvent) => {
      pointer.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        // NDC counts up; clients count down.
        y: -(event.clientY / window.innerHeight) * 2 + 1,
      };
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  return pointer;
}
