import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PAGE_CLOSE_ATTRIBUTE } from "@/lib/page-close";
import { LEGAL_NAV, PRIMARY_NAV } from "@/lib/site-nav";
import { SiteFooter } from "./site-footer";

const footer = () => screen.getByRole("contentinfo");

const labelsOf = (nav: HTMLElement) =>
  within(nav)
    .getAllByRole("link")
    .map((link) => link.textContent);

describe("the footer", () => {
  it("closes the page with the brand mark", () => {
    render(<SiteFooter />);
    expect(
      within(footer()).getByRole("link", { name: /vantak/i })
    ).toHaveAttribute("href", "/");
  });

  it("offers the same primary navigation the header does", () => {
    // One list, three placements. A footer keeping its own copy is how the two
    // end up disagreeing about what the site sells.
    render(<SiteFooter />);
    expect(
      labelsOf(within(footer()).getByRole("navigation", { name: /^footer$/i }))
    ).toEqual(PRIMARY_NAV.map((link) => link.label));
  });

  it("keeps the legal links in their own labelled group", () => {
    // Two unlabelled navs in one landmark are two lists a screen reader user
    // cannot tell apart.
    render(<SiteFooter />);
    expect(
      labelsOf(within(footer()).getByRole("navigation", { name: /legal/i }))
    ).toEqual(LEGAL_NAV.map((link) => link.label));
  });

  it("marks itself as the page's closing surface", () => {
    // The canvas reads this to work out how much of its own frame the footer
    // has covered, and withdraws the hotspots it has reached. Nothing else
    // holds the two ends of that contract together.
    render(<SiteFooter />);
    expect(footer()).toHaveAttribute(PAGE_CLOSE_ATTRIBUTE);
  });

  it("dates the notice from the clock, not from whenever this was written", () => {
    render(<SiteFooter />);
    expect(
      within(footer()).getByText(new RegExp(String(new Date().getFullYear())))
    ).toBeInTheDocument();
  });

  it("makes every control a real link, so the keyboard gets them for free", () => {
    // MASTER.md §8 asks for full keyboard operation of the footer. Real anchors
    // are how that is obtained rather than rebuilt.
    render(<SiteFooter />);
    const links = within(footer()).getAllByRole("link");

    expect(links.length).toBe(1 + PRIMARY_NAV.length + LEGAL_NAV.length);
    for (const link of links) {
      expect(link.tagName).toBe("A");
      expect(link).toHaveAttribute("href");
    }
  });

  it("hands focus through its links in reading order", async () => {
    const user = userEvent.setup();
    render(<SiteFooter />);
    const links = within(footer()).getAllByRole("link");

    for (const link of links) {
      await user.tab();
      expect(link).toHaveFocus();
    }
  });
});
