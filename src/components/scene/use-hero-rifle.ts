"use client";

import * as React from "react";
import { useGLTF } from "@react-three/drei";
import type { Euler, Object3D, Vector3 } from "three";

import { PART_NAMES, type PartName } from "@/lib/scene-state";

import { measureAnchor, type Anchored } from "./project-hotspots";

export const HERO_RIFLE_URL = "/models/hero-rifle.glb";

useGLTF.preload(HERO_RIFLE_URL);

export interface BoundPart extends Anchored {
  /** The Part's exported pose, which *is* its assembled pose. */
  base: { position: Vector3; rotation: Euler };
}

export interface BoundHeroRifle {
  scene: Object3D;
  parts: Map<PartName, BoundPart>;
}

/**
 * Load the Hero Rifle and bind its Parts.
 *
 * The exported transform of each Part is its assembled pose
 * (`src/assets/ASSETS.md`), so it is captured once here and everything the
 * Scene State seam returns is applied as an offset from it. Binding is by the
 * contract mesh names, never by traversal order.
 */
export function useHeroRifle(): BoundHeroRifle {
  const { scene } = useGLTF(HERO_RIFLE_URL);

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

  return { scene, parts };
}
