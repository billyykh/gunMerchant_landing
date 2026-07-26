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
 * The page's scroll windows.
 *
 * Deliberately NOT called "Act ranges": there are three Acts (CONTEXT.md) but
 * five windows, because the transitions between Acts have to be first-class —
 * interaction is offered during the holds and withdrawn during the transitions.
 * A `*Hold` window is where an Act sits still; the other two are the moves
 * between them.
 */
export const SCROLL_WINDOWS = {
  /** Act 1 holds the Exploded arrangement before anything moves. */
  heroHold: { start: 0, end: 0.08 },
  /** Act 1 → 2: the Parts fly together. */
  assembly: { start: 0.08, end: 0.38 },
  /** Act 2 settled: the Gunsmith View, where Parts are inspectable. */
  gunsmithHold: { start: 0.38, end: 0.62 },
  /** Act 2 → 3: the Hero Rifle falls into the Lineup. */
  drop: { start: 0.62, end: 0.82 },
  /** Act 3 settled: the Lineup, where Gear Items are inspectable. */
  lineupHold: { start: 0.82, end: 1 },
} as const;

export type ScrollWindow = keyof typeof SCROLL_WINDOWS;

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

/**
 * The Gear Items of the Lineup, named exactly as the root object of each GLB
 * is named. Binding contract with the Blender pipeline — see
 * `src/assets/ASSETS.md`. The hunting jacket is out of scope.
 */
export const GEAR_NAMES = [
  "Gear_AmmoBox",
  "Gear_ThermalDrone",
  "Gear_Torch",
  "Gear_NightVisionScope",
] as const;

export type GearName = (typeof GEAR_NAMES)[number];

export interface Transform {
  position: Vec3;
  /** Radians. */
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
const EXPLODED_OFFSETS: Record<PartName, Transform> = {
  Rifle_Barrel: { position: [0.55, 0.42, -0.3], rotation: [0.18, -0.32, 0.12] },
  Rifle_Receiver: {
    position: [-0.12, 0.08, 0.34],
    rotation: [-0.1, 0.22, -0.06],
  },
  Rifle_Bolt: { position: [0.24, -0.46, 0.52], rotation: [0.42, 0.5, -0.28] },
  Rifle_Stock: { position: [-0.78, -0.24, -0.18], rotation: [-0.14, -0.38, 0.2] },
  Rifle_Scope: { position: [0.08, 0.62, 0.28], rotation: [0.26, 0.16, -0.34] },
  Rifle_Magazine: { position: [-0.3, -0.58, 0.16], rotation: [-0.3, 0.44, 0.18] },
  Rifle_Bipod: { position: [0.42, -0.36, -0.44], rotation: [0.22, -0.26, -0.4] },
  Rifle_MuzzleBrake: { position: [0.92, 0.2, 0.22], rotation: [-0.24, 0.36, 0.3] },
};

/**
 * Where the Hero Rifle comes to rest at the end of the drop, and where each
 * Gear Item stands around it. One arrangement, authored together, so the Act 3
 * composition reads as a deliberate lineup rather than as five objects that
 * each decided where to stand.
 *
 * The thermal drone sits highest — it is the one object that flies.
 */
const LINEUP_ARRANGEMENT = {
  heroRifle: { position: [0, -1.4, 0], rotation: [0, -0.35, 0.06] },
  gear: {
    Gear_AmmoBox: { position: [-2.2, -1.55, 0.3], rotation: [0, 0.4, 0] },
    Gear_ThermalDrone: { position: [-1.05, -0.85, -0.45], rotation: [0, -0.2, 0] },
    Gear_Torch: { position: [1.25, -1.6, 0.35], rotation: [0, 0.55, 0] },
    Gear_NightVisionScope: { position: [2.15, -1.5, -0.1], rotation: [0, -0.5, 0] },
  },
} as const satisfies { heroRifle: Transform; gear: Record<GearName, Transform> };

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
const CAMERA_POSES: Record<Act, CameraPose> = {
  /** Act 1: wide and pulled back — the Parts read as a field behind the type. */
  hero: { position: [0, 0.9, 5.2], target: [0, 0.2, 0], fov: 42 },
  /** Act 2: close three-quarter, tighter lens. Inspection framing. */
  gunsmith: { position: [1.5, 0.3, 2.2], target: [0, 0, 0], fov: 32 },
  /** Act 3: raised and pulled back to hold all five objects. */
  lineup: { position: [0, 1.2, 6.5], target: [0, -1.4, 0], fov: 40 },
};

/**
 * The `prefers-reduced-motion` framings — one composed still per Act.
 *
 * Act 1 gets its own pose rather than borrowing the scroll keyframe: that one
 * is pulled back to hold the Exploded Parts spread behind the brand lockup,
 * and with nothing Exploded to hold it strands the assembled rifle in the
 * middle of an empty frame. Acts 2 and 3 are already composed around a settled
 * subject, so their framings carry over.
 */
const STILL_CAMERA_POSES: Record<Act, CameraPose> = {
  hero: { position: [0.9, 0.35, 3.4], target: [0, 0, 0], fov: 38 },
  gunsmith: { ...CAMERA_POSES.gunsmith },
  lineup: { ...CAMERA_POSES.lineup },
};

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
  /** 0 = at rest in the Gunsmith View, 1 = landed in the Lineup. */
  dropProgress: number;
  /**
   * The Hero Rifle as a whole: where the assembled rifle sits in the world.
   * Part transforms are offsets relative to this.
   */
  heroRifle: Transform;
  parts: Record<PartName, Transform>;
  gear: Record<GearName, Transform>;
  camera: CameraPose;
  interaction: InteractionAvailability;
}

