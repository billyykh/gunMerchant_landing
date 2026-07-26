import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CatalogSearch } from "./catalog-search";

const openPalette = async () => {
  const user = userEvent.setup();
  render(<CatalogSearch />);
  await user.click(screen.getByRole("button", { name: /search/i }));
  return user;
};

const queryBox = () => screen.getByRole("combobox");

describe("the search trigger", () => {
  it("is a button, not a text field", async () => {
    render(<CatalogSearch />);
    // A text-shaped control that doesn't accept text is a dark pattern
    // (MASTER.md §7) — before the palette opens there must be no input.
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("advertises its keyboard shortcut", () => {
    render(<CatalogSearch />);
    const trigger = screen.getByRole("button", { name: /search/i });
    expect(trigger).toHaveTextContent(/⌘K|Ctrl K/);
  });

  it("opens the palette when clicked", async () => {
    await openPalette();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(queryBox()).toHaveFocus();
  });
});

describe("opening by keyboard", () => {
  it("opens on Meta+K from anywhere on the page", async () => {
    const user = userEvent.setup();
    render(<CatalogSearch />);
    await user.keyboard("{Meta>}k{/Meta}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("opens on Control+K for visitors without a Meta key", async () => {
    const user = userEvent.setup();
    render(<CatalogSearch />);
    await user.keyboard("{Control>}k{/Control}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("searching", () => {
  it("lists the whole catalog before anything is typed", async () => {
    await openPalette();
    expect(screen.getByRole("option", { name: /Match-Grade Barrel/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Tactical Torch/ })).toBeInTheDocument();
  });

  it("narrows to the thermal drone and the night-vision scope for 'thermal'", async () => {
    const user = await openPalette();
    await user.type(queryBox(), "thermal");

    expect(screen.getByRole("option", { name: /Thermal Recon Drone/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Night-Vision Clip-On/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Tactical Torch/ })).not.toBeInTheDocument();
  });

  it("groups results under their category", async () => {
    const user = await openPalette();
    await user.type(queryBox(), "thermal");

    const optics = screen.getByRole("group", { name: /Optics/ });
    expect(within(optics).getByRole("option", { name: /Night-Vision Clip-On/ })).toBeInTheDocument();

    const fieldGear = screen.getByRole("group", { name: /Field Gear/ });
    expect(within(fieldGear).getByRole("option", { name: /Thermal Recon Drone/ })).toBeInTheDocument();
  });

  it("shows a price on every row", async () => {
    const user = await openPalette();
    await user.type(queryBox(), "torch");
    expect(
      screen.getByRole("option", { name: /Tactical Torch/ })
    ).toHaveTextContent("$150");
  });

  it("says so plainly when nothing matches", async () => {
    const user = await openPalette();
    await user.type(queryBox(), "kalashnikov");

    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText(/no products match/i)).toBeInTheDocument();
  });
});

describe("closing", () => {
  it("closes on Escape and hands focus back to the trigger", async () => {
    const user = await openPalette();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /search/i })).toHaveFocus();
  });

  it("closes when a result is chosen and hands focus back to the trigger", async () => {
    const user = await openPalette();
    await user.type(queryBox(), "torch");
    await user.click(screen.getByRole("option", { name: /Tactical Torch/ }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /search/i })).toHaveFocus();
  });

  it("can be walked and chosen entirely from the keyboard", async () => {
    const user = userEvent.setup();
    render(<CatalogSearch />);

    await user.keyboard("{Meta>}k{/Meta}");
    await user.keyboard("torch");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /search/i })).toHaveFocus();
  });
});
