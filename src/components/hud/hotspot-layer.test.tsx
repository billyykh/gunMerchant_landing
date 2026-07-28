import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { asPhone } from "@/test-utils/viewport";

import {
  createHotspotChannel,
  type HotspotChannel,
} from "@/components/scene/hotspot-channel";
import { findCatalogEntry, type CatalogId } from "@/lib/catalog";
import {
  GEAR_HOTSPOT_ORDER,
  PART_HOTSPOT_ORDER,
  partHotspotIndexLabel,
} from "@/lib/hotspots";
import type { PartName } from "@/lib/scene-state";
import { HotspotLayer } from "./hotspot-layer";

let channel: HotspotChannel;

const nameOf = (id: CatalogId) => findCatalogEntry(id)!.name;

const BARREL = nameOf("Rifle_Barrel");
const SCOPE = nameOf("Rifle_Scope");

const hotspot = (id: CatalogId) =>
  screen.getByRole("button", { name: nameOf(id) });

/** The Gunsmith View's layer — the numbered set. */
const renderParts = () =>
  render(
    <HotspotLayer
      channel={channel}
      label="Parts"
      ids={PART_HOTSPOT_ORDER}
      indexLabel={(id) => partHotspotIndexLabel(id as PartName)}
    />
  );

/** The Lineup's layer — the same component, an unnumbered set. */
const renderGear = () =>
  render(
    <HotspotLayer channel={channel} label="Lineup" ids={GEAR_HOTSPOT_ORDER} />
  );

/** The canvas turns interaction on when its Act settles. */
const settle = () => act(() => channel.setAvailable(true));

/**
 * The Callout that is up, if any. It stays mounted through its exit
 * (MASTER.md §6.2), so "showing" is `data-open`, not presence.
 */
const shownCallout = () =>
  document.querySelector('.hud-callout[data-open="true"]');