export function deriveSceneState(progress: number): SceneState {
  const assemblyProgress = progressWithin("assembly", progress);
  const dropProgress = progressWithin("drop", progress);

  return {
    act: deriveAct(progress),
    assemblyProgress,
    dropProgress,
    heroRifle: deriveHeroRifleTransform(dropProgress),
    parts: derivePartTransforms(assemblyProgress),
    gear: { ...LINEUP_ARRANGEMENT.gear },
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
  // Acts 1 and 2 are both stills of the rifle at its Gunsmith rest pose; only
  // Act 3 shows it landed among the Gear Items.
  const dropProgress = act === "lineup" ? 1 : 0;

  return {
    act,
    assemblyProgress: 1,
    dropProgress,
    heroRifle: deriveHeroRifleTransform(dropProgress),
    parts: derivePartTransforms(1),
    gear: { ...LINEUP_ARRANGEMENT.gear },
    camera: { ...STILL_CAMERA_POSES[act] },
    interaction: {
      parts: act === "gunsmith",
      gear: act === "lineup",
    },
  };
}

/**
 * Which window the page is scrolled into, and how far through it.
 *
 * Every derivation goes through this one resolver. Deriving Act, camera and
 * interaction from three separate boundary cascades is how their notions of
 * "past the drop" quietly drift apart.
 */
function resolveWindow(progress: number): { window: ScrollWindow; t: number } {
  const window = (Object.keys(SCROLL_WINDOWS) as ScrollWindow[]).find(
    (candidate) => progress < SCROLL_WINDOWS[candidate].end
  );

  // Only progress >= 1 falls past every window.
  const resolved = window ?? "lineupHold";

  return { window: resolved, t: progressWithin(resolved, progress) };
}

function deriveAct(progress: number): Act {
  switch (resolveWindow(progress).window) {
    case "heroHold":
    case "assembly":
      return "hero";
    case "gunsmithHold":
    case "drop":
      return "gunsmith";
    case "lineupHold":
      return "lineup";
  }
}

function derivePartTransforms(
  assemblyProgress: number
): Record<PartName, Transform> {
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
  ) as Record<PartName, Transform>;
}

/**
 * The Hero Rifle falls from the Gunsmith View's rest pose into its place in
 * the Lineup. Its height is monotonic in scroll progress, which is what lets
 * scrubbing back up retrace the fall instead of bouncing.
 */
function deriveHeroRifleTransform(dropProgress: number): Transform {
  const landed = LINEUP_ARRANGEMENT.heroRifle;

  return {
    position: scale(landed.position, dropProgress),
    rotation: scale(landed.rotation, dropProgress),
  };
}

function deriveCamera(progress: number): CameraPose {
  const { window, t } = resolveWindow(progress);

  switch (window) {
    case "heroHold":
      return { ...CAMERA_POSES.hero };
    case "assembly":
      return lerpPose(CAMERA_POSES.hero, CAMERA_POSES.gunsmith, t);
    case "gunsmithHold":
      return { ...CAMERA_POSES.gunsmith };
    case "drop":
      return lerpPose(CAMERA_POSES.gunsmith, CAMERA_POSES.lineup, t);
    case "lineupHold":
      return { ...CAMERA_POSES.lineup };
  }
}

/**
 * Interaction is offered only while the scene is settled. Mid-Assembly and
 * mid-drop the subject is moving under the cursor, so a Callout anchored to it
 * would chase the pointer.
 */
function deriveInteraction(progress: number): InteractionAvailability {
  const { window } = resolveWindow(progress);

  return {
    parts: window === "gunsmithHold",
    gear: window === "lineupHold",
  };
}

/** Where `progress` sits inside a window, clamped to [0, 1] outside it. */
function progressWithin(window: ScrollWindow, progress: number): number {
  const { start, end } = SCROLL_WINDOWS[window];
  return clamp01((progress - start) / (end - start));
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Multiplying a negative offset by zero yields -0, which survives into the
 * three.js scene graph and into any structural comparison a consumer makes.
 * Normalise it away at the source.
 */
function scale([x, y, z]: Vec3, factor: number): Vec3 {
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
