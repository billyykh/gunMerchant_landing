/**
 * The channel between the canvas and the HUD. One per interactive set — the
 * Gunsmith View's Parts, the Lineup's Gear Items.
 *
 * Callouts have to be DOM: the canvas is `aria-hidden` and a 3D raycast has no
 * accessible name, no tab stop and no focus ring, so a HUD drawn inside it
 * would be invisible to everyone not using a mouse (MASTER.md §8). But *where*
 * each Callout goes is only knowable from the camera, which is inside the
 * canvas and moving every frame — and in Act 3 the canvas also has to know what
 * the pointer is doing, because the float-up and the showcase are 3D.
 *
 * So both ends write. Three kinds of traffic, handled three ways:
 *
 * - **Positions**, canvas to DOM. Change every frame and never change what is
 *   on the page; written straight onto the registered nodes as transforms.
 *   Through React state this would re-render the HUD sixty times a second to
 *   move a few labels.
 * - **Availability**, canvas to DOM. Changes twice in the whole page, and
 *   changes what exists — outside its Act there are no hotspots and no tab
 *   stops. A subscription, so React can mount and unmount them.
 * - **Active and selected**, DOM to canvas. Read inside `useFrame`, which is
 *   already running, so there is nothing to subscribe to: the canvas polls.
 */

import type { CatalogId } from "@/lib/catalog";

/**
 * Typed by the set it carries — `HotspotChannel<PartName>` for the Gunsmith
 * View, `HotspotChannel<GearName>` for the Lineup. A channel that took any
 * `CatalogId` would hand a Gear Item to code expecting a Part, which is not
 * hypothetical: `partHotspotIndexLabel` answers `00/08` for a name it cannot
 * find rather than failing.
 */
export interface HotspotChannel<T extends CatalogId = CatalogId> {
  /**
   * The hotspot elements currently on the page. The canvas writes each one's
   * transform per frame; the DOM registers and unregisters them as they mount.
   */
  readonly nodes: Map<T, HTMLElement>;
  register(id: T, node: HTMLElement | null): void;

  setAvailable(available: boolean): void;
  getAvailable(): boolean;
  subscribe(listener: () => void): () => void;

  /** Under the pointer or holding focus — the one showing a Callout. */
  setActive(id: T | null): void;
  getActive(): T | null;

  /** Whose Detail Panel is open. */
  setSelected(id: T | null): void;
  getSelected(): T | null;
}

export function createHotspotChannel<
  T extends CatalogId = CatalogId,
>(): HotspotChannel<T> {
  const nodes = new Map<T, HTMLElement>();
  const listeners = new Set<() => void>();
  let available = false;
  let active: T | null = null;
  let selected: T | null = null;

  return {
    nodes,

    register(id, node) {
      if (node) nodes.set(id, node);
      else nodes.delete(id);
    },

    setAvailable(next) {
      // Called from `useFrame`, so this runs every frame with the same value
      // almost every time. Notifying unconditionally would re-render the HUD
      // continuously; notifying on change makes it twice a page.
      if (next === available) return;
      available = next;
      for (const listener of listeners) listener();
    },

    getAvailable() {
      return available;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    setActive(id) {
      active = id;
    },

    getActive() {
      return active;
    },

    setSelected(id) {
      selected = id;
    },

    getSelected() {
      return selected;
    },
  };
}
