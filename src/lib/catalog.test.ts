import { describe, expect, it } from "vitest";
import { GEAR_NAMES, PART_NAMES } from "./scene-state";
import {
  CATALOG,
  CATEGORY_ORDER,
  findCatalogEntry,
  groupByCategory,
  searchCatalog,
} from "./catalog";

const idsOf = (entries: readonly { id: string }[]) =>
  entries.map((entry) => entry.id);

describe("the catalog fixture", () => {
  it("carries an entry for every Part and every Gear Item", () => {
    expect(idsOf(CATALOG).sort()).toEqual(
      [...PART_NAMES, ...GEAR_NAMES].sort()
    );
  });

  it("is keyed by the GLB contract names, so a clicked mesh resolves directly", () => {
    for (const name of [...PART_NAMES, ...GEAR_NAMES]) {
      expect(findCatalogEntry(name)?.id).toBe(name);
    }
  });

  it("gives every entry the fields a Detail Panel renders", () => {
    for (const entry of CATALOG) {
      expect(entry.name.length).toBeGreaterThan(0);
      expect(CATEGORY_ORDER).toContain(entry.category);
      expect(entry.specs.length).toBeGreaterThan(0);
      expect(entry.price).toBeGreaterThan(0);
      for (const spec of entry.specs) {
        expect(spec.label.length).toBeGreaterThan(0);
        expect(spec.value.length).toBeGreaterThan(0);
      }
    }
  });

  it("names every entry distinctly — two rows reading the same is a broken palette", () => {
    const names = CATALOG.map((entry) => entry.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("search", () => {
  it("surfaces the thermal drone and the night-vision scope for 'thermal'", () => {
    expect(idsOf(searchCatalog("thermal")).sort()).toEqual([
      "Gear_NightVisionScope",
      "Gear_ThermalDrone",
    ]);
  });

  it("ignores case", () => {
    expect(idsOf(searchCatalog("THERMAL"))).toEqual(idsOf(searchCatalog("thermal")));
  });

  it("ignores surrounding whitespace", () => {
    expect(idsOf(searchCatalog("  thermal  "))).toEqual(
      idsOf(searchCatalog("thermal"))
    );
  });

  it("matches on specs, not just names", () => {
    // "thermal" only reaches the night-vision scope through its sensor spec.
    const scope = findCatalogEntry("Gear_NightVisionScope");
    expect(scope?.name.toLowerCase()).not.toContain("thermal");
    expect(idsOf(searchCatalog("thermal"))).toContain("Gear_NightVisionScope");
  });

  it("matches on category, so a visitor can browse by it", () => {
    expect(idsOf(searchCatalog("optics"))).toContain("Rifle_Scope");
  });

  it("shows the whole catalog before anything is typed", () => {
    expect(searchCatalog("")).toHaveLength(CATALOG.length);
    expect(searchCatalog("   ")).toHaveLength(CATALOG.length);
  });

  it("returns nothing when nothing matches", () => {
    expect(searchCatalog("kalashnikov")).toEqual([]);
  });

  it("keeps results in catalog order", () => {
    const results = searchCatalog("rifle");
    const catalogOrder = CATALOG.filter((entry) => results.includes(entry));
    expect(results).toEqual(catalogOrder);
  });
});

describe("grouping", () => {
  it("groups results under their category", () => {
    const groups = groupByCategory(searchCatalog("thermal"));
    expect(groups.map((group) => group.category)).toEqual(["Optics", "Field Gear"]);
    expect(idsOf(groups[0].entries)).toEqual(["Gear_NightVisionScope"]);
    expect(idsOf(groups[1].entries)).toEqual(["Gear_ThermalDrone"]);
  });

  it("orders groups consistently, not by whatever matched first", () => {
    const groups = groupByCategory(CATALOG);
    expect(groups.map((group) => group.category)).toEqual([...CATEGORY_ORDER]);
  });

  it("omits categories with no results rather than showing empty headings", () => {
    const groups = groupByCategory(searchCatalog("torch"));
    expect(groups).toHaveLength(1);
    expect(groups[0].category).toBe("Field Gear");
  });

  it("loses nothing — every entry lands in exactly one group", () => {
    const grouped = groupByCategory(CATALOG).flatMap((group) => group.entries);
    expect(idsOf(grouped).sort()).toEqual(idsOf(CATALOG).sort());
  });
});
