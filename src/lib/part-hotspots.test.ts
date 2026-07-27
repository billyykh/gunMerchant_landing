import { describe, expect, it } from "vitest";

import { findCatalogEntry } from "./catalog";
import { HOTSPOT_ORDER, hotspotIndexLabel } from "./part-hotspots";
import { PART_NAMES } from "./scene-state";

describe("the hotspot order", () => {
  it("covers every Part of the Hero Rifle exactly once", () => {
    // MASTER.md §8: the keyboard equivalent of 3D hover is the Parts listed in
    // Detail Panel trigger order. A Part missing here is a Part a keyboard
    // visitor cannot reach at all.
    expect([...HOTSPOT_ORDER].sort()).toEqual([...PART_NAMES].sort());
  });

  it("can fill a Detail Panel for every Part it lists", () => {
    for (const name of HOTSPOT_ORDER) {
      expect(findCatalogEntry(name)).toBeDefined();
    }
  });

  it("reads the rifle front to back", () => {
    expect(HOTSPOT_ORDER[0]).toBe("Rifle_MuzzleBrake");
    expect(HOTSPOT_ORDER.at(-1)).toBe("Rifle_Stock");
  });
});

describe("the index label", () => {
  it("reads as a position out of the total", () => {
    expect(hotspotIndexLabel("Rifle_MuzzleBrake")).toBe("01/08");
  });

  it("pads to two digits so labels do not change width down the rifle", () => {
    // The label is set in the mono HUD face beside a name; a label that
    // narrows at index 9 shifts the name it sits next to.
    for (const name of HOTSPOT_ORDER) {
      expect(hotspotIndexLabel(name)).toMatch(/^\d{2}\/\d{2}$/);
    }
  });

  it("numbers from one, not from zero", () => {
    const labels = HOTSPOT_ORDER.map(hotspotIndexLabel);
    expect(labels).toEqual([
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
