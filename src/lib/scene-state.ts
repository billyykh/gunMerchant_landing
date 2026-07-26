/**
 * Scene State — the project's single primary seam.
 *
 * Derives everything the 3D layer needs (Part transforms, camera pose, active
 * Act, interaction availability) from one number: global scroll progress. Pure
 * logic, no WebGL, no React — so the narrative can be tested without a canvas.
 *
 * Rendering consumes this. It never computes narrative logic itself.
 */

export type Act = "hero" | "gunsmith" | "lineup";

/**
 * Scroll ranges that define the page's narrative. Progress runs 0 (top) to
 * 1 (bottom). The settled windows between the transitions are where the page
 * holds still and interaction is offered.
 */
export const ACT_RANGES = {
  /** Act 1 holds the Exploded arrangement before anything moves. */
  hero: { start: 0, end: 0.08 },
  /** Act 1 → 2: the Parts fly together. */
  assembly: { start: 0.08, end: 0.38 },
  /** Act 2 settled: the Gunsmith View, where Parts are inspectable. */
  gunsmith: { start: 0.38, end: 0.62 },
  /** Act 2 → 3: the Hero Rifle falls into the Lineup. */
  drop: { start: 0.62, end: 0.82 },
  /** Act 3 settled: the Lineup, where Gear Items are inspectable. */
  lineup: { start: 0.82, end: 1 },
} as const;

export type Vec3 = [number, number, number];

/**
 * The Hero Rifle's Parts, named exactly as the meshes are named in
 * `hero-rifle.glb`. This is a binding contract with the Blender pipeline —
 * see `src/assets/ASSETS.md`. Renaming here silently breaks Assembly.
 */
export const PART_NAMES = [
  "Rifle_Barrel",
  "Rifle_Receiver",
  "Rifle_Bolt",
  "Rifle_Stock",
  "Rifle_Scope",
  "Rifle_Magazine",
  "Rifle_Bipod",
  "Rifle_MuzzleBrake",
] as const;

export type PartName = (typeof PART_NAMES)[number];

export interface PartTransform {
  /** Offset from the Part's assembled pose, in metres. */
  position: Vec3;
  /** Offset from the Part's assembled orientation, in radians. */
  rotation: Vec3;
}

/**
 * The Exploded pose, expressed as an offset from each Part's assembled pose.
 *
 * The GLB exports every Part already in its assembled position (ASSETS.md), so
 * the assembled pose is the zero offset and Exploded is authored here in code.
 * Parts disperse into a shallow slab so they read as a considered arrangement
 * behind the Act 1 brand lockup rather than as debris.
 */
const EXPLODED_OFFSETS: Record<PartName, PartTransform> = {
  Rifle_Barrel: { position: [0.55, 0.42, -0.3], rotation: [0.18, -0.32, 0.12] },
  Rifle_Receiver: { position: [-0.12, 0.08, 0.34], rotation: [-0.1, 0.22, -0.06] },
  Rifle_Bolt: { position: [0.24, -0.46, 0.52], rotation: [0.42, 0.5, -0.28] },
  Rifle_Stock: { position: [-0.78, -0.24, -0.18], rotation: [-0.14, -0.38, 0.2] },
  Rifle_Scope: { position: [0.08, 0.62, 0.28], rotation: [0.26, 0.16, -0.34] },
  Rifle_Magazine: { position: [-0.3, -0.58, 0.16], rotation: [-0.3, 0.44, 0.18] },
  Rifle_Bipod: { position: [0.42, -0.36, -0.44], rotation: [0.22, -0.26, -0.4] },
  Rifle_MuzzleBrake: { position: [0.92, 0.2, 0.22], rotation: [-0.24, 0.36, 0.3] },
};

export interface CameraPose {
  position: Vec3;
  target: Vec3;
  fov: number;
}

/**
 * One framed composition per settled Act. The camera rests on these and
 * travels between them during Assembly and the drop, so the Hero Rifle is
 * well composed at every scroll position rather than only at the ends.
 */
const CAMERA_POSES = {
  /** Act 1: wide and pulled back — the Parts read as a field behind the type. */
  hero: { position: [0, 0.9, 5.2], target: [0, 0.2, 0], fov: 42 },
  /** Act 2: close three-quarter, tighter lens. Inspection framing. */
  gunsmith: { position: [1.5, 0.3, 2.2], target: [0, 0, 0], fov: 32 },
  /** Act 3: raised and pulled back to hold all five objects. */
  lineup: { position: [0, 1.2, 6.5], target: [0, -1.4, 0], fov: 40 },
} as const satisfies Record<string, CameraPose>;

