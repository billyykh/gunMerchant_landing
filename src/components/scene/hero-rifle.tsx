"use client";

import * as React from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { Group, Object3D } from "three";

import {
  PART_NAMES,
  type Act,
  type PartName,
  deriveSceneState,
  deriveStaticSceneState,
} from "@/lib/scene-state";

export const HERO_RIFLE_URL = "/models/hero-rifle.glb";

useGLTF.preload(HERO_RIFLE_URL);

interface HeroRifleProps {
  /** Live scroll progress. Read per frame; never a React render trigger. */
  progressRef: React.RefObject<number>;
  reducedMotion: boolean;
  actInView: Act;
}

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
    const found = new Map<PartName, { object: Object3D; base: BaseTransform }>();

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
      });
    }

    return found;
  }, [scene]);

  /*
   * `useFrame` runs outside React's render cycle and writes straight to the
   * scene graph. That is React Three Fiber's model, not a shortcut: routing
   * this through state would re-render the tree sixty times a second to move a
   * rifle. The camera comes from the frame state rather than `useThree` for
   * the same reason — it is the frame's camera, not a render-time value.
   */
  useFrame(({ camera }) => {
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
  });

  return (
    <group ref={rootRef}>
      <primitive object={scene} />
    </group>
  );
}

interface BaseTransform {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
}
