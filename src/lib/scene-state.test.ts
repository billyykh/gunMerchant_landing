import { describe, expect, it } from "vitest";
import { FRAMING_REFERENCE_ASPECT } from "./camera-framing";
import {
  GEAR_NAMES,
  GEAR_SCALE,
  PART_NAMES,
  SCROLL_WINDOWS,
  type CameraPose,
  type SceneState,
  type Transform,
  type Vec3,
  deriveSceneState,
  deriveStaticSceneState,
  lineupFootprintRadius,
} from "./scene-state";

/** A scrub of the whole page, fine enough to catch a discontinuity. */
const SCROLL_SAMPLES = Array.from({ length: 101 }, (_, step) => step / 100);

const midpoint = (range: { start: number; end: number }) =>
  (range.start + range.end) / 2;

const at = (range: { start: number; end: number }, t: number) =>
  range.start + (range.end - range.start) * t;

const length = ([x, y, z]: Vec3) => Math.hypot(x, y, z);

const distanceBetween = (a: Vec3, b: Vec3) =>
  length([a[0] - b[0], a[1] - b[1], a[2] - b[2]]);

/** How far the camera sits from whatever it is pointed at. */
const framingDistance = ({ camera }: SceneState) =>
  distanceBetween(camera.position, camera.target);

const minus = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit = (v: Vec3): Vec3 => {
  const size = length(v);
  return [v[0] / size, v[1] / size, v[2] / size];
};

/** The rifle's overall length, from ASSETS.md's measured sizes. */
const RIFLE_LENGTH = 1.16;

/**
 * Both ends of the rifle, given where its root sits and which way it is turned.
 *
 * The GLB lays it along +X, and the root's origin is its *centre* (ASSETS.md),
 * so each end is half a length along the yawed X axis — the muzzle at +X, the
 * butt at -X.
 */
const endsOf = ({ position, rotation }: Transform): [Vec3, Vec3] => {
  const reach = RIFLE_LENGTH / 2;
  const along = (sign: number): Vec3 => [
    position[0] + Math.cos(rotation[1]) * reach * sign,
    position[1],
    position[2] - Math.sin(rotation[1]) * reach * sign,
  ];

  return [along(1), along(-1)];
};

/**
 * Where a world point lands in the frame: 0 at the centre, ±1 at each edge,
 * with `depth` positive for anything in front of the lens.
 *
 * Written out here rather than imported, because the point of the framing tests
 * is to check the poses against an independent projection. Measured at the
 * reference aspect the poses are authored in — `fitFraming` only ever *adds*
 * width to a narrower window, so a composition that fits at 16:9 fits anywhere.
 */
const projectInto = ({ position, target, fov }: CameraPose, point: Vec3) => {
  const forward = unit(minus(target, position));
  const right = unit(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);
  const offset = minus(point, position);
  const depth = dot(offset, forward);
  const tanHalf = Math.tan((fov * Math.PI) / 360);

  return {
    x: dot(offset, right) / (depth * tanHalf * FRAMING_REFERENCE_ASPECT),
    y: dot(offset, up) / (depth * tanHalf),
    depth,
  };
};

describe("act derivation", () => {
  it("is in the Hero Act at the top of the page", () => {
    expect(deriveSceneState(0).act).toBe("hero");
  });

  it("is in the Gunsmith Act once Assembly completes", () => {
    expect(deriveSceneState(SCROLL_WINDOWS.assembly.end).act).toBe("gunsmith");
  });

  it("is in the Lineup Act once the drop completes", () => {
    expect(deriveSceneState(SCROLL_WINDOWS.drop.end).act).toBe("lineup");
  });

  it("is still in the Lineup Act at the bottom of the page", () => {
    expect(deriveSceneState(1).act).toBe("lineup");
  });
});

