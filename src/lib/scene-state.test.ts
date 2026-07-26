import { describe, expect, it } from "vitest";
import {
  ACT_RANGES,
  PART_NAMES,
  deriveSceneState,
  deriveStaticSceneState,
} from "./scene-state";

const midpoint = (range: { start: number; end: number }) =>
  (range.start + range.end) / 2;

describe("act derivation", () => {
  it("is in the Hero Act at the top of the page", () => {
    expect(deriveSceneState(0).act).toBe("hero");
  });

  it("is in the Gunsmith Act once Assembly completes", () => {
    expect(deriveSceneState(ACT_RANGES.assembly.end).act).toBe("gunsmith");
  });

  it("is in the Lineup Act once the drop completes", () => {
    expect(deriveSceneState(ACT_RANGES.drop.end).act).toBe("lineup");
  });

  it("is still in the Lineup Act at the bottom of the page", () => {
    expect(deriveSceneState(1).act).toBe("lineup");
  });
});

describe("Assembly", () => {
  it("reports every contract Part", () => {
    const { parts } = deriveSceneState(0);
    expect(Object.keys(parts).sort()).toEqual([...PART_NAMES].sort());
  });

  it("holds the Parts Exploded through Act 1", () => {
    expect(deriveSceneState(0).assemblyProgress).toBe(0);
    expect(deriveSceneState(ACT_RANGES.assembly.start).assemblyProgress).toBe(0);
  });

  it("completes Assembly exactly at the end of the Assembly range", () => {
    expect(deriveSceneState(ACT_RANGES.assembly.end).assemblyProgress).toBe(1);
  });

  it("stays assembled for the rest of the page", () => {
    expect(deriveSceneState(1).assemblyProgress).toBe(1);
  });

  it("is partway through Assembly at the midpoint", () => {
    const progress = deriveSceneState(
      midpoint(ACT_RANGES.assembly)
    ).assemblyProgress;
    expect(progress).toBeGreaterThan(0);
    expect(progress).toBeLessThan(1);
  });

  it("puts every Part at its assembled pose once Assembly completes", () => {
    const { parts } = deriveSceneState(ACT_RANGES.assembly.end);
    for (const name of PART_NAMES) {
      expect(parts[name].position).toEqual([0, 0, 0]);
    }
  });

  it("offsets every Part away from the assembled pose while Exploded", () => {
    const { parts } = deriveSceneState(0);
    for (const name of PART_NAMES) {
      const [x, y, z] = parts[name].position;
      expect(Math.hypot(x, y, z)).toBeGreaterThan(0);
    }
  });

  it("moves Parts monotonically toward the assembled pose", () => {
    const distanceAt = (progress: number) =>
      PART_NAMES.reduce((total, name) => {
        const [x, y, z] = deriveSceneState(progress).parts[name].position;
        return total + Math.hypot(x, y, z);
      }, 0);

    const exploded = distanceAt(ACT_RANGES.assembly.start);
    const halfway = distanceAt(midpoint(ACT_RANGES.assembly));
    const assembled = distanceAt(ACT_RANGES.assembly.end);

    expect(halfway).toBeLessThan(exploded);
    expect(assembled).toBeLessThan(halfway);
  });
});

