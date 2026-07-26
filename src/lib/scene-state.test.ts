import { describe, expect, it } from "vitest";
import {
  GEAR_NAMES,
  PART_NAMES,
  SCROLL_WINDOWS,
  type SceneState,
  type Vec3,
  deriveSceneState,
  deriveStaticSceneState,
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

  it("offsets every Part away from the assembled pose while Exploded", () => {
    const { parts } = deriveSceneState(0);
    for (const name of PART_NAMES) {
      expect(length(parts[name].position)).toBeGreaterThan(0);
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

  it("gives every Gear Item its own place — nothing is stacked on anything else", () => {
    const { gear, heroRifle } = deriveSceneState(1);
    const placed = [heroRifle.position, ...GEAR_NAMES.map((n) => gear[n].position)];

    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        expect(distanceBetween(placed[i], placed[j])).toBeGreaterThan(0.5);
      }
    }
  });

  it("frames the arrangement it actually built", () => {
    // The Act 3 camera and the Lineup layout are derived separately; this
    // catches them drifting apart.
    const { gear, heroRifle, camera } = deriveSceneState(1);
    const placed = [heroRifle.position, ...GEAR_NAMES.map((n) => gear[n].position)];

    for (const axis of [0, 1, 2] as const) {
      const values = placed.map((position) => position[axis]);
      expect(camera.target[axis]).toBeGreaterThanOrEqual(Math.min(...values));
      expect(camera.target[axis]).toBeLessThanOrEqual(Math.max(...values));
    }
  });

  it("keeps the arrangement fixed — Gear Items are staged, not animated by scroll", () => {
    expect(deriveSceneState(0).gear).toEqual(deriveSceneState(1).gear);
  });
});

describe("camera", () => {
  it("closes in on the Hero Rifle as Assembly completes", () => {
    expect(framingDistance(deriveSceneState(SCROLL_WINDOWS.assembly.end))).toBeLessThan(
      framingDistance(deriveSceneState(0))
    );
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

  it("composes Act 1 for a single assembled rifle, not for a field of Parts", () => {
    // The animated Act 1 camera is pulled back to hold the Exploded Parts
    // spread behind the brand lockup. With nothing Exploded to hold, that
    // framing strands the rifle in the middle of an empty frame.
    expect(framingDistance(deriveStaticSceneState("hero"))).toBeLessThan(
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