describe("Assembly", () => {
  const explodedSpread = (progress: number) =>
    PART_NAMES.reduce(
      (total, name) => total + length(deriveSceneState(progress).parts[name].position),
      0
    );

  it("reports every contract Part", () => {
    const { parts } = deriveSceneState(0);
    expect(Object.keys(parts).sort()).toEqual([...PART_NAMES].sort());
  });

  it("holds the Parts Exploded through Act 1", () => {
    expect(deriveSceneState(0).assemblyProgress).toBe(0);
    expect(deriveSceneState(SCROLL_WINDOWS.assembly.start).assemblyProgress).toBe(0);
  });

  it("completes Assembly exactly at the end of the Assembly window", () => {
    expect(deriveSceneState(SCROLL_WINDOWS.assembly.end).assemblyProgress).toBe(1);
  });

  it("stays assembled for the rest of the page", () => {
    expect(deriveSceneState(1).assemblyProgress).toBe(1);
  });

  it("tracks scroll linearly — GSAP's scrub supplies the easing, not the seam", () => {
    // MASTER.md §6.1: easing lives in `scrub: 1`. Easing here as well would
    // compound into a sluggish Assembly.
    for (const t of [0.25, 0.5, 0.75]) {
      expect(
        deriveSceneState(at(SCROLL_WINDOWS.assembly, t)).assemblyProgress
      ).toBeCloseTo(t, 10);
    }
  });

  it("puts every Part at its assembled pose once Assembly completes", () => {
    const { parts } = deriveSceneState(SCROLL_WINDOWS.assembly.end);
    for (const name of PART_NAMES) {
      expect(parts[name].position).toEqual([0, 0, 0]);
      expect(parts[name].rotation).toEqual([0, 0, 0]);
    }
  });

  it("separates the fittings while Exploded, and only by translation", () => {
    // Not every Part comes off: the reference Exploded state keeps the barrel,
    // receiver, scope and brake together as one body so the rifle stays
    // recognisable, and drops the fittings clear of it. What every Part does
    // share is orientation — separation is translation only, never rotation,
    // or a Part reads as having fallen off rather than been taken off.
    const { parts } = deriveSceneState(0);
    const separated = PART_NAMES.filter(
      (name) => length(parts[name].position) > 0
    );

    expect(separated.length).toBeGreaterThan(0);
    for (const name of PART_NAMES) {
      expect(parts[name].rotation).toEqual([0, 0, 0]);
    }
  });

  it("keeps every Part on the rifle's centreline at every point in Assembly", () => {
    // Z is the rifle's 0.113 of thickness, and the camera passes straight down
    // the barrel mid-Assembly — Act 1 views from -Z, Act 2 from +Z, so the path
    // crosses the axis. From there a sideways drift of a few hundredths is the
    // one thing a visitor can see. Parts separate fore-and-aft and up-and-down,
    // never sideways, and that has to hold for the whole travel, not just at
    // the ends.
    for (const progress of SCROLL_SAMPLES) {
      const { parts } = deriveSceneState(progress);
      for (const name of PART_NAMES) {
        expect(parts[name].position[2]).toBe(0);
      }
    }
  });

  it("moves Parts monotonically toward the assembled pose", () => {
    const exploded = explodedSpread(SCROLL_WINDOWS.assembly.start);
    const halfway = explodedSpread(midpoint(SCROLL_WINDOWS.assembly));
    const assembled = explodedSpread(SCROLL_WINDOWS.assembly.end);

    expect(halfway).toBeLessThan(exploded);
    expect(assembled).toBeLessThan(halfway);
  });
});

