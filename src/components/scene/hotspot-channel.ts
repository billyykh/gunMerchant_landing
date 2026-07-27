/**
 * The channel between the canvas and the HUD.
 *
 * Callouts have to be DOM: the canvas is `aria-hidden` and a 3D raycast has no
 * accessible name, no tab stop and no focus ring, so a HUD drawn inside it
 * would be invisible to everyone not using a mouse (MASTER.md §8). But *where*
 * each Callout goes is only knowable from the camera, which is inside the
 * canvas and moving every frame.
 *
 * So the canvas writes and the DOM reads. Two kinds of traffic go the same way
 * and are handled differently:
 *
 * - **Positions** change every frame and never change what is on the page. They
 *   are written straight onto the registered DOM nodes as transforms. Routing
 *   them through React state would re-render the HUD sixty times a second to
 *   move eight labels.
 * - **Availability** changes twice in the whole page, and changes what exists —
 *   outside the Gunsmith hold there are no hotspots and no tab stops. That one
 *   is a subscription, so React can mount and unmount them.
 */

import type { PartName } from "@/lib/scene-state";

export interface HotspotChannel {
  /**
   * The hotspot elements currently on the page, keyed by Part. The canvas
   * writes each one's transform per frame; the DOM registers and unregisters
   * them as they mount.
   */
  readonly nodes: Map<PartName, HTMLElement>;
  register(name: PartName, node: HTMLElement | null): void;
  setAvailable(available: boolean): void;
  getAvailable(): boolean;
  subscribe(listener: () => void): () => void;
}

export function createHotspotChannel(): HotspotChannel {
  const nodes = new Map<PartName, HTMLElement>();
  const listeners = new Set<() => void>();
  let available = false;

  return {
    nodes,

    register(name, node) {
      if (node) nodes.set(name, node);
      else nodes.delete(name);
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
  };
}
