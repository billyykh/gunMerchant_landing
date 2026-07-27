import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { scrollTo } from "@/test-utils/scroll";
import { SiteHeader } from "./site-header";

const header = () => screen.getByRole("banner");
const primaryNav = () => screen.getByRole("navigation", { name: /^primary$/i });

afterEach(() => {
  window.scrollY = 0;
});

describe("the header", () => {
  it("carries the brand back to the top of the site", () => {
    render(<SiteHeader />);
    expect(
      within(header()).getByRole("link", { name: /vantak/i })
    ).toHaveAttribute("href", "/");
  });

  it("offers the primary navigation", () => {
    render(<SiteHeader />);
    const links = within(primaryNav()).getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(3);
    expect(links.length).toBeLessThanOrEqual(4);
  });

  it("puts the catalog search in reach", () => {
    render(<SiteHeader />);
    expect(
      within(header()).getByRole("button", { name: /search/i })
    ).toBeInTheDocument();
  });
});

describe("the cart", () => {
  it("states its count in words, not only as a badge", () => {
    // MASTER.md §7: a count conveyed by the pill's colour and shape alone is
    // invisible to a screen reader.
    render(<SiteHeader />);
    expect(
      within(header()).getByRole("button", { name: /cart, \d+ items?/i })
    ).toBeInTheDocument();
  });

  it("does not read the badge digits out a second time", () => {
    render(<SiteHeader />);
    const cart = within(header()).getByRole("button", { name: /cart, \d+/i });
    expect(cart).toHaveAccessibleName(expect.stringMatching(/^Cart, \d+/));
  });
});

describe("its background", () => {
  // The header is transparent over Act 1 so the brand lockup and the canvas
  // read as one composition, and only earns a surface once content is passing
  // underneath it. Asserted through `data-scrolled`, which the stylesheet keys
  // off — jsdom computes no styles, so asserting the classes would only
  // restate the implementation.

  it("is transparent at the top of the page", () => {
    render(<SiteHeader />);
    expect(header()).toHaveAttribute("data-scrolled", "false");
  });

  it("takes on a background once the page scrolls under it", () => {
    render(<SiteHeader />);
    scrollTo(100);
    expect(header()).toHaveAttribute("data-scrolled", "true");
  });

  it("gives it back at the top again", () => {
    render(<SiteHeader />);
    scrollTo(100);
    scrollTo(0);
    expect(header()).toHaveAttribute("data-scrolled", "false");
  });
});

describe("on a narrow viewport", () => {
  it("offers the same navigation behind a menu control", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);

    // Read before opening: the sheet is modal, so Base UI hides the rest of
    // the page from the accessibility tree while it is up.
    const desktopLinks = within(primaryNav())
      .getAllByRole("link")
      .map((link) => link.textContent);

    await user.click(within(header()).getByRole("button", { name: /menu/i }));

    const sheet = screen.getByRole("dialog");
    expect(
      within(sheet).getAllByRole("link").map((link) => link.textContent)
    ).toEqual(desktopLinks);
  });

  it("closes the menu on Escape and hands focus back", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);

    const trigger = within(header()).getByRole("button", { name: /menu/i });
    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