export interface InteractionAvailability {
  /** Hover/click on Hero Rifle Parts — the Gunsmith View. */
  parts: boolean;
  /** Hover/click on Gear Items — the Lineup. */
  gear: boolean;
}

export interface SceneState {
  act: Act;
  /** 0 = fully Exploded, 1 = fully assembled. */
  assemblyProgress: number;
  parts: Record<PartName, PartTransform>;
  camera: CameraPose;
  interaction: InteractionAvailability;
}

export function deriveSceneState(progress: number): SceneState {
  const assemblyProgress = progressWithin(ACT_RANGES.assembly, progress);

  return {
    act: deriveAct(progress),
    assemblyProgress,
    parts: derivePartTransforms(assemblyProgress),
    camera: deriveCamera(progress),
    interaction: deriveInteraction(progress),
  };
}

/**
 * The `prefers-reduced-motion` path: one deliberately composed still per Act,
 * selected by which Act's DOM section is in view rather than by scroll
 * position (MASTER.md §6.3).
 *
 * This is a first-class output, not a degraded one. The Hero Rifle is shown
 * assembled in every Act — a frozen Exploded pile reads as a broken page to a
 * visitor who will never see it come together — and every interaction the
 * animated path offers is offered here too. Reduced motion removes animation,
 * never functionality.
 */
export function deriveStaticSceneState(act: Act): SceneState {
  return {
    act,
    assemblyProgress: 1,
    parts: derivePartTransforms(1),
    camera: { ...CAMERA_POSES[act] },
    interaction: {
      parts: act === "gunsmith",
      gear: act === "lineup",
    },
  };
}

function deriveCamera(progress: number): CameraPose {
  if (progress <= ACT_RANGES.assembly.start) return { ...CAMERA_POSES.hero };

  if (progress < ACT_RANGES.assembly.end) {
    return lerpPose(
      CAMERA_POSES.hero,
      CAMERA_POSES.gunsmith,
      progressWithin(ACT_RANGES.assembly, progress)
    );
  }

  if (progress < ACT_RANGES.drop.start) return { ...CAMERA_POSES.gunsmith };

  if (progress < ACT_RANGES.drop.end) {
    return lerpPose(
      CAMERA_POSES.gunsmith,
      CAMERA_POSES.lineup,
      progressWithin(ACT_RANGES.drop, progress)
    );
  }

  return { ...CAMERA_POSES.lineup };
}

/**
 * Interaction is offered only while the scene is settled. Mid-Assembly and
 * mid-drop the subject is moving under the cursor, so a Callout anchored to it
 * would chase the pointer.
 */
function deriveInteraction(progress: number): InteractionAvailability {
  return {
    parts:
      progress >= ACT_RANGES.gunsmith.start &&
      progress <= ACT_RANGES.gunsmith.end,
    gear: progress >= ACT_RANGES.lineup.start,
  };
}

function deriveAct(progress: number): Act {
  if (progress < ACT_RANGES.assembly.end) return "hero";
  if (progress < ACT_RANGES.drop.end) return "gunsmith";
  return "lineup";
}

function derivePartTransforms(
  assemblyProgress: number
): Record<PartName, PartTransform> {
  // Parts travel from their Exploded offset to zero — the assembled pose.
  const remaining = 1 - assemblyProgress;

  return Object.fromEntries(
    PART_NAMES.map((name) => {
      const exploded = EXPLODED_OFFSETS[name];
      return [
        name,
        {
          position: scale(exploded.position, remaining),
          rotation: scale(exploded.rotation, remaining),
        },
      ];
    })
  ) as Record<PartName, PartTransform>;
}

/** Where `progress` sits inside `range`, clamped to [0, 1] outside it. */
function progressWithin(
  range: { start: number; end: number },
  progress: number
): number {
  return clamp01((progress - range.start) / (range.end - range.start));
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function scale([x, y, z]: Vec3, factor: number): Vec3 {
  // Multiplying by exactly 0 can yield -0, which fails a toEqual([0, 0, 0]).
  return [x * factor || 0, y * factor || 0, z * factor || 0];
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

function lerpVec3(from: Vec3, to: Vec3, t: number): Vec3 {
  return [
    lerp(from[0], to[0], t),
    lerp(from[1], to[1], t),
    lerp(from[2], to[2], t),
  ];
}

function lerpPose(from: CameraPose, to: CameraPose, t: number): CameraPose {
  return {
    position: lerpVec3(from.position, to.position, t),
    target: lerpVec3(from.target, to.target, t),
    fov: lerp(from.fov, to.fov, t),
  };
}