describe("the drop", () => {
  it("holds the Hero Rifle at the Gunsmith View's rest pose until the drop begins", () => {
    expect(deriveSceneState(SCROLL_WINDOWS.gunsmithHold.end).dropProgress).toBe(0);
    expect(deriveSceneState(SCROLL_WINDOWS.gunsmithHold.end).heroRifle.position).toEqual([
      0, 0, 0,
    ]);
  });

  it("lands the Hero Rifle exactly at the end of the drop window", () => {
    expect(deriveSceneState(SCROLL_WINDOWS.drop.end).dropProgress).toBe(1);
  });

  it("leaves the Hero Rifle landed for the rest of the page", () => {
    expect(deriveSceneState(1).dropProgress).toBe(1);
  });

  it("brings the Hero Rifle down into the Lineup", () => {
    const resting = deriveSceneState(midpoint(SCROLL_WINDOWS.gunsmithHold));
    const landed = deriveSceneState(1);

    expect(landed.heroRifle.position[1]).toBeLessThan(
      resting.heroRifle.position[1]
    );
  });

  it("never lifts the Hero Rifle back up — the fall only ever runs one way", () => {
    // This is what makes scrubbing back up retrace the fall rather than
    // bounce: height is monotonic in scroll progress across the whole page.
    let previousHeight = deriveSceneState(0).heroRifle.position[1];

    for (const progress of SCROLL_SAMPLES) {
      const height = deriveSceneState(progress).heroRifle.position[1];
      expect(height).toBeLessThanOrEqual(previousHeight);
      previousHeight = height;
    }
  });

  it("tracks scroll linearly through the fall", () => {
    for (const t of [0.25, 0.5, 0.75]) {
      expect(deriveSceneState(at(SCROLL_WINDOWS.drop, t)).dropProgress).toBeCloseTo(
        t,
        10
      );
    }
  });
});

describe("the Lineup", () => {
  it("reports every contract Gear Item", () => {
    expect(Object.keys(deriveSceneState(1).gear).sort()).toEqual(
      [...GEAR_NAMES].sort()
    );
  });

  it("stands every Gear Item on its own patch of floor", () => {
    // Checked against the objects' measured footprints rather than a round
    // number: the drone is 0.45 across and the torch 0.13, so one clearance
    // that suits both says nothing about either. Positions are each item's
    // base, so a plan-view distance against summed radii is exactly the
    // question — do these two overlap on the floor?
    //
    // As rendered, not as exported: the torch is shown at 2x, and a clearance
    // measured against the model it is not being drawn at proves nothing.
    const { gear } = deriveSceneState(1);
    const onFloor = ([x, , z]: Vec3) => Math.hypot(x, z);

    for (const a of GEAR_NAMES) {
      for (const b of GEAR_NAMES) {
        if (a >= b) continue;

        const apart = onFloor([
          gear[a].position[0] - gear[b].position[0],
          0,
          gear[a].position[2] - gear[b].position[2],
        ]);

        expect(apart).toBeGreaterThan(
          lineupFootprintRadius(a) + lineupFootprintRadius(b)
        );
      }
    }
  });

  it("lands the Hero Rifle above the Gear Items, not among them", () => {
    // The rifle is 1.16 long and spans the whole row, so it is the one object
    // that cannot be given its own patch of floor. It is separated in height
    // instead — it is the protagonist, and the gear is what it goes to the
    // field with.
    const { gear, heroRifle } = deriveSceneState(1);

    for (const name of GEAR_NAMES) {
      expect(heroRifle.position[1]).toBeGreaterThan(gear[name].position[1]);
    }
  });

  it("frames the arrangement it actually built", () => {
    // The Act 3 camera and the Lineup layout are derived separately; this
    // catches them drifting apart.
    //
    // Asked as a projection rather than as "the target sits inside the spread
    // of the objects", which is what this used to check. That was a proxy, and
    // a wrong one: the reference composition deliberately aims above the group
    // and leaves headroom, so a camera obeying the proxy would fail the brief
    // while a camera meeting the brief failed the test. Whether every object is
    // in shot is the question the name was always asking.
    const { gear, heroRifle, camera } = deriveSceneState(1);
    const [muzzle, butt] = endsOf(heroRifle);
    const placed = [
      ["Hero Rifle", heroRifle.position] as const,
      // The rifle is 1.16 long and lies diagonally across the frame, so its two
      // ends are the points most likely to leave it — and the root is their
      // midpoint, so checking the root alone would never catch either.
      ["Hero Rifle muzzle", muzzle] as const,
      ["Hero Rifle butt", butt] as const,
      ...GEAR_NAMES.map((name) => [name, gear[name].position] as const),
    ];

    for (const [name, point] of placed) {
      const { x, y, depth } = projectInto(camera, point);

      expect(depth, `${name} is behind the camera`).toBeGreaterThan(0);
      expect(Math.abs(x), `${name} is off the side of the frame`).toBeLessThanOrEqual(1);
      expect(Math.abs(y), `${name} is off the top or bottom`).toBeLessThanOrEqual(1);
    }
  });

  it("looks down on the Lineup rather than across it", () => {
    // The Gear Items stand on a floor, and 32° of downward tilt is what shows
    // that floor — level with the row they stack into one horizontal band and
    // the ammo box is seen as a rim rather than as an open tray.
    const { camera } = deriveSceneState(1);
    const drop = camera.position[1] - camera.target[1];
    const run = Math.hypot(
      camera.position[0] - camera.target[0],
      camera.position[2] - camera.target[2]
    );

    expect((Math.atan2(drop, run) * 180) / Math.PI).toBeCloseTo(32, 0);
  });

  it("shows every Gear Item at its true size but the torch", () => {
    // ASSETS.md holds that the nine-to-one spread between the rifle and the
    // torch is real and is composed around, not scaled away. The torch is the
    // one authored exception; this fails the moment a second one is added
    // quietly rather than argued for.
    const scaled = GEAR_NAMES.filter((name) => GEAR_SCALE[name] !== 1);

    expect(scaled).toEqual(["Gear_Torch"]);
    expect(GEAR_SCALE.Gear_Torch).toBe(2);
  });

  it("keeps the arrangement fixed — Gear Items are staged, not animated by scroll", () => {
    expect(deriveSceneState(0).gear).toEqual(deriveSceneState(1).gear);
  });
});

