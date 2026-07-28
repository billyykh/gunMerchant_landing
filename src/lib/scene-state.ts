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
 *
 * The boundaries answer to the DOM, which is what a visitor is actually
 * reading. With the Act sections at their current heights, the Gunsmith
 * heading scrolls into view at progress 0.25 and is centred at 0.39 — so
 * Assembly has to be finished by 0.25, not merely started. Ending it at 0.38
 * left the rifle visibly coming apart underneath copy that had already begun
 * describing it as assembled, and `scrub: 1` adds a further second of lag on
 * top. If the section heights change, re-measure and move these with them.
 */
export const SCROLL_WINDOWS = {
  /** Act 1 holds the Exploded arrangement before anything moves. */
  heroHold: { start: 0, end: 0.06 },
  /** Act 1 → 2: the Parts fly together, done before Act 2's copy is legible. */
  assembly: { start: 0.06, end: 0.24 },
  /** Act 2 settled: the Gunsmith View, where Parts are inspectable. */
  gunsmithHold: { start: 0.24, end: 0.62 },
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
 *
 * Matched to a supplied reference render of the Exploded state, which settles
 * two things this had been getting wrong:
 *
 * **Nothing rotates.** Every Part keeps the rifle's orientation and separates
 * by translation alone. A Part that tumbles as it comes off reads as a thing
 * that fell off the rifle; a Part that stays square to the others reads as a
 * thing that was taken off it.
 *
 * **Not every Part separates.** The barrel, receiver, scope and muzzle brake
 * stay as one body in the reference — the rifle is still recognisably a rifle —
 * and the fittings come away from underneath it. Exploding all eight loses the
 * silhouette the Act 1 composition is built around.
 *
 * **Every offset stays in the rifle's own X-Y plane — Z is always zero.** Z is
 * the rifle's 0.113 of thickness, so any offset on it takes a Part off the
 * shared centreline, and the camera passes straight down the barrel during
 * Assembly (Act 1 views from -Z, Act 2 from +Z, so the path crosses the axis).
 * From there even a 0.03 sideways drift is the one thing you can see. Parts
 * separate fore-and-aft and up-and-down; never sideways.
 *
 * Travel is short: against the 1.16-long rifle these read as clean gaps at
 * Act 1's tight framing (see `CAMERA_POSES.hero`).
 */
const EXPLODED_OFFSETS: Record<PartName, Transform> = {
  // The receiver is the chassis the rest comes off, and holds still.
  Rifle_Receiver: { position: [0, 0, 0], rotation: [0, 0, 0] },

  // Forward off the muzzle end. The brake travels further than the barrel it
  // threads onto, or the two end up occupying the same space.
  Rifle_MuzzleBrake: { position: [0.16, 0, 0], rotation: [0, 0, 0] },
  Rifle_Barrel: { position: [0.09, 0, 0], rotation: [0, 0, 0] },

  // Up off the top rail. The scope already sits highest on the rifle, so it has
  // the least headroom in Act 1's frame before it leaves the top of it.
  Rifle_Scope: { position: [0, 0.07, 0], rotation: [0, 0, 0] },

  // Back and up off the rear of the receiver.
  Rifle_Stock: { position: [-0.05, 0.06, 0], rotation: [0, 0, 0] },

  // Down out of the underside. The bolt draws only just clear of the receiver
  // it slides in; the bipod hangs below the barrel, where the frame runs out
  // fastest, so it stays shallower than the magazine despite mounting lower.
  Rifle_Bolt: { position: [0, -0.05, 0], rotation: [0, 0, 0] },
  Rifle_Magazine: { position: [-0.04, -0.16, 0], rotation: [0, 0, 0] },
  Rifle_Bipod: { position: [0, -0.1, 0], rotation: [0, 0, 0] },
};

/**
 * Where the Hero Rifle comes to rest at the end of the drop, and where each
 * Gear Item stands around it. One arrangement, authored together, so the Act 3
 * composition reads as a deliberate lineup rather than as five objects that
 * each decided where to stand.
 *
 * **Authored against the models' measured sizes** (`src/assets/ASSETS.md`,
 * "Measured sizes"), which are metric and small: the rifle is 1.16 long, but
 * the ammo box is 0.36 across, the drone 0.45, the night-vision scope 0.26 and
 * the torch 0.13. An arrangement spaced for objects the size of the rifle
 * leaves the small ones as specks either side of it.
 *
 * **Matched to a supplied reference render**, and solved from it rather than
 * eyeballed: each object's screen position in the reference was read as a
 * fraction of the frame, and a ray through that point was intersected with the
 * floor plane under the Act 3 camera below. The four Gear Items land within 4%
 * of frame height and 3% of frame width of where the reference puts them.
 *
 * **The gear stands on one floor, in a shallow arc, not on a receding
 * diagonal.** Every Gear Item's origin sits at its base (ASSETS.md, origin
 * conventions), so a shared `y` is a shared floor rather than a coincidence, and
 * that includes the drone — the reference sets it down on its legs at the left
 * of the group rather than flying it behind the row. The ammo box is the one
 * item set back, with the torch in front of it; the rest come forward toward the
 * lens as they get smaller.
 *
 * **The rifle is the right-hand diagonal.** It lies across the right of the
 * frame with its muzzle running up and away and its butt down toward the camera,
 * set back behind the gear row. That is the one placement that lets a 1.16-long
 * object share a frame with four objects a quarter its size — it reads as the
 * backdrop the gear is arranged in front of, rather than as a fifth member of
 * the row.
 *
 * The yaw is what produces that diagonal, and it is large: the GLB lays the
 * rifle along +X (muzzle +X, butt -X), so pointing the muzzle away and to the
 * left needs `cos(y) < 0`, hence ~2.47 rad rather than a small angle. The drop
 * interpolates rotation from zero, so the rifle turns through most of a
 * half-circle as it falls — a deliberate swing that ends in the reference pose,
 * not a wobble. It lies flat: the small roll it used to carry became a nose tilt
 * once the yaw passed 90°, and the reference has it level.
 *
 * The rifle still lands *above* the row and the camera drops to meet it, so the
 * Act 2 → 3 move reads as a fall — but it now rests 0.21 clear of the floor
 * rather than 0.64, because the reference shows a lineup laid out on one ground
 * plane, not a rifle hanging over one.
 *
 * **Two things the reference asks for that the models cannot give.** Its rifle
 * spans 47% of the frame where ours spans 30%: at 1.16 against a 0.36 ammo box,
 * that is the true proportion, and ASSETS.md is explicit that it is not to be
 * corrected by scaling a model. And its butt sits at 93% of the frame width,
 * which the solve reproduced on paper and the browser then rejected: the solve
 * treated this position as the butt, and the HeroRifle root's origin is the
 * rifle's *centre* (ASSETS.md, origin conventions), so the stock ran half a
 * length further right and hard into the frame edge. Placed by the centre
 * instead, which lands the butt at 86% — three points short of the reference,
 * and the margin that keeps the stock on screen.
 *
 * That still reaches into the right-hand third, where an open Detail Panel is
 * 420px wide. No *Gear Item* is under that panel — those are what it describes,
 * and a showcase turning behind its own panel would hide the one thing this Act
 * is for — but the rifle's rear end is, while a panel is open.
 */
const LINEUP_ARRANGEMENT = {
  heroRifle: { position: [0.85, -0.95, 0.05], rotation: [0, 2.47, 0] },
  gear: {
    Gear_ThermalDrone: { position: [-0.88, -1.16, 0.64], rotation: [0, 0.3, 0] },
    Gear_AmmoBox: { position: [-0.34, -1.16, 0.12], rotation: [0, 0.36, 0] },
    Gear_NightVisionScope: { position: [0.3, -1.16, 0.58], rotation: [0, -0.45, 0] },
    Gear_Torch: { position: [-0.25, -1.16, 0.53], rotation: [0, 0.55, 0] },
  },
} as const satisfies { heroRifle: Transform; gear: Record<GearName, Transform> };

/**
 * How large each Gear Item is rendered against its true exported size.
 *
 * Normally 1, and ASSETS.md is emphatic about why: the nine-to-one spread
 * between the rifle and the torch is real, and the Lineup composes around it
 * with depth and framing rather than by misreporting a size.
 *
 * The torch is an authored exception, asked for directly against the reference
 * render. At its true 0.13 it is a mark beside a 0.36 ammo box at this framing;
 * at 2x it is an object, which is what the Act needs it to be. Recorded here as
 * a named departure rather than by editing the arrangement to fake it, so the
 * one place the models are not shown at scale is impossible to miss.
 */
export const GEAR_SCALE = {
  Gear_ThermalDrone: 1,
  Gear_AmmoBox: 1,
  Gear_NightVisionScope: 1,
  Gear_Torch: 2,
} as const satisfies Record<GearName, number>;

/**
 * How much floor each object takes up — half its largest horizontal extent,
 * from the measured sizes recorded in `src/assets/ASSETS.md`.
 *
 * Restated here so the arrangement can be checked for what actually matters —
 * that no two objects stand in the same place — rather than against a round
 * clearance that happens to hold today. "Spread the Gear Items out" means
 * nothing until you know the drone is three and a half times the width of the
 * torch. ASSETS.md remains the source; if these disagree with it, it wins.
 */
export const LINEUP_FOOTPRINT_RADIUS = {
  heroRifle: 0.58,
  Gear_ThermalDrone: 0.225,
  Gear_AmmoBox: 0.21,
  Gear_NightVisionScope: 0.13,
  Gear_Torch: 0.065,
} as const satisfies Record<GearName | "heroRifle", number>;

/**
 * The floor a Gear Item takes up *as rendered* — its measured radius times
 * whatever `GEAR_SCALE` shows it at.
 *
 * The two are separate on purpose. `LINEUP_FOOTPRINT_RADIUS` is a transcription
 * of ASSETS.md and answers to the model; this answers to the composition. An
 * arrangement checked against the measured radius alone would call the 2x torch
 * clear of its neighbours using the footprint of a torch nobody is looking at.
 */
export function lineupFootprintRadius(name: GearName): number {
  return LINEUP_FOOTPRINT_RADIUS[name] * GEAR_SCALE[name];
}

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
  /**
   * Act 1: a tight high three-quarter, matched to a supplied reference frame —
   * muzzle running off the bottom-left, butt into the top-right corner.
   *
   * Solved rather than eyeballed. The GLB puts the rifle's long axis on X
   * (muzzle +X, butt -X), so requiring the -X axis to project up and to the
   * right on screen forces `sin(az) > 0` and `cos(az) < 0` at once — which
   * admits only the +X/-Z side of the rifle. The side is a consequence of the
   * composition, not a choice. Elevation 34°, azimuth 133°, distance 1.03 then
   * reproduce the reference's 31° on-screen axis and its framing.
   *
   * Note the target: the rifle's centre is at y = 0.125, not at the origin,
   * which sits under the stock.
   *
   * Then panned right and pulled back to 0.95x. Both are applied to camera and
   * target together — the pan along the camera's own right vector, the zoom by
   * scaling the offset between them — so neither one rotates the framing that
   * the reference fixed.
   */
  hero: { position: [0.726, 0.73, -0.538], target: [0.068, 0.125, 0.073], fov: 26 },
  /**
   * Act 2: three-quarter from the other side and lower. Framed as close as the
   * rifle allows while still holding all of it — the Gunsmith View has to carry
   * a Callout on every Part at once (ticket 13), so cropping an end would put a
   * Callout off-screen. At this distance the rifle spans about three quarters
   * of the frame.
   *
   * Camera and target are both shifted along the camera's own right vector, so
   * the framing pans without rotating. Panning by moving the target alone would
   * swing the camera and change the angle.
   *
   * The rifle used to sit left of centre. It is now centred, measured rather
   * than eyeballed: the midpoint of the eight projected Part anchors against
   * the midpoint of the frame, at 1626px wide. Two passes calibrated the pan at
   * roughly 1,900px per world unit at this distance, which is what the final
   * offset of ~0.040 back along the camera's right vector was solved from.
   *
   * Worth knowing before re-tuning: an open Detail Panel is 420px of the right
   * edge, and the muzzle already runs under it at this framing. Centring made
   * that overlap slightly worse and was still the right call — the resting
   * composition is what a visitor looks at for most of the Act.
   */
  gunsmith: { position: [0.830, 0.216, 1.066], target: [0.100, 0.125, -0.065], fov: 30 },
  /**
   * Act 3: dropped and pulled back to hold all five objects.
   *
   * Matched to the same reference render the arrangement is: square on to the
   * row in azimuth, and looking **down** it at 32° rather than the 12° this used
   * to sit at. The steep angle is what makes the reference legible — it opens
   * the floor out so the four Gear Items read as standing at different depths
   * instead of stacking into one horizontal band, and it shows the ammo box's
   * open tray rather than its rim edge-on.
   *
   * This is the camera `LINEUP_ARRANGEMENT` was solved against, so the two are
   * one composition and cannot be tuned apart: move this and every object moves
   * off its reference mark. 2.6 out at a 40° vertical field holds the group with
   * margin at 16:9, and `fitFraming` widens and dollies from there on anything
   * narrower.
   *
   * The optical axis passes *above* the objects rather than through them — the
   * reference sits the whole group in the lower two thirds of the frame and
   * leaves headroom, which is what a lineup photographed from standing height
   * looks like.
   */
  lineup: { position: [0.05, 0.778, 2.505], target: [0.05, -0.6, 0.3], fov: 40 },
};

/**
 * The `prefers-reduced-motion` framings — one composed still per Act.
 *
 * Act 1 gets its own pose rather than borrowing the scroll keyframe. The
 * scrubbed Act 1 deliberately crops — the muzzle runs off the bottom of the
 * frame, and the visitor scrolls on within a moment. A still is the whole of
 * what this visitor will ever see of Act 1, so it holds the same angle but
 * steps back far enough that nothing is cut off.
 *
 * Acts 2 and 3 are already composed around a settled subject, so their
 * framings carry over.
 */
const STILL_CAMERA_POSES: Record<Act, CameraPose> = {
  hero: { position: [0.888, 0.88, -0.687], target: [0.068, 0.125, 0.073], fov: 26 },
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
