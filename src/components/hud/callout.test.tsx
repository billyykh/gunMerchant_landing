import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Callout } from "./callout";

const BARREL = {
  name: "Match-Grade Barrel",
  index: "02/08",
  open: true,
} as const;

describe("a Callout", () => {
  it("names the Part it points at", () => {
    render(<Callout {...BARREL} side="right" rise="up" />);
    expect(screen.getByText("Match-Grade Barrel")).toBeInTheDocument();
  });

  it("carries the HUD index readout", () => {
    render(<Callout {...BARREL} side="right" rise="up" />);
    expect(screen.getByText("02/08")).toBeInTheDocument();
  });

  it("is decorative", () => {
    // The Callout is a visual echo of the hotspot's accessible name. Leaving it
    // in the tree would announce every Part twice.
    const { container } = render(<Callout {...BARREL} side="right" rise="up" />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("works without an index", () => {
    // Ticket 14 reuses this for Gear Items, which are not numbered along a
    // rifle and have nothing to count out of.
    render(<Callout name="Tactical Torch" side="right" rise="up" open />);
    expect(screen.getByText("Tactical Torch")).toBeInTheDocument();
    expect(screen.queryByText(/\d\d\/\d\d/)).not.toBeInTheDocument();
  });

  it("stays mounted while it is on its way out", () => {
    // MASTER.md §6.2 gives the Callout an exit over --dur-exit. Unmounting the
    // moment the pointer leaves would mean it never plays.
    const { container } = render(
      <Callout {...BARREL} side="right" rise="up" open={false} />
    );
    expect(container.firstElementChild).toHaveAttribute("data-open", "false");
    expect(screen.getByText("Match-Grade Barrel")).toBeInTheDocument();
  });
});

describe("the way a Callout leans", () => {
  const label = (side: "left" | "right", rise: "up" | "down") => {
    const { container } = render(<Callout {...BARREL} side={side} rise={rise} />);
    return container.querySelector<HTMLElement>(".hud-brackets")!.style;
  };

  it("reaches right and up by default", () => {
    const { left, top } = label("right", "up");
    expect(Number.parseFloat(left)).toBeGreaterThan(0);
    expect(Number.parseFloat(top)).toBeLessThan(0);
  });

  it("mirrors when it has to fold back to the left", () => {
    expect(Number.parseFloat(label("left", "up").left)).toBeLessThan(0);
  });

  it("drops below for a Part on the underside", () => {
    expect(Number.parseFloat(label("right", "down").top)).toBeGreaterThan(0);
  });

  it("hangs off the leader on whichever side it arrived from", () => {
    // Reaching left, the label has to sit entirely left of the leader's end,
    // or it doubles back over the line it just travelled.
    expect(label("right", "up").transform).toContain("translate(0,");
    expect(label("left", "up").transform).toContain("translate(-100%,");
  });

  it("records its lean, so the consumer can style off it", () => {
    const { container } = render(
      <Callout {...BARREL} side="left" rise="down" />
    );
    expect(container.firstElementChild).toHaveAttribute("data-side", "left");
    expect(container.firstElementChild).toHaveAttribute("data-rise", "down");
  });
});
