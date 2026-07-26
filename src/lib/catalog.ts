/**
 * The product catalog — one static fixture, the single source of truth for
 * every price, spec and product name on the page.
 *
 * Everything here is placeholder data for a fictional brand. Swapping it for
 * real data should touch this file and nothing else.
 *
 * Entries are keyed by the GLB contract names from `src/assets/ASSETS.md`, so
 * a clicked Part or Gear Item in the 3D scene resolves to its Detail Panel
 * content without a lookup table in between.
 */

import type { GearName, PartName } from "./scene-state";

/**
 * Display order for grouped results. Rifle System first — the Hero Rifle is
 * the protagonist — then the two categories a visitor is most likely to be
 * shopping for, then everything else.
 */
export const CATEGORY_ORDER = [
  "Rifle System",
  "Optics",
  "Support",
  "Field Gear",
] as const;

export type CatalogCategory = (typeof CATEGORY_ORDER)[number];

export type CatalogId = PartName | GearName;

export interface CatalogSpec {
  label: string;
  value: string;
}

export interface CatalogEntry {
  /** The GLB mesh or root object name this entry describes. */
  id: CatalogId;
  name: string;
  category: CatalogCategory;
  specs: CatalogSpec[];
  /** Placeholder price, USD. */
  price: number;
}

export const CATALOG: readonly CatalogEntry[] = [
  {
    id: "Rifle_Barrel",
    name: "Match-Grade Barrel",
    category: "Rifle System",
    specs: [
      { label: "Length", value: "610 mm" },
      { label: "Twist", value: '1:11.25"' },
      { label: "Material", value: "416R stainless" },
      { label: "Profile", value: "Heavy varmint" },
    ],
    price: 1240,
  },
  {
    id: "Rifle_Receiver",
    name: "Precision Receiver",
    category: "Rifle System",
    specs: [
      { label: "Action", value: "Bolt, short throw" },
      { label: "Material", value: "4140 chromoly" },
      { label: "Bedding", value: "V-block chassis" },
    ],
    price: 1880,
  },
  {
    id: "Rifle_Bolt",
    name: "Fluted Bolt Assembly",
    category: "Rifle System",
    specs: [
      { label: "Throw", value: "60°" },
      { label: "Lugs", value: "3" },
      { label: "Finish", value: "Nitride" },
    ],
    price: 460,
  },
  {
    id: "Rifle_Stock",
    name: "Adjustable Chassis Stock",
    category: "Rifle System",
    specs: [
      { label: "Material", value: "Carbon composite" },
      { label: "Length of pull", value: "330–360 mm" },
      { label: "Weight", value: "1.1 kg" },
    ],
    price: 940,
  },
  {
    id: "Rifle_Magazine",
    name: "Detachable Box Magazine",
    category: "Rifle System",
    specs: [
      { label: "Capacity", value: "10 rounds" },
      { label: "Feed", value: "Double-stack" },
      { label: "Material", value: "Hardened steel" },
    ],
    price: 180,
  },
  {
    id: "Rifle_MuzzleBrake",
    name: "Radial Muzzle Brake",
    category: "Rifle System",
    specs: [
      { label: "Recoil reduction", value: "42%" },
      { label: "Thread", value: '5/8"×24' },
      { label: "Material", value: "Grade 5 titanium" },
    ],
    price: 210,
  },
  {
    id: "Rifle_Scope",
    name: "10–40× Ranging Scope",
    category: "Optics",
    specs: [
      { label: "Magnification", value: "10–40×" },
      { label: "Objective", value: "56 mm" },
      { label: "Reticle", value: "Mil-hash, illuminated" },
      { label: "Tube", value: "34 mm" },
    ],
    price: 2310,
  },
  {
    id: "Gear_NightVisionScope",
    name: "Night-Vision Clip-On",
    category: "Optics",
    specs: [
      { label: "Sensor", value: "Thermal / image-intensifier hybrid" },
      { label: "Detection range", value: "1,800 m" },
      { label: "Weight", value: "640 g" },
    ],
    price: 3950,
  },
  {
    id: "Rifle_Bipod",
    name: "Quick-Detach Bipod",
    category: "Support",
    specs: [
      { label: "Height", value: "150–230 mm" },
      { label: "Pan", value: "±30°" },
      { label: "Weight", value: "380 g" },
    ],
    price: 320,
  },
  {
    id: "Gear_AmmoBox",
    name: "Field Ammo Pack",
    category: "Field Gear",
    specs: [
      { label: "Capacity", value: "240 rounds" },
      { label: "Shell", value: "Weather-sealed polymer" },
      { label: "Weight", value: "2.4 kg" },
    ],
    price: 260,
  },
  {
    id: "Gear_ThermalDrone",
    name: "Thermal Recon Drone",
    category: "Field Gear",
    specs: [
      { label: "Sensor", value: "Uncooled thermal, 640×512" },
      { label: "Range", value: "4.2 km" },
      { label: "Flight time", value: "38 min" },
    ],
    price: 4700,
  },
  {
    id: "Gear_Torch",
    name: "Tactical Torch",
    category: "Field Gear",
    specs: [
      { label: "Output", value: "1,300 lumens" },
      { label: "Runtime", value: "6 h" },
      { label: "Body", value: "6061-T6 aluminium" },
    ],
    price: 150,
  },
];

export function findCatalogEntry(id: CatalogId): CatalogEntry | undefined {
  return CATALOG.find((entry) => entry.id === id);
}

/**
 * Prices are whole dollars and are always set in the tabular mono face, so
 * figures line up down a column of results or a spec list.
 */
export function formatPrice(price: number): string {
  return `$${price.toLocaleString("en-US")}`;
}

/**
 * Filter the catalog by a free-text query.
 *
 * The id is deliberately NOT searched: it is a pipeline contract name like
 * `Rifle_MuzzleBrake`, not language a visitor would type or want to see
 * matched against.
 */
export function searchCatalog(query: string): CatalogEntry[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") return [...CATALOG];

  return CATALOG.filter((entry) => searchableText(entry).includes(needle));
}

export interface CatalogGroup {
  category: CatalogCategory;
  entries: CatalogEntry[];
}

/**
 * Bucket entries under their category in a fixed display order, so results
 * don't reshuffle as the visitor types. Empty categories are dropped rather
 * than rendered as bare headings.
 */
export function groupByCategory(
  entries: readonly CatalogEntry[]
): CatalogGroup[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    entries: entries.filter((entry) => entry.category === category),
  })).filter((group) => group.entries.length > 0);
}

function searchableText(entry: CatalogEntry): string {
  return [
    entry.name,
    entry.category,
    ...entry.specs.flatMap((spec) => [spec.label, spec.value]),
  ]
    .join(" ")
    .toLowerCase();
}
