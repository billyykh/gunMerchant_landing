"use client";

import * as React from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, type Group } from "three";

import {
  SHOWCASE_AT_REST,
  advanceShowcase,
  deriveGearPresentation,
} from "@/lib/gear-presentation";
import { parallaxOffset, type PointerNdc } from "@/lib/parallax";
import {
  GEAR_NAMES,
  type Act,
  type GearName,
  type PartName,
  deriveSceneState,
  deriveStaticSceneState,
} from "@/lib/scene-state";

import type { HotspotChannel } from "./hotspot-channel";
import { projectHotspots } from "./project-hotspots";
import { useHeroRifle } from "./use-hero-rifle";
import { useLineupGear } from "./use-lineup-gear";

interface SceneContentsProps {
  /** Live scroll progress. Read per frame; never a React render trigger. */
  progressRef: React.RefObject<number>;
  reducedMotion: boolean;
  actInView: Act;
  /** Live pointer position, for the Gunsmith View's parallax. */
  pointerRef: React.RefObject<PointerNdc>;
  channels: {
    parts: HotspotChannel<PartName>;
    gear: HotspotChannel<GearName>;
  };
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
 * How long a Gear Item takes to settle at its new height when it is pointed at
 * or let go of — the same damping, tuned to `--dur-fast` rather than to a
 * camera move, because this is a hover response (MASTER.md §6).
 */
const GEAR_FLOAT_TIME_CONSTANT = 0.08;

/**
 * Everything in the scene, driven from one `useFrame`.
 *
 * One loop, not one per object, for two reasons. The Scene State is derived
 * once per frame rather than once per consumer, so nothing in the scene can
 * disagree about which frame it is on. And the HUD projections have to run
 * *after* the camera is placed — split across two components they would depend
 * on React Three Fiber's subscription order, which is mount order, which
 * Suspense is free to change.
 *
 * `useFrame` runs outside React's render cycle and writes straight to the scene
 * graph. That is React Three Fiber's model, not a shortcut: routing this
 * through state would re-render the tree sixty times a second to move a rifle.
 */
export function SceneContents({
  progressRef,
  reducedMotion,
  actInView,
  pointerRef,
  channels,
}: SceneContentsProps) {
  const { scene, parts } = useHeroRifle();
  const { items } = useLineupGear();
  const rifleRef = React.useRef<Group>(null);

  // Scratch allocated once. Everything below runs every frame, and a fresh
  // Vector3 per object per frame is hundreds of allocations a second for the
  // collector to clear up behind the render loop.
  const scratch = React.useRef({
    anchor: new Vector3(),
    lean: { x: 0, y: 0 },
    showcase: SHOWCASE_AT_REST,
    /** Gear Items that have had at least one frame, so may be eased. */
    settled: new Set<GearName>(),
  });

  useFrame(({ camera, size }, delta) => {
    const state = reducedMotion
      ? deriveStaticSceneState(actInView)
      : deriveSceneState(progressRef.current);

    const rifle = rifleRef.current;
    if (rifle) {
      rifle.position.set(...state.heroRifle.position);
      rifle.rotation.set(...state.heroRifle.rotation);
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

    // The Lineup answers to the pointer as well as to scroll: hovering lifts a
    // Gear Item and selecting turns it. Both are 3D, so the DOM hotspots report
    // what they are doing back through the channel and the rules live in the
    // `gear-presentation` seam.
    const selected = channels.gear.getSelected();
    scratch.current.showcase = advanceShowcase(
      scratch.current.showcase,
      selected,
      delta
    );

    const gear = deriveGearPresentation({
      base: state.gear,
      hovered: channels.gear.getActive(),
      selected,
      showcase: scratch.current.showcase,
      reducedMotion,
    });

    /*
     * The lift is eased into, not snapped to. `deriveGearPresentation` states
     * where a Gear Item should be — up if it is being pointed at, down if not —
     * and that is a step; §6.2 calls this a float-up, and an object that
     * teleports 0.06 and back is not floating.
     *
     * Damped here rather than in the seam for the same reason the parallax is:
     * the rule is "hovered items sit higher", and how long the scene takes to
     * agree is a property of the frame loop, not of the rule. The rotation is
     * left alone — it is already time-integrated, and easing toward a target
     * that has turned several times would rewind it.
     */
    const settled = scratch.current.settled;
    const lift = 1 - Math.exp(-delta / GEAR_FLOAT_TIME_CONSTANT);

    for (const [name, item] of items) {
      const [x, y, z] = gear[name].position;
      // A Gear Item's first frame is a placement, not a float: eased from
      // wherever the GLB happened to sit, it would drift into the Lineup from
      // the origin the first time Act 3 came into view.
      const from = settled.has(name) ? item.object.position.y : y;

      item.object.position.set(x, from + (y - from) * lift, z);
      item.object.rotation.set(...gear[name].rotation);
      settled.add(name);
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

    // The HUD goes last, from the camera as it finally stands.
    camera.updateMatrixWorld();
    channels.parts.setAvailable(state.interaction.parts);
    channels.gear.setAvailable(state.interaction.gear);
    projectHotspots(channels.parts, parts, camera, size, scratch.current.anchor);
    projectHotspots(channels.gear, items, camera, size, scratch.current.anchor);
  });

  return (
    <>
      <group ref={rifleRef}>
        <primitive object={scene} />
      </group>

      {GEAR_NAMES.map((name) => {
        const item = items.get(name);
        return item ? <primitive key={name} object={item.object} /> : null;
      })}
    </>
  );
}

