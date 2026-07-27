"use client";

import * as React from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Box3, Vector3, type Group, type Object3D } from "three";

import { placeCallout } from "@/lib/callout-placement";
import { parallaxOffset, type PointerNdc } from "@/lib/parallax";
import {
  PART_NAMES,
  type Act,
  type PartName,
  deriveSceneState,
  deriveStaticSceneState,
} from "@/lib/scene-state";

import type { HotspotChannel } from "./hotspot-channel";

export const HERO_RIFLE_URL = "/models/hero-rifle.glb";

useGLTF.preload(HERO_RIFLE_URL);

interface HeroRifleProps {
  /** Live scroll progress. Read per frame; never a React render trigger. */
  progressRef: React.RefObject<number>;
  reducedMotion: boolean;
  actInView: Act;
  /** Live pointer position, for the Gunsmith View's parallax. */
  pointerRef: React.RefObject<PointerNdc>;
  /** Where the HUD's hotspots are told to stand. */
  channel: HotspotChannel;
}

/**
 * The parallax lean's time constant, in seconds — how long it takes to close
 * roughly 63% of the distance to the pointer.
 *
 * Damped rather than followed exactly: the pointer arrives in discrete jumps
 * and the camera is the whole composition, so an undamped lean reads as the
 * scene twitching. It also smooths the moment interaction switches off at the
 * edge of the Gunsmith hold, where the target snaps to zero.
 *
 * Expressed as a time, not as a fraction per frame. A per-frame fraction makes
 * the damping twice as fast on a 120Hz display as on a 60Hz one — the same
 * gesture would feel different on two machines.
 */
const PARALLAX_TIME_CONSTANT = 0.2;

/**
 * The Hero Rifle in the scene, plus the camera that frames it.
 *
 * Both are driven from one `useFrame` so the Scene State is derived once per
 * frame rather than once per consumer, and so the rifle and the camera can
 * never disagree about which frame they are on.
 */
export function HeroRifle({
  progressRef,
  reducedMotion,
  actInView,
  pointerRef,
  channel,
}: HeroRifleProps) {
  const { scene } = useGLTF(HERO_RIFLE_URL);
  const rootRef = React.useRef<Group>(null);

  /**
   * The exported transform of each Part *is* its assembled pose
   * (src/assets/ASSETS.md), so it is captured once and everything the seam
   * returns is applied as an offset from it. Binding is by the contract mesh
   * names, never by traversal order.
   */
  const parts = React.useMemo(() => {
    const found = new Map<PartName, BoundPart>();

    for (const name of PART_NAMES) {
      const object = scene.getObjectByName(name);
      if (!object) {
        console.warn(
          `[scene] ${HERO_RIFLE_URL} has no mesh named "${name}". ` +
            "Assembly binds by the names in src/assets/ASSETS.md."
        );
        continue;
      }

      found.set(name, {
        object,
        base: {
          position: object.position.clone(),
          rotation: object.rotation.clone(),
        },
        anchor: measureAnchor(object),
      });
    }

    return found;
  }, [scene]);

  // Scratch vectors, allocated once. Everything below runs every frame, and a
  // fresh Vector3 per Part per frame is 480 allocations a second for the GC to
  // clear up behind the render loop.
  const scratch = React.useRef({ anchor: new Vector3(), lean: { x: 0, y: 0 } });

  /*
   * `useFrame` runs outside React's render cycle and writes straight to the
   * scene graph. That is React Three Fiber's model, not a shortcut: routing
   * this through state would re-render the tree sixty times a second to move a
   * rifle. The camera comes from the frame state rather than `useThree` for
   * the same reason — it is the frame's camera, not a render-time value.
   */
  useFrame(({ camera, size }, delta) => {
    const state = reducedMotion
      ? deriveStaticSceneState(actInView)
      : deriveSceneState(progressRef.current);

    const root = rootRef.current;
    if (root) {
      root.position.set(...state.heroRifle.position);
      root.rotation.set(...state.heroRifle.rotation);
    }

    for (const [name, part] of parts) {
      const offset = state.parts[name];

      part.object.position.set(
        part.base.position.x + offset.position[0],
        part.base.position.y + offset.position[1],
        part.base.position.z + offset.position[2]
      );
      part.object.rotation.set(
        part.base.rotation.x + offset.rotation[0],
        part.base.rotation.y + offset.rotation[1],
        part.base.rotation.z + offset.rotation[2]
      );
    }

    const { position, target, fov } = state.camera;
    camera.position.set(...position);
    camera.lookAt(...target);

    if ("fov" in camera && camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    /*
     * The parallax lean is applied after `lookAt`, along the camera's own right
     * and up axes, so it slides the frame rather than swinging it — and so it
     * stays perpendicular to the view at every point of the page, without any
     * knowledge of which Act's angle is currently set.
     *
     * Nudging the camera and leaving the target where it was is what produces
     * the parallax: near and far read slightly different shifts.
     */
    const lean = parallaxOffset(pointerRef.current, {
      enabled: !reducedMotion && state.interaction.parts,
    });
    // Frame-rate independent: the same fraction of the remaining distance per
    // *second*, however many frames that second is cut into.
    const catchUp = 1 - Math.exp(-delta / PARALLAX_TIME_CONSTANT);
    const damped = scratch.current.lean;
    damped.x += (lean.x - damped.x) * catchUp;
    damped.y += (lean.y - damped.y) * catchUp;
    camera.translateX(damped.x);
    camera.translateY(damped.y);

    /*
     * Position the HUD last, from the camera as it finally stands. Projecting
     * before the lean was applied would leave the Callouts a frame behind the
     * rifle they are anchored to, which at this scale is the one thing that
     * would be visible.
     */
    channel.setAvailable(state.interaction.parts);
    camera.updateMatrixWorld();

    for (const [name, part] of parts) {
      const node = channel.nodes.get(name);
      if (!node) continue;

      part.object.updateWorldMatrix(true, false);
      const ndc = scratch.current.anchor
        .copy(part.anchor)
        .applyMatrix4(part.object.matrixWorld)
        .project(camera);

      const placement = placeCallout([ndc.x, ndc.y, ndc.z], size);

      // `hidden` rather than a class: a hotspot the visitor cannot see must not
      // be a tab stop either.
      node.hidden = !placement.visible;
      node.style.transform = `translate3d(${placement.x}px, ${placement.y}px, 0)`;
      node.dataset.side = placement.side;
      node.dataset.rise = placement.rise;
    }
  });

  return (
    <group ref={rootRef}>
      <primitive object={scene} />
    </group>
  );
}

/**
 * Where a Part's Callout attaches: the centre of its bounding box, in the
 * Part's own local space.
 *
 * Measured from the model rather than authored as eight vectors — the GLB is
 * the source of truth for where anything on the rifle is, and hand-written
 * anchors would silently drift the first time the model was re-exported.
 *
 * Local rather than world, because the rifle moves: the root travels during the
 * Act 2 → 3 drop, and each Part travels during Assembly.
 */
function measureAnchor(object: Object3D): Vector3 {
  const centre = new Box3().setFromObject(object).getCenter(new Vector3());
  return object.worldToLocal(centre);
}

interface BoundPart {
  object: Object3D;
  base: BaseTransform;
  anchor: Vector3;
}

interface BaseTransform {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
}
