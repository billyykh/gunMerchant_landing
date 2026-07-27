"use client";

import * as React from "react";

import { Callout } from "@/components/hud/callout";
import { DetailPanel } from "@/components/hud/detail-panel";
import { findCatalogEntry } from "@/lib/catalog";
import { HOTSPOT_ORDER, hotspotIndexLabel } from "@/lib/part-hotspots";
import type { PartName } from "@/lib/scene-state";
import type { HotspotChannel } from "./hotspot-channel";

interface GunsmithHudProps {
  channel: HotspotChannel;
}

/**
 * Which Callout is up, and which Part's Detail Panel is up.
 *
 * Both carry `open` alongside the Part rather than going to `null` when they
 * close, because both have an exit to play (MASTER.md §6.2): dropping the Part
 * would unmount the thing mid-exit and there would be no exit at all. They fall
 * away only when another Part replaces them.
 */
interface Showing {
  part: PartName;
  open: boolean;
}

interface ShowingCallout extends Showing {
  side: "left" | "right";
  rise: "up" | "down";
}

const dismiss = <T extends Showing>(showing: T | null): T | null =>
  showing && { ...showing, open: false };

/**
 * The Gunsmith View's interactive layer.
 *
 * DOM over the canvas, not inside it. Each Part gets a real button, so hover,
 * tap, click, Tab and the focus ring all come from the platform rather than
 * being rebuilt on top of a raycast — and the canvas stays `aria-hidden` with
 * its interaction available to a keyboard (MASTER.md §8).
 *
 * The buttons are positioned by the canvas, which projects each Part every
 * frame and writes the result straight onto these nodes; see `hotspot-channel`.
 */
export function GunsmithHud({ channel }: GunsmithHudProps) {
  const available = React.useSyncExternalStore(
    channel.subscribe,
    channel.getAvailable,
    () => false
  );

  const [callout, setCallout] = React.useState<ShowingCallout | null>(null);
  const [panel, setPanel] = React.useState<Showing | null>(null);

  const panelEntry = panel ? findCatalogEntry(panel.part) ?? null : null;

  /**
   * The hotspot the open panel was launched from. Captured from the click that
   * opened it rather than looked up while rendering: the hotspots unmount when
   * the scene starts moving, so a lookup could hand the panel an element that
   * is no longer on the page.
   */
  const finalFocus = React.useRef<HTMLElement | null>(null);

  return (
    <>
      {/*
       * Full-viewport and inert except for the hotspots themselves — the layer
       * covers the scene, and a transparent sheet that swallowed clicks would
       * make the whole page feel dead.
       */}
      <div className="pointer-events-none fixed inset-0 z-30">
        {available &&
          HOTSPOT_ORDER.map((part) => {
            const entry = findCatalogEntry(part);
            if (!entry) return null;

            // The canvas works out which way the label fits and writes it onto
            // the hotspot as it projects. Read at the moment the Callout
            // appears rather than tracked per frame: the lean only has to be
            // right when the label arrives, and a Callout that re-rendered as
            // the camera drifted would flip under the pointer.
            const show = (node: HTMLElement | null) =>
              setCallout({
                part,
                open: true,
                side: node?.dataset.side === "left" ? "left" : "right",
                rise: node?.dataset.rise === "down" ? "down" : "up",
              });

            return (
              <div
                key={part}
                ref={(node) => {
                  channel.register(part, node);
                  return () => channel.register(part, null);
                }}
                className="absolute top-0 left-0"
              >
                <button
                  type="button"
                  aria-label={entry.name}
                  aria-haspopup="dialog"
                  // 44x44 (MASTER.md §8), centred on the projected anchor
                  // point rather than hanging off it.
                  className="group pointer-events-auto absolute size-11 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  // A touch tap fires `pointerenter` and `focus` before its
                  // click, so the Callout is shown by a tap exactly as it is by
                  // a hover, and the tap goes on to open the panel.
                  onPointerEnter={(event) => show(event.currentTarget.parentElement)}
                  onPointerLeave={() => setCallout(dismiss)}
                  onFocus={(event) => show(event.currentTarget.parentElement)}
                  onBlur={() => setCallout(dismiss)}
                  onClick={(event) => {
                    finalFocus.current = event.currentTarget;
                    setPanel({ part, open: true });
                    // The panel is the lit element from here; a Callout still
                    // showing behind it is the second one §4 forbids.
                    setCallout(dismiss);
                  }}
                >
                  {/*
                   * The dot the Callout's leader line meets. It is the only
                   * thing drawn until the Part is hovered — eight labelled
                   * boxes standing over the rifle at rest would bury it.
                   */}
                  <span
                    aria-hidden="true"
                    className="absolute top-1/2 left-1/2 size-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40 transition-colors duration-[var(--dur-fast)] group-hover:bg-thermal-4"
                  />
                </button>

                {callout?.part === part ? (
                  <Callout
                    name={entry.name}
                    index={hotspotIndexLabel(part)}
                    side={callout.side}
                    rise={callout.rise}
                    open={callout.open}
                  />
                ) : null}
              </div>
            );
          })}
      </div>

      <DetailPanel
        entry={panelEntry}
        open={panel?.open ?? false}
        onOpenChange={(next) => {
          if (!next) setPanel(dismiss);
        }}
        finalFocus={finalFocus}
      />
    </>
  );
}
