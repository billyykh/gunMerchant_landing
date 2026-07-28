import { describe, expect, it } from "vitest";

import { findCatalogEntry } from "./catalog";
import {
  GEAR_HOTSPOT_ORDER,
  PART_HOTSPOT_ORDER,
  partHotspotIndexLabel,
} from "./hotspots";
import { GEAR_NAMES, PART_NAMES, deriveSceneState } from "./scene-state";

describe("the Part hotspot order", () => {
  it("covers every Part of the Hero Rifle exactly once", () => {
    // MASTER.md §8: the keyboard equivalent of 3D hover is the Parts listed in
    // Detail Panel trigger order. A Part missing here is a Part a keyboard
    // visitor cannot reach at all.
    expect([...PART_HOTSPOT_ORDER].sort()).toEqual([...PART_NAMES].sort());
  });

  it("can fill a Detail Panel for every Part it lists", () => {
    for (const name of PART_HOTSPOT_ORDER) {
      expect(findCatalogEntry(name)).toBeDefined();
    }
  });

  it("reads the rifle front to back", () => {
    expect(PART_HOTSPOT_ORDER[0]).toBe("Rifle_MuzzleBrake");
    expect(PART_HOTSPOT_ORDER.at(-1)).toBe("Rifle_Stock");
  });
});

describe("the Gear hotspot order", () => {
  it("covers every Gear Item of the Lineup exactly once", () => {
    expect([...GEAR_HOTSPOT_ORDER].sort()).toEqual([...GEAR_NAMES].sort());
  });

  it("can fill a Detail Panel for every Gear Item it lists", () => {
    for (const name of GEAR_HOTSPOT_ORDER) {
      expect(findCatalogEntry(name)).toBeDefined();
    }
  });

  it("reads the Lineup left to right, as it is actually arranged", () => {
    // Tab order that jumped back and forth across the row would be worse than
    // none. This is what catches the arrangement being re-authored without the
    // tab order following it.
    const { gear } = deriveSceneState(1);
    const x = GEAR_HOTSPOT_ORDER.map((name) => gear[name].position[0]);

    expect(x).toEqual([...x].sort((a, b) => a - b));
  });
});

describe("the index label", () => {
  it("reads as a position out of the total", () => {
    expect(partHotspotIndexLabel("Rifle_MuzzleBrake")).toBe("01/08");
  });

  it("pads to two digits so labels do not change width down the rifle", () => {
    // The label is set in the mono HUD face beside a name; a label that
    // narrows at index 9 shifts the name it sits next to.
    for (const name of PART_HOTSPOT_ORDER) {
      expect(partHotspotIndexLabel(name)).toMatch(/^\d{2}\/\d{2}$/);
    }
  });

  it("numbers from one, not from zero", () => {
    expect(PART_HOTSPOT_ORDER.map(partHotspotIndexLabel)).toEqual([
      "01/08",
      "02/08",
      "03/08",
      "04/08",
      "05/08",
      "06/08",
      "07/08",
      "08/08",
    ]);
  });
});