describe("camera", () => {
  it("opens out as Assembly completes, so the whole rifle is in frame to inspect", () => {
    // Act 1 is a close portrait that deliberately crops the muzzle. The
    // Gunsmith View has to hold all eight Parts at once for their Callouts, so
    // Assembly ends further out than it began — the one place on this page
    // where the camera retreats rather than closes in.
    expect(
      framingDistance(deriveSceneState(SCROLL_WINDOWS.assembly.end))
    ).toBeGreaterThan(framingDistance(deriveSceneState(0)));
  });

  it("pulls back out to frame the whole Lineup", () => {
    expect(framingDistance(deriveSceneState(1))).toBeGreaterThan(
      framingDistance(deriveSceneState(midpoint(SCROLL_WINDOWS.gunsmithHold)))
    );
  });

  it("follows the Hero Rifle down during the drop", () => {
    const gunsmith = deriveSceneState(midpoint(SCROLL_WINDOWS.gunsmithHold));
    const lineup = deriveSceneState(SCROLL_WINDOWS.drop.end);
    expect(lineup.camera.target[1]).toBeLessThan(gunsmith.camera.target[1]);
  });

  it("never jumps — a small scroll delta never moves the camera far", () => {
    let previous = deriveSceneState(0).camera.position;

    for (const progress of SCROLL_SAMPLES) {
      const current = deriveSceneState(progress).camera.position;
      expect(distanceBetween(current, previous)).toBeLessThan(0.5);
      previous = current;
    }
  });
});

describe("interaction availability", () => {
  it("offers nothing while the page is still in Act 1", () => {
    expect(deriveSceneState(0).interaction).toEqual({
      parts: false,
      gear: false,
    });
  });

  it("offers nothing mid-Assembly — the Hero Rifle is still moving", () => {
    expect(
      deriveSceneState(midpoint(SCROLL_WINDOWS.assembly)).interaction.parts
    ).toBe(false);
  });

  it("makes Parts inspectable once the Gunsmith View settles", () => {
    expect(
      deriveSceneState(midpoint(SCROLL_WINDOWS.gunsmithHold)).interaction
    ).toEqual({ parts: true, gear: false });
  });

  it("withdraws Part interaction once the drop begins", () => {
    expect(deriveSceneState(midpoint(SCROLL_WINDOWS.drop)).interaction).toEqual({
      parts: false,
      gear: false,
    });
  });

  it("makes Gear Items inspectable once the Lineup settles", () => {
    expect(deriveSceneState(1).interaction).toEqual({
      parts: false,
      gear: true,
    });
  });
});

