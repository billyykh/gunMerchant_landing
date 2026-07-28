/**
 * Fitting an authored camera pose to the viewport it is actually being shown
 * in.
 *
 * A three.js perspective camera fixes its *vertical* field of view, so a
 * narrower window does not show less top and bottom — it shows less left and
 * right. Every composition on this page is wide: a 1.16 m rifle photographed
 * side-on in Acts 1 and 2, and a row of five objects in Act 3. Left alone, a
 * portrait phone frames a few centimetres of barrel.
 *
 * Arithmetic only, so it can be tested without a WebGL context. Applied per
 * frame in `scene-contents`.
 */

/**
 * The aspect the three Acts were composed at.
 *
 * 16:9, because that is the frame each pose in `scene-state.ts` was tuned in.
 * A viewport at this aspect gets exactly what was authored; anything narrower
 * is corrected back to the same width, and anything wider is left to gain the
 * side room §9 promises at `xl`.
 */
export const FRAMING_REFERENCE_ASPECT = 16 / 9;

/**
 * How wide the vertical field of view may be opened before the correction
 * stops.
 *
 * Holding the width by widening alone would ask a 375×812 phone for a vertical
 * field of view near 110°, which bows straight edges, stretches everything at
 * the frame's corners, and pushes the near plane into the subject. Past this
 * point the width is recovered by moving the camera instead, which costs
 * nothing but distance.
 */
export const MAX_VERTICAL_FOV = 70;

export interface Framing {
  /** The vertical field of view to give the camera, in degrees. */
  fov: number;
  /**
   * What to multiply the camera's distance from its target by. 1 leaves the
   * authored pose alone.
   */
  dolly: number;
}

/** The horizontal field of view a vertical one produces at an aspect ratio. */
export function horizontalFov(fov: number, aspect: number): number {
  return toDegrees(2 * Math.atan(Math.tan(toRadians(fov) / 2) * aspect));
}

/**
 * The field of view and camera distance that show a narrow viewport the same
 * width of scene as the reference frame.
 *
 * Widen first, move second. Widening is free and keeps the camera where the
 * composition put it; moving back flattens perspective and changes how the
 * Lineup's depth stagger reads. So the vertical field of view opens until it
 * reaches the point where perspective starts to bend, and only the width that
 * could not buy is paid for with distance.
 */
export function fitFraming(fov: number, aspect: number): Framing {
  // React Three Fiber reports a 0×0 canvas for a frame or two while it is
  // being measured. An aspect of 0 divides through to infinity, and NaN
  // propagates into the projection matrix and blanks the scene.
  if (!Number.isFinite(aspect) || aspect <= 0) return { fov, dolly: 1 };
  if (aspect >= FRAMING_REFERENCE_ASPECT) return { fov, dolly: 1 };

  // Half-width of the reference frame, one unit from the camera.
  const wanted = Math.tan(toRadians(fov) / 2) * FRAMING_REFERENCE_ASPECT;

  const opened = Math.min(
    toDegrees(2 * Math.atan(wanted / aspect)),
    MAX_VERTICAL_FOV
  );
  const reached = Math.tan(toRadians(opened) / 2) * aspect;

  // Width seen scales with distance, so whatever fraction of the reference
  // width the opened frame still misses is made up by standing that much
  // further back.
  return { fov: opened, dolly: Math.max(1, wanted / reached) };
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}
