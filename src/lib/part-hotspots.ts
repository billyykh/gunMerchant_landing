/**
 * The Gunsmith View's hotspots — one per Part of the Hero Rifle.
 *
 * A hotspot is the thing a visitor hovers, taps or tabs to in Act 2. This
 * module owns the two facts about them that have nothing to do with rendering:
 * what order they come in, and how each one is numbered.
 */

import type { PartName } from "./scene-state";

/**
 * Hotspot order — which is also the tab order, and the order the Detail Panel
 * triggers are listed in (MASTER.md §8).
 *
 * Front to back along the rifle, muzzle first: a keyboard visitor tabs down the
 * length of the barrel in the direction it points, and the index labels read
 * `01/08` at the muzzle through `08/08` at the butt. The alternative — the GLB's
 * own mesh order — is an export artefact and would number the rifle at random.
 *
 * Parts that hang below the line are placed at the point they mount, not
 * collected into a group at the end, so the numbering still tracks the eye.
 */
export const HOTSPOT_ORDER = [
  "Rifle_MuzzleBrake",
  "Rifle_Barrel",
  "Rifle_Bipod",
  "Rifle_Scope",
  "Rifle_Receiver",
  "Rifle_Bolt",
  "Rifle_Magazine",
  "Rifle_Stock",
] as const satisfies readonly PartName[];

/**
 * The HUD index readout, `03/08` (MASTER.md §5).
 *
 * Zero-padded to two digits, as §5 writes it: a bare `3/8` reads as a fraction
 * rather than as an instrument index, and the padding also keeps the label a
 * fixed width, so the Part name set beside it does not shift down the rifle.
 */
export function hotspotIndexLabel(name: PartName): string {
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${pad(HOTSPOT_ORDER.indexOf(name) + 1)}/${pad(HOTSPOT_ORDER.length)}`;
}

/**
 * A Part in the scene but not in the order above is a Part no keyboard visitor
 * can reach, and it would break the numbering for everyone else. `satisfies`
 * above catches a name that is not a Part; this catches a Part that is not a
 * name — the direction that actually goes wrong, when a Part is added to
 * `PART_NAMES` and nothing here is touched.
 */
type PartWithoutHotspot = Exclude<PartName, (typeof HOTSPOT_ORDER)[number]>;
type AssertNone<T extends never> = T;

export type AllPartsHaveHotspots = AssertNone<PartWithoutHotspot>;