describe("scroll reversal", () => {
  it("answers for a scroll position the same way however the visitor got there", () => {
    // Scrubbing back up must retrace the states scrubbing down produced. That
    // holds only while the seam keeps no memory of where the visitor has
    // been — this fails the moment anyone adds a cache, a smoothed value, or
    // a "last progress" module variable.
    const probes = [0.05, midpoint(SCROLL_WINDOWS.assembly), 0.5, 0.7, 0.95];
    const before = probes.map(deriveSceneState);

    for (const progress of SCROLL_SAMPLES) deriveSceneState(progress);
    for (const progress of [...SCROLL_SAMPLES].reverse()) deriveSceneState(progress);

    expect(probes.map(deriveSceneState)).toEqual(before);
  });
});

describe("reduced motion", () => {
  // MASTER.md §6.3. Each Act is a deliberately composed still, asserted on its
  // own terms — comparing it to the animated path at some progress value would
  // just re-describe "whatever the interpolation returns", which the ticket
  // rules out.

  const ACTS = ["hero", "gunsmith", "lineup"] as const;

  it("reports the Act it was asked for", () => {
    for (const act of ACTS) {
      expect(deriveStaticSceneState(act).act).toBe(act);
    }
  });

  it("shows the Hero Rifle assembled in every Act — never a frozen Exploded pile", () => {
    for (const act of ACTS) {
      const state = deriveStaticSceneState(act);
      expect(state.assemblyProgress).toBe(1);
      for (const name of PART_NAMES) {
        expect(state.parts[name].position).toEqual([0, 0, 0]);
        expect(state.parts[name].rotation).toEqual([0, 0, 0]);
      }
    }
  });

  it("points its camera at the subject in every Act", () => {
    for (const act of ACTS) {
      expect(framingDistance(deriveStaticSceneState(act))).toBeGreaterThan(0);
    }
  });

  it("frames each Act differently — one still per Act, not one still reused", () => {
    const framings = ACTS.map((act) => deriveStaticSceneState(act).camera);

    for (let i = 0; i < framings.length; i++) {
      for (let j = i + 1; j < framings.length; j++) {
        expect(framings[i]).not.toEqual(framings[j]);
      }
    }
  });

  it("holds the whole of Act 1 in frame, because a still cannot be scrolled past", () => {
    // The scrubbed Act 1 crops on purpose — the muzzle runs off the bottom of
    // the frame and the visitor scrolls on within a moment. A still is the
    // whole of what this visitor will ever see of Act 1, so it keeps the angle
    // and steps back rather than cutting the subject off permanently.
    expect(framingDistance(deriveStaticSceneState("hero"))).toBeGreaterThan(
      framingDistance(deriveSceneState(0))
    );
  });

  it("stages the Hero Rifle where its Act expects it", () => {
    expect(deriveStaticSceneState("hero").dropProgress).toBe(0);
    expect(deriveStaticSceneState("gunsmith").dropProgress).toBe(0);
    expect(deriveStaticSceneState("lineup").dropProgress).toBe(1);
  });

  it("arranges the Lineup, not just the Hero Rifle", () => {
    const { gear, heroRifle } = deriveStaticSceneState("lineup");
    expect(Object.keys(gear).sort()).toEqual([...GEAR_NAMES].sort());

    for (const name of GEAR_NAMES) {
      expect(distanceBetween(gear[name].position, heroRifle.position)).toBeGreaterThan(
        0.5
      );
    }
  });

  it("keeps every interaction the animated path offers", () => {
    // Reduced motion removes animation, never functionality — so this one is
    // deliberately asserted against the animated path.
    expect(deriveStaticSceneState("gunsmith").interaction).toEqual(
      deriveSceneState(midpoint(SCROLL_WINDOWS.gunsmithHold)).interaction
    );
    expect(deriveStaticSceneState("lineup").interaction).toEqual(
      deriveSceneState(1).interaction
    );
  });
});
