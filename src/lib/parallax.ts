/**
 * The Gunsmith View's pointer parallax.
 *
 * Ticket 13 asks for a subtle lean with mouse movement and explicitly rules out
 * orbit or drag controls: the framing of Act 2 is composed (see
 * `CAMERA_POSES.gunsmith`), and a control that lets the visitor swing away from
 * it hands them the job of composing it themselves.
 */

export interface PointerNdc {
  /** -1 at the left edge of the viewport, +1 at the right. */
  x: number;
  /** -1 at the bottom, +1 at the top. */
  y: number;
}

export interface ParallaxOffset {
  x: number;
  y: number;
}

export interface ParallaxOptions {
  /**
   * False outside the Gunsmith hold — where the camera is already travelling
   * and a second source of movement reads as drift — and under
   * `prefers-reduced-motion` (MASTER.md §6.3).
   */
  enabled: boolean;
}

/**
 * How far the camera leans at the very edge of the viewport, in world units.
 *
 * The Act 2 camera sits about 1.0 from the rifle, so this is roughly a 1.5%
 * shift: enough that the rifle has parallax against the background, far too
 * little to recompose the shot.
 */
export const PARALLAX_REACH = 0.015;

export function parallaxOffset(
  pointer: PointerNdc,
  { enabled }: ParallaxOptions
): ParallaxOffset {
  if (!enabled) return { x: 0, y: 0 };

  return {
    x: clampUnit(pointer.x) * PARALLAX_REACH,
    y: clampUnit(pointer.y) * PARALLAX_REACH,
  };
}

/**
 * A pointer dragged out of the window keeps reporting coordinates, and the page
 * keeps receiving them until the button is released.
 */
function clampUnit(value: number): number {
  return Math.min(1, Math.max(-1, value)) || 0;
}
