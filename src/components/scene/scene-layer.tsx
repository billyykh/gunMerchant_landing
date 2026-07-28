"use client";

import * as React from "react";
import { Canvas } from "@react-three/fiber";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useActInView } from "@/hooks/use-act-in-view";
import { usePointerNdc } from "@/hooks/use-pointer-ndc";
import { useOccludedBottom } from "@/hooks/use-occluded-bottom";
import { useIsCompact } from "@/hooks/use-media-query";
import { SCENE_LIGHTS } from "@/lib/scene-palette";

import { HotspotLayer } from "@/components/hud/hotspot-layer";
import {
  GEAR_HOTSPOT_ORDER,
  PART_HOTSPOT_ORDER,
  partHotspotIndexLabel,
} from "@/lib/hotspots";
import type { GearName, PartName } from "@/lib/scene-state";

import { createHotspotChannel } from "./hotspot-channel";
import { LoadingReadout } from "./loading-readout";
import { SceneContents } from "./scene-contents";
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
  const pointerRef = usePointerNdc();
  const occludedBottomRef = useOccludedBottom();
  const compact = useIsCompact();

  /*
   * One channel per interactive set, created here because this is the one place
   * that holds both ends of them: the canvas that writes and the HUD layers
   * that read. Two rather than one, because the two sets are available in
   * different Acts — a single channel would have to carry two availabilities,
   * and the layers would each have to work out which was theirs.
   */
  const [channels] = React.useState(() => ({
    parts: createHotspotChannel<PartName>(),
    gear: createHotspotChannel<GearName>(),
  }));

  return (
    <>
      <div className="fixed inset-0 z-0 bg-surface-0" aria-hidden="true">
        <Canvas
          // The Act 1 keyframe from Scene State, so the first painted frame is
          // already the pose `useFrame` is about to set.
          camera={{ position: [0.726, 0.73, -0.538], fov: 26, near: 0.1, far: 100 }}
          // MASTER.md §9: the base breakpoint caps the pixel ratio at 1.5.
          // A phone's 3x display asks for nine times the fragments of a 1x one
          // to render the same picture, which is the single biggest cost on a
          // device with the least to spend. Antialiasing goes with it — at
          // this pixel density the edges it smooths are sub-pixel anyway.
          dpr={compact ? [1, 1.5] : [1, 2]}
          gl={{ antialias: !compact }}
        >
          <SceneLighting compact={compact} />

          <React.Suspense fallback={null}>
            <SceneContents
              progressRef={progressRef}
              reducedMotion={reducedMotion}
              actInView={actInView}
              pointerRef={pointerRef}
              occludedBottomRef={occludedBottomRef}
              channels={channels}
            />
          </React.Suspense>
        </Canvas>
      </div>

      {/*
       * Outside the `aria-hidden` canvas wrapper on purpose — this is the one
       * part of the scene a visitor operates, so it has to be in the
       * accessibility tree (MASTER.md §8).
       */}
      <HotspotLayer
        channel={channels.parts}
        label="Parts"
        ids={PART_HOTSPOT_ORDER}
        indexLabel={partHotspotIndexLabel}
      />
      {/*
       * No index on the Lineup: four objects a visitor looks across, not a
       * sequence they count through (see `lib/hotspots.ts`).
       */}
      <HotspotLayer
        channel={channels.gear}
        label="Lineup"
        ids={GEAR_HOTSPOT_ORDER}
      />

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
 * Two white keys rather than one, because the camera crosses sides during the
 * page: Act 1 views from -Z, Acts 2 and 3 from +Z. A single key leaves
 * whichever Act it is behind lit by nothing but ambient and the red — and a
 * rim light that ends up on the camera's own axis stops rimming anything and
 * simply floods the subject with its colour. The red stays on the +X/-Z side
 * where it rims the profile for Acts 2 and 3; the second key covers Act 1 from
 * the side the red would otherwise wash.
 *
 * Cool fill from below so the underside does not go solid black.
 *
 * Halved on the base breakpoint (§9). Both white keys stay, because dropping
 * either leaves the Act on that side of the scene a silhouette — that is
 * content, and §9 downscales rendering, never content. What goes is the red rim
 * and the underside fill: the rim is an accent on the profile rather than
 * anything you read the shape by, and the fill only lifts a face that is
 * already pointing away. Ambient takes up the fill's slack.
 *
 * Colours resolve through `SCENE_LIGHTS`, which is checked against the ramp in
 * `globals.css` by its own test — three.js cannot read a CSS custom property,
 * so the alternative is four hex literals nobody maintains (§10).
 */
function SceneLighting({ compact }: { compact: boolean }) {
  return (
    <>
      <ambientLight intensity={compact ? 1.5 : 1.1} />
      <directionalLight
        position={[-4, 5, 4]}
        intensity={5}
        color={SCENE_LIGHTS.key}
      />
      <directionalLight
        position={[2, 4, -4]}
        intensity={3.2}
        color={SCENE_LIGHTS.key}
      />
      {!compact && (
        <>
          <directionalLight
            position={[5, 1, -3]}
            intensity={2}
            color={SCENE_LIGHTS.rim}
          />
          <directionalLight
            position={[0, -3, 2]}
            intensity={1.4}
            color={SCENE_LIGHTS.fill}
          />
        </>
      )}
    </>
  );
}
