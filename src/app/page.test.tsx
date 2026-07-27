import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Act 1 Hero", () => {
  it("renders the brand lockup", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { level: 1, name: "VANTAK" })
    ).toBeInTheDocument();
  });

  it("renders the tagline", () => {
    render(<Home />);
    expect(screen.getByText("Thermal Hunting Specialists")).toBeInTheDocument();
  });

  it("hides the scroll hint from assistive technology", () => {
    // Decorative: the page scrolls whether or not the hint is announced, and
    // "scroll to assemble" is meaningless to someone who is not watching the
    // canvas (MASTER.md §8).
    render(<Home />);
    const hint = screen.getByText(/scroll to assemble/i);
    expect(hint.closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("mounts the site header once", () => {
    render(<Home />);
    expect(screen.getAllByRole("banner")).toHaveLength(1);
  });

  it("reaches the catalog search from the header, not from the hero copy", () => {
    // Ticket 09 parked the trigger in the hero so the palette was reachable
    // before a header existed. It has one home now.
    render(<Home />);
    const trigger = screen.getByRole("button", { name: /search/i });
    expect(trigger.closest("header")).not.toBeNull();
  });
});
