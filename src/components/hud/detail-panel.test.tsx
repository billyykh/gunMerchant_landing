import * as React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { findCatalogEntry } from "@/lib/catalog";
import { DetailPanel } from "./detail-panel";

const SCOPE = findCatalogEntry("Rifle_Scope")!;

/** The panel as a visitor meets it: opened from a control it must return to. */
function PanelHarness() {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
        Inspect scope
      </button>
      <DetailPanel
        entry={SCOPE}
        open={open}
        onOpenChange={setOpen}
        finalFocus={triggerRef}
      />
    </>
  );
}

const openPanel = async () => {
  const user = userEvent.setup();
  render(<PanelHarness />);
  await user.click(screen.getByRole("button", { name: "Inspect scope" }));
  return { user, panel: screen.getByRole("dialog") };
};

describe("what the Detail Panel shows", () => {
  it("titles itself with the product name", () => {
    render(<DetailPanel entry={SCOPE} open onOpenChange={() => {}} />);
    expect(
      screen.getByRole("heading", { name: SCOPE.name })
    ).toBeInTheDocument();
  });

  it("leads with the category", () => {
    render(<DetailPanel entry={SCOPE} open onOpenChange={() => {}} />);
    expect(screen.getByText(SCOPE.category)).toBeInTheDocument();
  });

  it("lists every spec as a label and a value", () => {
    render(<DetailPanel entry={SCOPE} open onOpenChange={() => {}} />);
    const specs = screen.getByRole("dialog").querySelectorAll("dt");

    expect(specs).toHaveLength(SCOPE.specs.length);
    for (const spec of SCOPE.specs) {
      expect(screen.getByText(spec.label)).toBeInTheDocument();
      expect(screen.getByText(spec.value)).toBeInTheDocument();
    }
  });

  it("prices it in whole dollars", () => {
    render(<DetailPanel entry={SCOPE} open onOpenChange={() => {}} />);
    expect(screen.getByText("$2,310")).toBeInTheDocument();
  });

  it("offers a way to buy it", () => {
    render(<DetailPanel entry={SCOPE} open onOpenChange={() => {}} />);
    expect(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: /add to kit/i,
      })
    ).toBeInTheDocument();
  });

  it("shows nothing at all when there is no entry to show", () => {
    // A Part with no catalog entry is a data fault, not a reason to open an
    // empty panel over the scene.
    render(<DetailPanel entry={null} open onOpenChange={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("focus when the Detail Panel opens", () => {
  it("lands on the panel itself, not on its close control", async () => {
    // Focusing the first control announces "Close, button" before the product
    // the visitor asked to see. Focusing the container reads the title first,
    // and Tab still reaches the close control immediately after.
    const { panel } = await openPanel();
    expect(panel).toHaveFocus();
  });
});

describe("closing the Detail Panel", () => {
  it("closes on the close control", async () => {
    const { user, panel } = await openPanel();

    await user.click(within(panel).getByRole("button", { name: /close/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const { user } = await openPanel();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on a click away from it", async () => {
    const { user } = await openPanel();

    await user.click(document.body);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("hands focus back to whatever opened it", async () => {
    const { user } = await openPanel();

    await user.keyboard("{Escape}");

    expect(screen.getByRole("button", { name: "Inspect scope" })).toHaveFocus();
  });
});
