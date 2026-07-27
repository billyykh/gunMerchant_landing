import { describe, expect, it } from "vitest";

import { PARALLAX_REACH, parallaxOffset } from "./parallax";

const ON = { enabled: true };

describe("the Gunsmith parallax", () => {
  it("rests at zero when the pointer is at the centre", () => {
    expect(parallaxOffset({ x: 0, y: 0 }, ON)).toEqual({ x: 0, y: 0 });
  });

  it("leans the full reach at the edges of the viewport", () => {
    expect(parallaxOffset({ x: 1, y: 1 }, ON)).toEqual({
      x: PARALLAX_REACH,
      y: PARALLAX_REACH,
    });
  });

  it("is symmetric about the centre", () => {
    const left = parallaxOffset({ x: -0.4, y: -0.7 }, ON);
    const right = parallaxOffset({ x: 0.4, y: 0.7 }, ON);
    expect(left).toEqual({ x: -right.x, y: -right.y });
  });

  it("clamps a pointer reported outside the viewport", () => {
    // A pointer dragged off the window keeps reporting coordinates, and an
    // unclamped lean would swing the camera off the rifle entirely.
    expect(parallaxOffset({ x: 4, y: -9 }, ON)).toEqual({
      x: PARALLAX_REACH,
      y: -PARALLAX_REACH,
    });
  });

  it("stays subtle — the reach is a nudge, not a camera move", () => {
    // The Act 2 camera sits ~1.0 from the rifle. Anything approaching that
    // distance is an orbit control, which this ticket explicitly excludes.
    expect(PARALLAX_REACH).toBeGreaterThan(0);
    expect(PARALLAX_REACH).toBeLessThan(0.05);
  });

  it("does not move at all when it is switched off", () => {
    // Outside the Gunsmith hold, and under `prefers-reduced-motion`.
    expect(parallaxOffset({ x: 1, y: -1 }, { enabled: false })).toEqual({
      x: 0,
      y: 0,
    });
  });
});
