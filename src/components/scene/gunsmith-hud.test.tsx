import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { findCatalogEntry } from "@/lib/catalog";
import { HOTSPOT_ORDER } from "@/lib/part-hotspots";
import { createHotspotChannel, type HotspotChannel } from "./hotspot-channel";
import { GunsmithHud } from "./gunsmith-hud";

let channel: HotspotChannel;

const nameOf = (part: (typeof HOTSPOT_ORDER)[number]) =>
  findCatalogEntry(part)!.name;

const BARREL = nameOf("Rifle_Barrel");
const SCOPE = nameOf("Rifle_Scope");

const hotspot = (part: (typeof HOTSPOT_ORDER)[number]) =>
  screen.getByRole("button", { name: nameOf(part) });

/** The canvas turns interaction on when the Gunsmith View settles. */
const settle = () => act(() => channel.setAvailable(true));

beforeEach(() => {
  channel = createHotspotChannel();
});

describe("while the scene is still moving", () => {
  it("offers no hotspots at all", () => {
    render(<GunsmithHud channel={channel} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("takes them away again when the scene starts moving", () => {
    // Not merely hidden: a tab stop anchored to a Part that is mid-flight is a
    // control pointing at nothing.
    render(<GunsmithHud channel={channel} />);
    settle();
    expect(screen.getAllByRole("button")).toHaveLength(HOTSPOT_ORDER.length);

    act(() => channel.setAvailable(false));
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});

describe("the hotspots", () => {
  it("offers one per Part, named as the catalog names it", () => {
    render(<GunsmithHud channel={channel} />);
    settle();

    for (const part of HOTSPOT_ORDER) {
      expect(hotspot(part)).toBeInTheDocument();
    }
  });

  it("puts them in tab order down the length of the rifle", () => {
    render(<GunsmithHud channel={channel} />);
    settle();

    expect(screen.getAllByRole("button").map((b) => b.getAttribute("aria-label")))
      .toEqual(HOTSPOT_ORDER.map(nameOf));
  });

  it("announces that it opens a dialog", () => {
    render(<GunsmithHud channel={channel} />);
    settle();
    expect(hotspot("Rifle_Barrel")).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("registers itself with the canvas so it can be positioned", () => {
    render(<GunsmithHud channel={channel} />);
    settle();
    expect(channel.nodes.size).toBe(HOTSPOT_ORDER.length);
  });

  it("unregisters when the scene starts moving again", () => {
    render(<GunsmithHud channel={channel} />);
    settle();
    act(() => channel.setAvailable(false));
    expect(channel.nodes.size).toBe(0);
  });
});

/**
 * The Callout that is up, if any. It stays mounted through its exit
 * (MASTER.md §6.2), so "showing" is `data-open`, not presence.
 */
const shownCallout = () =>
  document.querySelector('.hud-callout[data-open="true"]');

describe("the Callout", () => {
  it("appears on hover", async () => {
    const user = userEvent.setup();
    render(<GunsmithHud channel={channel} />);
    settle();

    expect(shownCallout()).toBeNull();
    await user.hover(hotspot("Rifle_Barrel"));
    expect(shownCallout()).toHaveTextContent(BARREL);
  });

  it("goes away again when the pointer leaves", async () => {
    const user = userEvent.setup();
    render(<GunsmithHud channel={channel} />);
    settle();

    await user.hover(hotspot("Rifle_Barrel"));
    await user.unhover(hotspot("Rifle_Barrel"));

    expect(shownCallout()).toBeNull();
  });

  it("appears on focus too, so it is not a mouse-only affordance", async () => {
    const user = userEvent.setup();
    render(<GunsmithHud channel={channel} />);
    settle();

    await user.tab();

    expect(shownCallout()).toHaveTextContent(nameOf(HOTSPOT_ORDER[0]));
  });

  it("appears under a finger, which has no hover to give", async () => {
    // A touch device cannot hover, so the tap does both jobs: the Callout comes
    // up as the finger lands, and the panel opens as it lifts. Nothing here is
    // touch-specific code — a tap fires `pointerenter` and `focus` before its
    // click, so it runs the hover path on the way to the click path.
    const user = userEvent.setup();
    render(<GunsmithHud channel={channel} />);
    settle();

    await user.pointer({ target: hotspot("Rifle_Barrel"), keys: "[TouchA>]" });
    expect(shownCallout()).toHaveTextContent(BARREL);

    await user.pointer({ keys: "[/TouchA]" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows only one at a time", async () => {
    // MASTER.md §4: more than one lit element on screen means the hierarchy is
    // broken.
    const user = userEvent.setup();
    render(<GunsmithHud channel={channel} />);
    settle();

    await user.hover(hotspot("Rifle_Barrel"));
    await user.hover(hotspot("Rifle_Scope"));

    expect(document.querySelectorAll('.hud-callout[data-open="true"]')).toHaveLength(1);
    expect(shownCallout()).toHaveTextContent(SCOPE);
  });

  it("reaches the way the canvas said it fits", async () => {
    const user = userEvent.setup();
    render(<GunsmithHud channel={channel} />);
    settle();

    // The canvas writes the lean onto the hotspot as it projects it; a Part
    // near the right edge has no room for a label reaching right.
    const node = channel.nodes.get("Rifle_Barrel")!;
    node.dataset.side = "left";
    node.dataset.rise = "down";
    await user.hover(hotspot("Rifle_Barrel"));

    expect(shownCallout()).toHaveAttribute("data-side", "left");
    expect(shownCallout()).toHaveAttribute("data-rise", "down");
  });
});

describe("the Detail Panel", () => {
  it("opens on click, showing that Part", async () => {
    const user = userEvent.setup();
    render(<GunsmithHud channel={channel} />);
    settle();

    await user.click(hotspot("Rifle_Scope"));

    const panel = screen.getByRole("dialog");
    expect(within(panel).getByRole("heading", { name: SCOPE })).toBeInTheDocument();
    expect(within(panel).getByText("$2,310")).toBeInTheDocument();
  });

  it("opens from the keyboard", async () => {
    const user = userEvent.setup();
    render(<GunsmithHud channel={channel} />);
    settle();

    await user.tab();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("hands focus back to the Part it was opened from", async () => {
    const user = userEvent.setup();
    render(<GunsmithHud channel={channel} />);
    settle();

    const trigger = hotspot("Rifle_Scope");
    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(trigger).toHaveFocus();
  });

  it("swaps its contents when another Part is chosen", async () => {
    const user = userEvent.setup();
    render(<GunsmithHud channel={channel} />);
    settle();

    await user.click(hotspot("Rifle_Scope"));
    await user.keyboard("{Escape}");
    await user.click(hotspot("Rifle_Barrel"));

    expect(
      within(screen.getByRole("dialog")).getByRole("heading", { name: BARREL })
    ).toBeInTheDocument();
  });

  it("does not leave a Callout lit under the open panel", async () => {
    // The panel is the lit element while it is up; a Callout still glowing
    // behind it is the second one §4 forbids.
    const user = userEvent.setup();
    render(<GunsmithHud channel={channel} />);
    settle();

    await user.click(hotspot("Rifle_Scope"));

    expect(shownCallout()).toBeNull();
  });
});