beforeEach(() => {
  channel = createHotspotChannel();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("on a viewport too narrow to point at the model", () => {
  /*
   * Eight anchors along a rifle that spans 230px cannot be 44px apart with 8px
   * between them — measured in the browser at 375×812, the closest pair of
   * projected hotspots sat 9px apart, so the receiver's target almost entirely
   * covered the magazine's. That is geometry, not a bug to tune away: the
   * composition scales with the frame and the 44px floor does not.
   *
   * So the base breakpoint offers the same catalog as a list. Every Part is
   * still reachable and still opens the same Detail Panel — §9 downscales
   * rendering, never content.
   */
  const listed = () =>
    within(screen.getByRole("navigation", { name: /parts|lineup/i }))
      .getAllByRole("button")
      .map((b) => b.getAttribute("aria-label"));

  it("lists them instead of projecting them onto the scene", () => {
    asPhone();
    renderParts();
    settle();

    expect(listed()).toEqual(PART_HOTSPOT_ORDER.map(nameOf));
    expect(channel.nodes.size).toBe(0);
  });

  it("gives every control room for a finger", () => {
    asPhone();
    renderParts();
    settle();

    // jsdom has no layout, so this is the class contract rather than a
    // measurement: the browser pass is what confirms the pixels.
    for (const button of screen.getAllByRole("button")) {
      expect(button.className).toMatch(/min-h-11/);
    }
  });

  it("still offers nothing while the scene is moving", () => {
    asPhone();
    renderParts();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("opens the same Detail Panel", async () => {
    asPhone();
    const user = userEvent.setup();
    renderParts();
    settle();

    await user.click(hotspot("Rifle_Scope"));

    const panel = screen.getByRole("dialog");
    expect(
      within(panel).getByRole("heading", { name: SCOPE })
    ).toBeInTheDocument();
    expect(within(panel).getByText("$2,310")).toBeInTheDocument();
  });

  it("shows no Callout, because the list already carries the name", () => {
    // A leader line pointing from a chip at the bottom of the screen to a Part
    // it is not next to would be an arrow to nowhere.
    asPhone();
    renderParts();
    settle();

    expect(document.querySelector(".hud-callout")).toBeNull();
  });

  it("numbers the Parts and leaves the Lineup unnumbered", () => {
    asPhone();
    const { unmount } = renderParts();
    settle();
    expect(screen.getByRole("navigation")).toHaveTextContent("02/08");
    unmount();

    channel = createHotspotChannel();
    renderGear();
    settle();
    expect(screen.getByRole("navigation")).not.toHaveTextContent(/\d\d\/\d\d/);
  });
});

describe("while the scene is still moving", () => {
  it("offers no hotspots at all", () => {
    renderParts();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("takes them away again when the scene starts moving", () => {
    // Not merely hidden: a tab stop anchored to a Part that is mid-flight is a
    // control pointing at nothing.
    renderParts();
    settle();
    expect(screen.getAllByRole("button")).toHaveLength(
      PART_HOTSPOT_ORDER.length
    );

    act(() => channel.setAvailable(false));
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});

describe("the hotspots", () => {
  it("offers one per object, named as the catalog names it", () => {
    renderParts();
    settle();

    for (const part of PART_HOTSPOT_ORDER) {
      expect(hotspot(part)).toBeInTheDocument();
    }
  });

  it("puts them in the order it was given", () => {
    renderParts();
    settle();

    expect(
      screen.getAllByRole("button").map((b) => b.getAttribute("aria-label"))
    ).toEqual(PART_HOTSPOT_ORDER.map(nameOf));
  });

  it("announces that it opens a dialog", () => {
    renderParts();
    settle();
    expect(hotspot("Rifle_Barrel")).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("registers itself with the canvas so it can be positioned", () => {
    renderParts();
    settle();
    expect(channel.nodes.size).toBe(PART_HOTSPOT_ORDER.length);
  });

  it("unregisters when the scene starts moving again", () => {
    renderParts();
    settle();
    act(() => channel.setAvailable(false));
    expect(channel.nodes.size).toBe(0);
  });
});

describe("the Callout", () => {
  it("appears on hover", async () => {
    const user = userEvent.setup();
    renderParts();
    settle();

    expect(shownCallout()).toBeNull();
    await user.hover(hotspot("Rifle_Barrel"));
    expect(shownCallout()).toHaveTextContent(BARREL);
  });

  it("goes away again when the pointer leaves", async () => {
    const user = userEvent.setup();
    renderParts();
    settle();

    await user.hover(hotspot("Rifle_Barrel"));
    await user.unhover(hotspot("Rifle_Barrel"));

    expect(shownCallout()).toBeNull();
  });

  it("appears on focus too, so it is not a mouse-only affordance", async () => {
    const user = userEvent.setup();
    renderParts();
    settle();

    await user.tab();

    expect(shownCallout()).toHaveTextContent(nameOf(PART_HOTSPOT_ORDER[0]));
  });

  it("appears under a finger, which has no hover to give", async () => {
    // A touch device cannot hover, so the tap does both jobs: the Callout comes
    // up as the finger lands, and the panel opens as it lifts. Nothing here is
    // touch-specific code — a tap fires `pointerenter` and `focus` before its
    // click, so it runs the hover path on the way to the click path.
    const user = userEvent.setup();
    renderParts();
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
    renderParts();
    settle();

    await user.hover(hotspot("Rifle_Barrel"));
    await user.hover(hotspot("Rifle_Scope"));

    expect(
      document.querySelectorAll('.hud-callout[data-open="true"]')
    ).toHaveLength(1);
    expect(shownCallout()).toHaveTextContent(SCOPE);
  });

  it("reaches the way the canvas said it fits", async () => {
    const user = userEvent.setup();
    renderParts();
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

  it("numbers a set that was given an index", async () => {
    const user = userEvent.setup();
    renderParts();
    settle();

    await user.hover(hotspot("Rifle_Barrel"));

    expect(shownCallout()).toHaveTextContent("02/08");
  });

  it("does not number a set that was not", async () => {
    // The Lineup is four objects a visitor looks across, not a sequence they
    // count through.
    const user = userEvent.setup();
    renderGear();
    settle();

    await user.hover(hotspot("Gear_Torch"));

    expect(shownCallout()).toHaveTextContent(nameOf("Gear_Torch"));
    expect(shownCallout()).not.toHaveTextContent(/\d\d\/\d\d/);
  });
});

describe("the Detail Panel", () => {
  it("opens on click, showing that object", async () => {
    const user = userEvent.setup();
    renderParts();
    settle();

    await user.click(hotspot("Rifle_Scope"));

    const panel = screen.getByRole("dialog");
    expect(
      within(panel).getByRole("heading", { name: SCOPE })
    ).toBeInTheDocument();
    expect(within(panel).getByText("$2,310")).toBeInTheDocument();
  });

  it("opens from the keyboard", async () => {
    const user = userEvent.setup();
    renderParts();
    settle();

    await user.tab();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("hands focus back to the hotspot it was opened from", async () => {
    const user = userEvent.setup();
    renderParts();
    settle();

    const trigger = hotspot("Rifle_Scope");
    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(trigger).toHaveFocus();
  });

  it("swaps its contents when another object is chosen", async () => {
    const user = userEvent.setup();
    renderParts();
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
    renderParts();
    settle();

    await user.click(hotspot("Rifle_Scope"));

    expect(shownCallout()).toBeNull();
  });

  it("serves the Lineup from the same component", async () => {
    // Ticket 14 reuses the Callout and Detail Panel unchanged; this is what
    // holds that to more than an intention.
    const user = userEvent.setup();
    renderGear();
    settle();

    await user.click(hotspot("Gear_ThermalDrone"));

    const panel = screen.getByRole("dialog");
    expect(
      within(panel).getByRole("heading", { name: nameOf("Gear_ThermalDrone") })
    ).toBeInTheDocument();
    expect(within(panel).getByText("$4,700")).toBeInTheDocument();
  });
});

describe("what the canvas is told", () => {
  // Act 3's float-up and showcase are 3D transforms on the object itself, so
  // the canvas has to know what the pointer is doing to a DOM button.

  it("names the hotspot showing a Callout", async () => {
    const user = userEvent.setup();
    renderGear();
    settle();

    await user.hover(hotspot("Gear_Torch"));

    expect(channel.getActive()).toBe("Gear_Torch");
  });

  it("takes it back when the Callout goes", async () => {
    const user = userEvent.setup();
    renderGear();
    settle();

    await user.hover(hotspot("Gear_Torch"));
    await user.unhover(hotspot("Gear_Torch"));

    expect(channel.getActive()).toBeNull();
  });

  it("names the hotspot whose Detail Panel is open", async () => {
    const user = userEvent.setup();
    renderGear();
    settle();

    await user.click(hotspot("Gear_AmmoBox"));

    expect(channel.getSelected()).toBe("Gear_AmmoBox");
  });

  it("stops the showcase when the panel closes", async () => {
    // §5: an infinite rotation on an object nobody is looking at is the
    // decorative animation reserved for loading indicators.
    const user = userEvent.setup();
    renderGear();
    settle();

    await user.click(hotspot("Gear_AmmoBox"));
    await user.keyboard("{Escape}");

    expect(channel.getSelected()).toBeNull();
  });

  it("stops the showcase when the Act stops offering interaction", async () => {
    // The hotspots unmount on their own when the scene starts moving, but the
    // Detail Panel is not a hotspot. Left open it floats over the next Act
    // describing an object that has gone, and its showcase turns forever.
    const user = userEvent.setup();
    renderGear();
    settle();

    await user.click(hotspot("Gear_AmmoBox"));
    act(() => channel.setAvailable(false));

    expect(channel.getSelected()).toBeNull();
    expect(channel.getActive()).toBeNull();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not reopen the panel when the Act comes back", async () => {
    const user = userEvent.setup();
    renderGear();
    settle();

    await user.click(hotspot("Gear_AmmoBox"));
    act(() => channel.setAvailable(false));
    settle();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("names the hotspot whose panel is open even when it was opened from the list", async () => {
    // Act 3's showcase turns whatever is selected, and on a phone that
    // selection arrives from the list rather than from a point on the model.
    asPhone();
    const user = userEvent.setup();
    renderGear();
    settle();

    await user.click(hotspot("Gear_Torch"));

    expect(channel.getSelected()).toBe("Gear_Torch");
  });

  it("does not leave a Gear Item lifted by a Callout that is closing", async () => {
    const user = userEvent.setup();
    renderGear();
    settle();

    await user.click(hotspot("Gear_AmmoBox"));

    // The Callout is mid-exit here, still mounted. The object it points at must
    // already be on its way back down.
    expect(channel.getActive()).toBeNull();
  });
});
