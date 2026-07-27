/**
 * Where a Callout goes on screen, given where its Part projected to.
 *
 * The projection itself belongs to the camera and happens per frame inside the
 * canvas; everything after it is arithmetic, and lives here so it can be tested
 * without a WebGL context.
 */

import type { Vec3 } from "./scene-state";

export interface Viewport {
  width: number;
  height: number;
}

export interface CalloutPlacement {
  /** Pixels from the left of the viewport. */
  x: number;
  /** Pixels from the top of the viewport. */
  y: number;
  /** Which way the leader line runs out of the anchor dot. */
  side: "left" | "right";
  /** Whether it climbs or falls out of the anchor dot to clear the subject. */
  rise: "up" | "down";
  visible: boolean;
}

/**
 * The leader line's geometry.
 *
 * The angle is what takes the label off the subject. A horizontal leader lays
 * the label across the rifle — which, photographed side-on, is most of the
 * frame — and a dark label on a dark barrel is the one place on this page where
 * contrast is not the palette's to give. Leaning clear puts the label against
 * the background instead.
 */
export const CALLOUT_LEADER = { length: 120, degrees: 28 } as const;

/** The widest label the catalog can produce, at the `hud` step. */
const WIDEST_LABEL = 235;

/**
 * How far a Callout reaches sideways from its anchor dot, and so how close to
 * the edge of the viewport a label can be anchored before it has to fold back.
 *
 * Derived from the leader rather than measured against it: the two have to
 * agree, and a second hand-tuned number in another file is how they stop
 * agreeing the first time the leader is lengthened.
 */
export const CALLOUT_REACH =
  CALLOUT_LEADER.length * Math.cos(toRadians(CALLOUT_LEADER.degrees)) +
  WIDEST_LABEL;

/**
 * How far past the edge of the frame a Part may drift before its Callout is
 * dropped. A Part exactly on the edge is half in shot, and cutting the Callout
 * at the boundary makes it blink on and off as the camera breathes.
 */
const CULL_MARGIN = 0.25;

export function placeCallout(
  ndc: Vec3,
  viewport: Viewport
): CalloutPlacement {
  const [ndcX, ndcY, ndcZ] = ndc;

  const x = (ndcX * 0.5 + 0.5) * viewport.width;
  const y = (-ndcY * 0.5 + 0.5) * viewport.height;

  return {
    x,
    y,
    side: chooseSide(x, viewport.width),
    /*
     * A horizontal leader would lay the label across the subject, which on a
     * rifle photographed side-on is most of the frame. Leaning away from the
     * subject's centre puts every label in open space above or below it.
     *
     * The centre needs no measuring: the camera looks at it, so it projects to
     * the NDC origin every frame, at every Act, whatever the framing.
     */
    rise: ndcY >= 0 ? "up" : "down",
    // A point behind the camera projects to z > 1 with its x and y mirrored, so
    // it would otherwise be drawn confidently in the wrong place.
    visible:
      ndcZ <= 1 &&
      Math.abs(ndcX) <= 1 + CULL_MARGIN &&
      Math.abs(ndcY) <= 1 + CULL_MARGIN,
  };
}

/**
 * Callouts reach right by default, so a row of them reads consistently. One
 * near the right edge folds back — unless the viewport is narrower than the
 * Callout itself, where neither side fits and flipping would only make the
 * label flap as the camera drifts.
 */
function chooseSide(x: number, width: number): "left" | "right" {
  if (width < CALLOUT_REACH) return "right";
  return x + CALLOUT_REACH > width ? "left" : "right";
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
