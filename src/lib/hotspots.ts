/**
 * Hotspot order — one list per Act's interactive set.
 *
 * A hotspot is the control a Part or Gear Item is reached through
 * (`CONTEXT.md`). This module owns the facts about those sets that have nothing
 * to do with rendering: what order they come in, and how they are numbered.
 *
 * Order is tab order, and tab order is the Detail Panel trigger order §8 asks
 * for. Both lists read the way the eye reads the composition, so a keyboard
 * visitor moves through an Act the way a pointer visitor does.
 */

import type { GearName, PartName } from "./scene-state";

/**
 * The Gunsmith View, front to back along the rifle, muzzle first: a keyboard
 * visitor tabs down the length of the barrel in the direction it points, and
 * the index labels read `01/08` at the muzzle through `08/08` at the butt. The
 * alternative — the GLB's own mesh order — is an export artefact and would
 * number the rifle at random.
 *
 * Parts that hang below the line are placed at the point they mount, not
 * collected into a group at the end, so the numbering still tracks the eye.
 */
export const PART_HOTSPOT_ORDER = [
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
 * The Lineup, left to right across the row as `scene-state.ts` arranges it.
 *
 * Deliberately not `GEAR_NAMES` order, which is the contract list from
 * `ASSETS.md` and says nothing about where anything stands — tabbing it would
 * jump back and forth across the composition. Re-order this if the arrangement
 * is re-authored.
 */
export const GEAR_HOTSPOT_ORDER = [
  "Gear_ThermalDrone",
  "Gear_AmmoBox",
  "Gear_NightVisionScope",
  "Gear_Torch",
] as const satisfies readonly GearName[];

/**
 * The HUD index readout, `03/08` (MASTER.md §5).
 *
 * Zero-padded to two digits, as §5 writes it: a bare `3/8` reads as a fraction
 * rather than as an instrument index, and the padding also keeps the label a
 * fixed width, so the Part name set beside it does not shift down the rifle.
 *
 * Parts only. The Lineup is four objects a visitor looks across, not a sequence
 * they count through, and `01/04` on a torch claims an order that is a
 * composition rather than a specification.
 */
export function partHotspotIndexLabel(name: PartName): string {
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${pad(PART_HOTSPOT_ORDER.indexOf(name) + 1)}/${pad(
    PART_HOTSPOT_ORDER.length
  )}`;
}

/**
 * Something in the scene but not in its order above is something no keyboard
 * visitor can reach, and for Parts it would break the numbering for everyone
 * else. `satisfies` above catches a name that is not real; these catch a real
 * one that is missing — the direction that actually goes wrong, when a name is
 * added to `ASSETS.md` and nothing here is touched.
 */
type AssertNone<T extends never> = T;

export type AllPartsHaveHotspots = AssertNone<
  Exclude<PartName, (typeof PART_HOTSPOT_ORDER)[number]>
>;

export type AllGearHaveHotspots = AssertNone<
  Exclude<GearName, (typeof GEAR_HOTSPOT_ORDER)[number]>
>;