describe("camera", () => {
  const distanceToSubject = (progress: number) => {
    const { camera } = deriveSceneState(progress);
    return Math.hypot(
      camera.position[0] - camera.target[0],
      camera.position[1] - camera.target[1],
      camera.position[2] - camera.target[2]
    );
  };

  it("closes in on the Hero Rifle as Assembly completes", () => {
    expect(distanceToSubject(ACT_RANGES.assembly.end)).toBeLessThan(
      distanceToSubject(0)
    );
  });

  it("pulls back out to frame the whole Lineup", () => {
    expect(distanceToSubject(1)).toBeGreaterThan(
      distanceToSubject(midpoint(ACT_RANGES.gunsmith))
    );
  });

  it("follows the Hero Rifle down during the drop", () => {
    const gunsmith = deriveSceneState(midpoint(ACT_RANGES.gunsmith));
    const lineup = deriveSceneState(ACT_RANGES.drop.end);
    expect(lineup.camera.target[1]).toBeLessThan(gunsmith.camera.target[1]);
  });

  it("never jumps — a small scroll delta never moves the camera far", () => {
    let previous = deriveSceneState(0).camera.position;

    for (let step = 1; step <= 100; step++) {
      const current = deriveSceneState(step / 100).camera.position;
      const delta = Math.hypot(
        current[0] - previous[0],
        current[1] - previous[1],
        current[2] - previous[2]
      );
      expect(delta).toBeLessThan(0.5);
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
      deriveSceneState(midpoint(ACT_RANGES.assembly)).interaction.parts
    ).toBe(false);
  });

  it("makes Parts inspectable once the Gunsmith View settles", () => {
    expect(deriveSceneState(midpoint(ACT_RANGES.gunsmith)).interaction).toEqual({
      parts: true,
      gear: false,
    });
  });

  it("withdraws Part interaction once the drop begins", () => {
    expect(deriveSceneState(midpoint(ACT_RANGES.drop)).interaction).toEqual({
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
  // Scrubbing back up must retrace the same states, so the seam has to be a
  // pure function of progress with no hysteresis anywhere in it.
  it("returns identical state whether progress is rising or falling", () => {
    const samples = Array.from({ length: 101 }, (_, step) => step / 100);

    const ascending = samples.map(deriveSceneState);
    const descending = [...samples].reverse().map(deriveSceneState).reverse();

    expect(descending).toEqual(ascending);
  });
});

describe("reduced motion", () => {
  // Not a degraded path: each Act is a deliberately composed still, and every
  // interaction the animated page offers is still offered here.

  it("reports the Act it was asked for", () => {
    expect(deriveStaticSceneState("hero").act).toBe("hero");
    expect(deriveStaticSceneState("gunsmith").act).toBe("gunsmith");
    expect(deriveStaticSceneState("lineup").act).toBe("lineup");
  });

  it("shows the Hero Rifle assembled in every Act — never a frozen Exploded pile", () => {
    for (const act of ["hero", "gunsmith", "lineup"] as const) {
      const state = deriveStaticSceneState(act);
      expect(state.assemblyProgress).toBe(1);
      for (const name of PART_NAMES) {
        expect(state.parts[name].position).toEqual([0, 0, 0]);
        expect(state.parts[name].rotation).toEqual([0, 0, 0]);
      }
    }
  });

  it("rests on the same composed camera the animated path settles into", () => {
    expect(deriveStaticSceneState("hero").camera).toEqual(
      deriveSceneState(ACT_RANGES.hero.start).camera
    );
    expect(deriveStaticSceneState("gunsmith").camera).toEqual(
      deriveSceneState(midpoint(ACT_RANGES.gunsmith)).camera
    );
    expect(deriveStaticSceneState("lineup").camera).toEqual(
      deriveSceneState(1).camera
    );
  });

  it("frames each Act differently — one still per Act, not one still reused", () => {
    const hero = deriveStaticSceneState("hero").camera.position;
    const gunsmith = deriveStaticSceneState("gunsmith").camera.position;
    const lineup = deriveStaticSceneState("lineup").camera.position;

    expect(gunsmith).not.toEqual(hero);
    expect(lineup).not.toEqual(gunsmith);
  });

  it("keeps every interaction the animated path offers", () => {
    expect(deriveStaticSceneState("gunsmith").interaction).toEqual(
      deriveSceneState(midpoint(ACT_RANGES.gunsmith)).interaction
    );
    expect(deriveStaticSceneState("lineup").interaction).toEqual(
      deriveSceneState(1).interaction
    );
  });
});
