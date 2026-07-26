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
});
