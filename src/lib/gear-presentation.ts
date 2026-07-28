/**
 * How a Gear Item presents itself in the Lineup.
 *
 * The Lineup's *arrangement* — where each Gear Item stands — is scroll-derived
 * and belongs to Scene State. This is the layer on top: what hovering one and
 * selecting one do to it. Kept separate because it answers to the pointer
 * rather than to scroll, and pure so the rules can be tested without a canvas.
 */

import {
  GEAR_NAMES,
  type GearName,
  type Transform,
  type Vec3,
} from "./scene-state";

/**
 * How far a hovered Gear Item lifts, in world units.
 *
 * Small against objects that are 0.13–0.45 across: the lift has to read as the
 * object answering the pointer, not as it jumping out of the composition the
 * Act is arranged into.
 */
export const GEAR_FLOAT_RISE = 0.06;

/**
 * How fast the showcase turns, in full turns per second.
 *
 * Slow enough to read as inspection rather than as a spinning trophy — a full
 * revolution takes eight seconds, which is about how long it takes to read the
 * Detail Panel beside it.
 */
export const SHOWCASE_TURNS_PER_SECOND = 0.125;

/**
 * Where the showcase sits under `prefers-reduced-motion`: an eighth of a turn
 * off the Lineup pose.
 *
 * §6.3 asks for the showcase pose rendered statically, which is not the same as
 * leaving the object facing the way it happened to stand in the row. A visitor
 * on this path sees exactly one frame of the showcase, so it should be the
 * three-quarter view the rotation exists to reach.
 */
export const SHOWCASE_STILL_TURN = 0.125;

/**
 * The showcase, as the scene remembers it between frames.
 *
 * It is state rather than a function of elapsed time because of what has to
 * happen when the Detail Panel closes. Deriving the angle from "how long has
 * this been selected" means it returns to zero the moment nothing is selected,
 * and the object snaps back to its resting pose — up to half a turn, instantly.
 * Easing it back is no better: it would rewind every turn it has made.
 *
 * So it simply stops. The object stays where the visitor left it, which is what
 * happens when you put something down after turning it over. The arrangement's
 * authored rotation is a starting pose, not a pose it has to be returned to.
 */
export interface ShowcaseState {
  /** The Gear Item that was last showcased, if any. */
  of: GearName | null;
  /** Whole turns it has made. Advances only while it is selected. */
  turns: number;
}

export const SHOWCASE_AT_REST: ShowcaseState = { of: null, turns: 0 };

/**
 * Move the showcase on by one frame.
 *
 * Selecting a different Gear Item starts its turn from zero rather than
 * inheriting the last one's: the angle belongs to the object being inspected,
 * not to the act of inspecting.
 */
export function advanceShowcase(
  showcase: ShowcaseState,
  selected: GearName | null,
  deltaSeconds: number
): ShowcaseState {
  if (selected === null) return showcase;
  if (selected !== showcase.of) return { of: selected, turns: 0 };

  return {
    of: showcase.of,
    turns: showcase.turns + deltaSeconds * SHOWCASE_TURNS_PER_SECOND,
  };
}

export interface GearPresentationInput {
  /** The Lineup arrangement, from Scene State. */
  base: Record<GearName, Transform>;
  hovered: GearName | null;
  selected: GearName | null;
  showcase: ShowcaseState;
  reducedMotion: boolean;
}

export function deriveGearPresentation({
  base,
  hovered,
  selected,
  showcase,
  reducedMotion,
}: GearPresentationInput): Record<GearName, Transform> {
  return Object.fromEntries(
    GEAR_NAMES.map((name) => {
      const resting = base[name];

      // The selection stays lifted while its Detail Panel is open, even after
      // the pointer has moved off it — dropping it back into the row would read
      // as the selection being lost.
      const lifted = !reducedMotion && (name === hovered || name === selected);

      // Reduced motion gets the composed still instead of wherever a rotation
      // that never ran would have reached.
      const turns = reducedMotion ? SHOWCASE_STILL_TURN : showcase.turns;

      return [
        name,
        {
          position: lifted
            ? rise(resting.position, GEAR_FLOAT_RISE)
            : resting.position,
          rotation:
            name === showcase.of ? turn(resting.rotation, turns) : resting.rotation,
        },
      ];
    })
  ) as Record<GearName, Transform>;
}

function rise([x, y, z]: Vec3, by: number): Vec3 {
  return [x, y + by, z];
}

function turn([x, y, z]: Vec3, turns: number): Vec3 {
  return [x, y + turns * 2 * Math.PI, z];
}
