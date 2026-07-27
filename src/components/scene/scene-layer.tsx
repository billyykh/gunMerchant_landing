"use client";

import * as React from "react";
import { Canvas } from "@react-three/fiber";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useActInView } from "@/hooks/use-act-in-view";

import { HeroRifle } from "./hero-rifle";
import { LoadingReadout } from "./loading-readout";
import { useScrollSpine } from "./use-scroll-spine";

/**
 * The persistent 3D layer.
 *
 * One full-viewport canvas, fixed behind the DOM, mounted for the whole page
 * lifecycle — it is never unmounted or swapped between Acts. The DOM sections
 * scroll over it.
 *
 * It is `aria-hidden`: the narrative lives in the Act sections as real text, so
 * a screen reader user gets the story rather than an empty page (MASTER.md §8).
 */
export function SceneLayer() {
  const reducedMotion = usePrefersReducedMotion();
  const progressRef = useScrollSpine(!reducedMotion);
  const actInView = useActInView(reducedMotion);

  return (
    <>
      <div className="fixed inset-0 z-0 bg-surface-0" aria-hidden="true">
        <Canvas
          camera={{ position: [0, 0.9, 5.2], fov: 42, near: 0.1, far: 100 }}
          dpr={[1, 2]}
          gl={{ antialias: true }}
        >
          <SceneLighting />

          <React.Suspense fallback={null}>
            <HeroRifle
              progressRef={progressRef}
              reducedMotion={reducedMotion}
              actInView={actInView}
            />
          </React.Suspense>
        </Canvas>
      </div>

      <LoadingReadout />
    </>
  );
}

/**
 * Lit brighter than the palette suggests, because the model is already dark:
 * the Hero Rifle's materials were pulled to a cool gunmetal at export
 * (src/assets/ASSETS.md), so lighting it to "near-black" a second time leaves
 * a silhouette with no surface. The background stays `--surface-0`; only the
 * subject is lifted.
 *
 * White key from camera-left for the machined metal, red rim from behind-right
 * to pick out the profile against the page, cool fill from below so the
 * underside does not go solid black.
 */
function SceneLighting() {
  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[-4, 5, 4]} intensity={5} color="#fff7ed" />
      <directionalLight position={[5, 1, -3]} intensity={3.5} color="#dc2626" />
      <directionalLight position={[0, -3, 2]} intensity={1.4} color="#7f8fa6" />
    </>
  );
}
