import { Box3, Vector3, type Camera, type Object3D } from "three";

import { placeCallout, type Viewport } from "@/lib/callout-placement";
import type { CatalogId } from "@/lib/catalog";

import type { HotspotChannel } from "./hotspot-channel";

export interface Anchored {
  object: Object3D;
  /** The Callout's attachment point, in the object's own local space. */
  anchor: Vector3;
}

/**
 * Where an object's Callout attaches: the centre of its bounding box, in its
 * own local space.
 *
 * Measured from the model rather than authored as a table of vectors — the GLB
 * is the source of truth for where anything is, and hand-written anchors drift
 * silently the first time something is re-exported.
 *
 * Local rather than world, because everything here moves: the Hero Rifle's root
 * travels during the drop, its Parts travel during Assembly, and a Gear Item
 * floats and turns under the pointer.
 */
export function measureAnchor(object: Object3D): Vector3 {
  const centre = new Box3().setFromObject(object).getCenter(new Vector3());
  return object.worldToLocal(centre);
}

/**
 * Project each anchored object and position its hotspot.
 *
 * Called from `useFrame` *after* the camera has been placed for the frame:
 * projecting first would leave every Callout one frame behind the thing it is
 * anchored to, which at this scale is the one thing that would be visible.
 *
 * `scratch` is the caller's, reused across frames — a fresh `Vector3` per
 * object per frame is hundreds of allocations a second for the collector to
 * clear up behind the render loop.
 */
export function projectHotspots(
  channel: HotspotChannel,
  anchored: Iterable<[CatalogId, Anchored]>,
  camera: Camera,
  frame: Viewport,
  scratch: Vector3
): void {
  for (const [id, { object, anchor }] of anchored) {
    const node = channel.nodes.get(id);
    if (!node) continue;

    object.updateWorldMatrix(true, false);
    const ndc = scratch
      .copy(anchor)
      .applyMatrix4(object.matrixWorld)
      .project(camera);

    const placement = placeCallout([ndc.x, ndc.y, ndc.z], frame);

    // `hidden` rather than a class: a hotspot the visitor cannot see must not
    // be a tab stop either.
    node.hidden = !placement.visible;
    node.style.transform = `translate3d(${placement.x}px, ${placement.y}px, 0)`;
    node.dataset.side = placement.side;
    node.dataset.rise = placement.rise;
  }
}
