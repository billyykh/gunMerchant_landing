import { describe, expect, it } from "vitest";

import { CALLOUT_REACH, placeCallout } from "./callout-placement";

const VIEWPORT = { width: 1000, height: 800 };

describe("placing a Callout", () => {
  it("puts the anchor at the centre of the viewport for a centred Part", () => {
    const { x, y } = placeCallout([0, 0, 0], VIEWPORT);
    expect(x).toBe(500);
    expect(y).toBe(400);
  });

  it("flips the y axis, because NDC counts up and the screen counts down", () => {
    expect(placeCallout([0, 1, 0], VIEWPORT).y).toBe(0);
    expect(placeCallout([0, -1, 0], VIEWPORT).y).toBe(800);
  });

  it("maps the x axis left to right", () => {
    expect(placeCallout([-1, 0, 0], VIEWPORT).x).toBe(0);
    expect(placeCallout([1, 0, 0], VIEWPORT).x).toBe(1000);
  });
});

describe("which side the label sits on", () => {
  it("reaches right from the anchor when there is room", () => {
    expect(placeCallout([-0.5, 0, 0], VIEWPORT).side).toBe("right");
  });

  it("folds back to the left when the label would run off the edge", () => {
    // Anchored one pixel short of the right edge, a right-reaching label is
    // entirely outside the viewport.
    expect(placeCallout([0.998, 0, 0], VIEWPORT).side).toBe("left");
  });

  it("flips exactly where the label stops fitting", () => {
    const widthOf = (x: number) => placeCallout([x, 0, 0], VIEWPORT).side;
    // The last pixel at which the label still fits, expressed back in NDC.
    const fits = ((VIEWPORT.width - CALLOUT_REACH) / VIEWPORT.width) * 2 - 1;

    expect(widthOf(fits - 0.01)).toBe("right");
    expect(widthOf(fits + 0.01)).toBe("left");
  });

  it("keeps reaching right on a viewport too narrow for either side", () => {
    // Below the label's own width there is no better side, and a label that
    // flapped between them as the camera drifted would be worse than one that
    // simply clips.
    const narrow = { width: CALLOUT_REACH / 2, height: 800 };
    expect(placeCallout([0.9, 0, 0], narrow).side).toBe("right");
  });
});

describe("which way the Callout rises", () => {
  // The camera looks *at* the subject, so the subject's centre always projects
  // to the NDC origin. A Callout only has to lean away from it to clear the
  // silhouette — no second projected point is needed to work out where the
  // rifle is.

  it("rises above a Part on the upper half of the subject", () => {
    expect(placeCallout([-0.2, 0.3, 0], VIEWPORT).rise).toBe("up");
  });

  it("drops below a Part on the lower half", () => {
    expect(placeCallout([-0.2, -0.3, 0], VIEWPORT).rise).toBe("down");
  });

  it("rises for a Part dead on the centreline", () => {
    // The scope and the bipod would otherwise disagree by a rounding error.
    expect(placeCallout([0, 0, 0], VIEWPORT).rise).toBe("up");
  });
});

describe("whether the Callout is drawn at all", () => {
  it("draws a Part in front of the camera and inside the frame", () => {
    expect(placeCallout([0.2, -0.3, 0.5], VIEWPORT).visible).toBe(true);
  });

  it("hides a Part behind the camera", () => {
    // three.js projects points behind the camera to z > 1, and their x/y land
    // mirrored — drawing them puts a Callout on empty sky.
    expect(placeCallout([0.2, -0.3, 1.4], VIEWPORT).visible).toBe(false);
  });

  it("hides a Part that has left the frame", () => {
    expect(placeCallout([1.6, 0, 0], VIEWPORT).visible).toBe(false);
    expect(placeCallout([0, -1.6, 0], VIEWPORT).visible).toBe(false);
  });

  it("still draws a Part just past the edge, so it fades rather than blinks", () => {
    expect(placeCallout([1.05, 0, 0], VIEWPORT).visible).toBe(true);
  });
});

describe("what the page has covered", () => {
  // The footer scrolls up over the fixed canvas as the page ends. It is opaque,
  // so anything it covers is not on screen any more — and a hotspot the visitor
  // cannot see must not be a tab stop either (MASTER.md §8).
  const withFooter = { ...VIEWPORT, occludedBottom: 200 };

  it("hides an anchor the footer has reached", () => {
    // y = 700, inside the bottom 200px.
    expect(placeCallout([0, -0.75, 0], withFooter).visible).toBe(false);
  });

  it("keeps an anchor still clear of it", () => {
    // y = 560.
    expect(placeCallout([0, -0.4, 0], withFooter).visible).toBe(true);
  });

  it("cuts exactly at the footer's top edge", () => {
    const yAt = (ndcY: number) => placeCallout([0, ndcY, 0], withFooter).y;
    const edge = -((VIEWPORT.height - 200) / VIEWPORT.height) * 2 + 1;

    expect(yAt(edge)).toBe(600);
    expect(placeCallout([0, edge, 0], withFooter).visible).toBe(false);
    expect(placeCallout([0, edge + 0.001, 0], withFooter).visible).toBe(true);
  });

  it("covers nothing when the footer is off screen", () => {
    expect(placeCallout([0, -0.99, 0], VIEWPORT).visible).toBe(true);
    expect(
      placeCallout([0, -0.99, 0], { ...VIEWPORT, occludedBottom: 0 }).visible
    ).toBe(true);
  });
});
