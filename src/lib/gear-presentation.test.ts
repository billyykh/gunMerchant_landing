import { describe, expect, it } from "vitest";

import {
  GEAR_FLOAT_RISE,
  SHOWCASE_AT_REST,
  SHOWCASE_STILL_TURN,
  SHOWCASE_TURNS_PER_SECOND,
  advanceShowcase,
  deriveGearPresentation,
  type ShowcaseState,
} from "./gear-presentation";
import { GEAR_NAMES, deriveSceneState, type GearName } from "./scene-state";

const BASE = deriveSceneState(1).gear;

const derive = (over: Partial<Parameters<typeof deriveGearPresentation>[0]>) =>
  deriveGearPresentation({
    base: BASE,
    hovered: null,
    selected: null,
    showcase: SHOWCASE_AT_REST,
    reducedMotion: false,
    ...over,
  });

const others = (name: GearName) => GEAR_NAMES.filter((g) => g !== name);

/** Run the showcase for a while, a frame at a time. */
const runFor = (
  seconds: number,
  selected: GearName | null,
  from: ShowcaseState = SHOWCASE_AT_REST
) => {
  const frame = 1 / 60;
  let showcase = from;
  for (let t = 0; t < seconds; t += frame) {
    showcase = advanceShowcase(showcase, selected, frame);
  }
  return showcase;
};

describe("a Lineup at rest", () => {
  it("leaves every Gear Item exactly where the arrangement put it", () => {
    const presented = derive({});
    for (const name of GEAR_NAMES) {
      expect(presented[name]).toEqual(BASE[name]);
    }
  });
});

describe("the float-up on hover", () => {
  it("lifts the hovered Gear Item", () => {
    const presented = derive({ hovered: "Gear_Torch" });
    expect(presented.Gear_Torch.position[1]).toBeCloseTo(
      BASE.Gear_Torch.position[1] + GEAR_FLOAT_RISE
    );
  });

  it("lifts it straight up, without sliding it sideways", () => {
    const { position } = derive({ hovered: "Gear_Torch" }).Gear_Torch;
    expect(position[0]).toBe(BASE.Gear_Torch.position[0]);
    expect(position[2]).toBe(BASE.Gear_Torch.position[2]);
  });

  it("leaves the rest of the Lineup standing still", () => {
    const presented = derive({ hovered: "Gear_Torch" });
    for (const name of others("Gear_Torch")) {
      expect(presented[name]).toEqual(BASE[name]);
    }
  });

  it("lifts the selected Gear Item too, once the pointer has moved off it", () => {
    // The selection is the active object for as long as its Detail Panel is
    // open; dropping it back into the row the moment the pointer leaves would
    // read as the selection being lost.
    const presented = derive({ hovered: null, selected: "Gear_Torch" });
    expect(presented.Gear_Torch.position[1]).toBeCloseTo(
      BASE.Gear_Torch.position[1] + GEAR_FLOAT_RISE
    );
  });

  it("puts it back down once nothing is hovered or selected", () => {
    expect(derive({}).Gear_Torch.position).toEqual(BASE.Gear_Torch.position);
  });

  it("does not float under prefers-reduced-motion", () => {
    // MASTER.md §6.3: hover still works, but it cross-fades rather than moves.
    const presented = derive({ hovered: "Gear_Torch", reducedMotion: true });
    expect(presented.Gear_Torch.position).toEqual(BASE.Gear_Torch.position);
  });
});

describe("advancing the showcase", () => {
  it("does nothing while nothing is selected", () => {
    expect(runFor(5, null)).toEqual(SHOWCASE_AT_REST);
  });

  it("turns the selection at the showcase rate", () => {
    const { of, turns } = runFor(8, "Gear_ThermalDrone");
    expect(of).toBe("Gear_ThermalDrone");
    expect(turns).toBeCloseTo(8 * SHOWCASE_TURNS_PER_SECOND, 2);
  });

  it("stops where it is when the selection is dropped", () => {
    // Not reset: deriving the angle from "how long has this been selected"
    // snaps the object back to its resting pose the moment the Detail Panel
    // closes — up to half a turn, instantly.
    const turning = runFor(4, "Gear_ThermalDrone");
    const stopped = runFor(4, null, turning);

    expect(stopped).toEqual(turning);
  });

  it("starts a different Gear Item from its own resting pose", () => {
    // The angle belongs to the object being inspected, not to the act of
    // inspecting — a torch picked up after a drone should not already be
    // facing backwards.
    const turning = runFor(4, "Gear_ThermalDrone");
    const next = advanceShowcase(turning, "Gear_Torch", 1 / 60);

    expect(next.of).toBe("Gear_Torch");
    expect(next.turns).toBe(0);
  });

  it("picks up where it left off when the same one is chosen again", () => {
    const turning = runFor(4, "Gear_ThermalDrone");
    const resumed = advanceShowcase(turning, "Gear_ThermalDrone", 1 / 60);

    expect(resumed.turns).toBeGreaterThan(turning.turns);
  });
});

describe("the showcase rotation", () => {
  it("turns the showcased Gear Item", () => {
    const showcase = { of: "Gear_ThermalDrone", turns: 0.25 } as const;
    const presented = derive({ selected: "Gear_ThermalDrone", showcase });

    expect(presented.Gear_ThermalDrone.rotation[1]).toBeCloseTo(
      BASE.Gear_ThermalDrone.rotation[1] + 0.25 * 2 * Math.PI
    );
  });

  it("turns from where the Gear Item was standing, not from zero", () => {
    const presented = derive({
      selected: "Gear_NightVisionScope",
      showcase: { of: "Gear_NightVisionScope", turns: 0 },
    });
    expect(presented.Gear_NightVisionScope.rotation).toEqual(
      BASE.Gear_NightVisionScope.rotation
    );
  });

  it("turns only the one being showcased", () => {
    const presented = derive({
      selected: "Gear_Torch",
      showcase: { of: "Gear_Torch", turns: 0.4 },
      hovered: "Gear_AmmoBox",
    });
    for (const name of others("Gear_Torch")) {
      expect(presented[name].rotation).toEqual(BASE[name].rotation);
    }
  });

  it("leaves it where it stopped after the Detail Panel closes", () => {
    // §5: the rotation must not keep running on an object nobody is looking at.
    // It must also not teleport home — the object stays as the visitor left it.
    const showcase = { of: "Gear_Torch", turns: 0.4 } as const;
    const open = derive({ selected: "Gear_Torch", showcase });
    const closed = derive({ selected: null, showcase });

    expect(closed.Gear_Torch.rotation).toEqual(open.Gear_Torch.rotation);
  });

  it("holds a composed still under prefers-reduced-motion", () => {
    // §6.3 asks for the showcase pose rendered statically — not for the object
    // left facing the way it happened to be standing in the row, and not for
    // whatever angle a rotation that never ran would have reached.
    const at = (turns: number) =>
      derive({
        selected: "Gear_Torch",
        showcase: { of: "Gear_Torch", turns },
        reducedMotion: true,
      }).Gear_Torch.rotation[1];

    expect(at(0)).toBeCloseTo(
      BASE.Gear_Torch.rotation[1] + SHOWCASE_STILL_TURN * 2 * Math.PI
    );
    expect(at(5)).toBe(at(0));
  });
});
