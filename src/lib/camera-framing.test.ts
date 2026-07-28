import { describe, expect, it } from "vitest";

import {
  FRAMING_REFERENCE_ASPECT,
  MAX_VERTICAL_FOV,
  fitFraming,
  horizontalFov,
} from "./camera-framing";

/** The three Acts' authored vertical fields of view. */
const HERO = 26;
const GUNSMITH = 30;
const LINEUP = 40;

const PORTRAIT = 375 / 812;
const LAPTOP = 1440 / 900;

describe("the reference framing", () => {
  it("leaves a viewport at the reference aspect exactly as authored", () => {
    // The compositions were tuned at 16:9. Adjusting them there would move
    // every Act away from the frame it was designed in.
    for (const fov of [HERO, GUNSMITH, LINEUP]) {
      expect(fitFraming(fov, FRAMING_REFERENCE_ASPECT)).toEqual({
        fov,
        dolly: 1,
      });
    }
  });

  it("leaves a wider viewport alone", () => {
    // An ultrawide window gains side room, which is what §9 asks for at `xl`.
    // Correcting it would zoom the subject in as the window got wider.
    expect(fitFraming(HERO, 21 / 9)).toEqual({ fov: HERO, dolly: 1 });
  });
});

describe("holding the composition's width", () => {
  it("keeps the horizontal field of view as the viewport narrows", () => {
    const reference = horizontalFov(HERO, FRAMING_REFERENCE_ASPECT);
    const fitted = fitFraming(HERO, LAPTOP);

    expect(horizontalFov(fitted.fov, LAPTOP)).toBeCloseTo(reference, 6);
    expect(fitted.dolly).toBe(1);
  });

  it("widens rather than crops", () => {
    // The defect this exists for: three.js fixes the *vertical* field of view,
    // so a narrow window silently loses the ends of a wide composition.
    const fitted = fitFraming(LINEUP, LAPTOP);
    expect(fitted.fov).toBeGreaterThan(LINEUP);
    expect(horizontalFov(LINEUP, LAPTOP)).toBeLessThan(
      horizontalFov(LINEUP, FRAMING_REFERENCE_ASPECT)
    );
  });
});

describe("when widening alone would distort", () => {
  it("stops at the field of view where perspective starts to bend", () => {
    const fitted = fitFraming(HERO, PORTRAIT);
    expect(fitted.fov).toBe(MAX_VERTICAL_FOV);
  });

  it("pulls the camera back for the width the cap could not give", () => {
    const fitted = fitFraming(HERO, PORTRAIT);
    expect(fitted.dolly).toBeGreaterThan(1);
  });

  it("recovers the reference width exactly", () => {
    // Width seen at a distance is proportional to the distance and to the
    // tangent of the half-angle, so the dolly is what makes the two agree.
    const halfWidth = (fov: number, aspect: number, distance: number) =>
      distance * Math.tan((horizontalFov(fov, aspect) * Math.PI) / 360);

    const reference = halfWidth(HERO, FRAMING_REFERENCE_ASPECT, 1);
    const fitted = fitFraming(HERO, PORTRAIT);

    expect(halfWidth(fitted.fov, PORTRAIT, fitted.dolly)).toBeCloseTo(
      reference,
      6
    );
  });

  it("never pulls back while the field of view still has room", () => {
    // Dollying and widening at once would shrink the subject twice over.
    const fitted = fitFraming(HERO, 4 / 3);
    expect(fitted.fov).toBeLessThan(MAX_VERTICAL_FOV);
    expect(fitted.dolly).toBe(1);
  });
});

describe("degenerate viewports", () => {
  it("survives a zero-height frame", () => {
    // React Three Fiber reports 0×0 for a frame or two while the canvas is
    // being measured, and an aspect of 0 or Infinity must not produce NaN.
    for (const aspect of [0, Number.POSITIVE_INFINITY, Number.NaN]) {
      const fitted = fitFraming(HERO, aspect);
      expect(Number.isFinite(fitted.fov)).toBe(true);
      expect(Number.isFinite(fitted.dolly)).toBe(true);
      expect(fitted.dolly).toBeGreaterThanOrEqual(1);
    }
  });
});
