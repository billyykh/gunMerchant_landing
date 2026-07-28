"use client";

import * as React from "react";
import { useGLTF } from "@react-three/drei";

import { GEAR_NAMES, type GearName } from "@/lib/scene-state";

import { measureAnchor, type Anchored } from "./project-hotspots";

/**
 * One GLB per Gear Item, each with a single root object named to the contract
 * in `src/assets/ASSETS.md`.
 *
 * Deliberately *not* preloaded alongside the Hero Rifle. The four are ~7.8 MB
 * and are not on screen until Act 3, while the rifle is what Act 1 opens on;
 * fetching everything up front pushes out the one asset the first paint
 * actually needs.
 */
export const GEAR_URLS = {
  Gear_AmmoBox: "/models/ammo-box.glb",
  Gear_ThermalDrone: "/models/thermal-drone.glb",
  Gear_Torch: "/models/torch.glb",
  Gear_NightVisionScope: "/models/night-vision-scope.glb",
} as const satisfies Record<GearName, string>;

export function useLineupGear(): { items: Map<GearName, Anchored> } {
  // Array form, because the number of Gear Items is fixed by the contract but
  // hooks cannot be called in a loop over it.
  const loaded = useGLTF(GEAR_NAMES.map((name) => GEAR_URLS[name]));

  const items = React.useMemo(() => {
    const found = new Map<GearName, Anchored>();

    GEAR_NAMES.forEach((name, index) => {
      const scene = loaded[index]?.scene;
      if (!scene) return;

      /*
       * The scene root is what gets rendered and moved, not the contract-named
       * object inside it. `<primitive>` re-parents whatever it is given into
       * the React Three Fiber tree — hand it the inner object and the loaded
       * scene is left empty, so the next render finds nothing to bind and the
       * Lineup silently disappears. (Caught in the browser: React's development
       * double-render made it the second pass that came up empty.)
       *
       * Each of these GLBs is a single root object exported with its transform
       * applied (ASSETS.md), so the scene and that object are the same thing
       * geometrically; the name is still checked, because it is the contract
       * that says which file is which.
       */
      if (!scene.getObjectByName(name)) {
        console.warn(
          `[scene] ${GEAR_URLS[name]} has no object named "${name}". ` +
            "The Lineup binds by the names in src/assets/ASSETS.md."
        );
      }

      found.set(name, { object: scene, anchor: measureAnchor(scene) });
    });

    return found;
  }, [loaded]);

  return { items };
}
