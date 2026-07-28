"use client";

import * as React from "react";

import { Callout } from "@/components/hud/callout";
import { DetailPanel } from "@/components/hud/detail-panel";
import type { HotspotChannel } from "@/components/scene/hotspot-channel";
import { findCatalogEntry, type CatalogId } from "@/lib/catalog";

interface HotspotLayerProps<T extends CatalogId> {
  channel: HotspotChannel<T>;
  /**
   * What this layer offers, in tab order — which is also the Detail Panel
   * trigger order §8 asks for. See `src/lib/hotspots.ts`.
   */
  ids: readonly T[];
  /**
   * The HUD index readout for a hotspot, `03/08` (§5). Omitted for a set the
   * visitor looks across rather than counts through.
   */
  indexLabel?: (id: T) => string;
}

/**
 * Which Callout is up, and whose Detail Panel is up.
 *
 * Both carry `open` alongside the id rather than going to `null` when they
 * close, because both have an exit to play (MASTER.md §6.2): dropping the id
 * would unmount the thing mid-exit and there would be no exit at all. They fall
 * away only when something else replaces them.
 */
interface Showing<T extends CatalogId> {
  id: T;
  open: boolean;
}

interface ShowingCallout<T extends CatalogId> extends Showing<T> {
  side: "left" | "right";
  rise: "up" | "down";
}

const dismiss = <S extends Showing<CatalogId>>(showing: S | null): S | null =>
  showing && { ...showing, open: false };

const openId = <T extends CatalogId>(showing: Showing<T> | null) =>
  showing?.open ? showing.id : null;

/**
 * The interactive layer over the canvas — Act 2's Parts, Act 3's Gear Items.
 *
 * One component for both, because they are the same interaction: point at a
 * thing in the scene, read its Callout, open its Detail Panel. What differs is
 * only which set it is offering and whether that set is numbered.
 *
 * DOM over the canvas, not inside it. Each object gets a real button, so hover,
 * tap, click, Tab and the focus ring all come from the platform rather than
 * being rebuilt on top of a raycast — and the canvas stays `aria-hidden` with
 * its interaction available to a keyboard (MASTER.md §8).
 *
 * The buttons are positioned by the canvas, which projects their objects every
 * frame and writes the result straight onto these nodes; see `hotspot-channel`.
 */
export function HotspotLayer<T extends CatalogId>({
  channel,
  ids,
  indexLabel,
}: HotspotLayerProps<T>) {
  const available = React.useSyncExternalStore(
    channel.subscribe,
    channel.getAvailable,
    () => false
  );

  const [callout, setCallout] = React.useState<ShowingCallout<T> | null>(null);
  const [panel, setPanel] = React.useState<Showing<T> | null>(null);

  const panelEntry = panel ? findCatalogEntry(panel.id) ?? null : null;

  /*
   * The canvas needs both back: Act 3's float-up and showcase are 3D transforms
   * on the object itself, not DOM effects. Reported from the state that drives
   * the Callout and the panel rather than from the event handlers, so the two
   * can never disagree about what is active — and cleared as each closes, so a
   * Gear Item does not stay lifted through its own exit.
   */
  React.useEffect(() => {
    channel.setActive(openId(callout));
  }, [channel, callout]);

  React.useEffect(() => {
    channel.setSelected(openId(panel));
  }, [channel, panel]);

  /*
   * Everything closes when the Act stops offering interaction.
   *
   * The hotspots unmount on their own, but the Callout and the Detail Panel are
   * not hotspots — left alone, the panel floats over the following Act
   * describing an object that is no longer on screen, and the showcase keeps
   * turning something nobody is looking at, which is precisely the endless
   * decorative animation §5 reserves for loading indicators.
   *
   * Adjusted during render rather than in an effect: this is state reacting to
   * a change in another value, so an effect would render the stale panel first
   * and correct it afterwards.
   */
  const [wasAvailable, setWasAvailable] = React.useState(available);
  if (wasAvailable !== available) {
    setWasAvailable(available);
    if (!available) {
      setCallout(null);
      setPanel(null);
    }
  }

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
          ids.map((id) => {
            const entry = findCatalogEntry(id);
            if (!entry) return null;

            // The canvas works out which way the label fits and writes it onto
            // the hotspot as it projects. Read at the moment the Callout
            // appears rather than tracked per frame: the lean only has to be
            // right when the label arrives, and a Callout that re-rendered as
            // the camera drifted would flip under the pointer.
            const show = (node: HTMLElement | null) =>
              setCallout({
                id,
                open: true,
                side: node?.dataset.side === "left" ? "left" : "right",
                rise: node?.dataset.rise === "down" ? "down" : "up",
              });

            return (
              <div
                key={id}
                ref={(node) => {
                  channel.register(id, node);
                  return () => channel.register(id, null);
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
                    setPanel({ id, open: true });
                    // The panel is the lit element from here; a Callout still
                    // showing behind it is the second one §4 forbids.
                    setCallout(dismiss);
                  }}
                >
                  {/*
                   * The dot the Callout's leader line meets. It is the only
                   * thing drawn until the object is hovered — a labelled box
                   * standing over every one of them at rest would bury the
                   * scene they are pointing at.
                   */}
                  <span
                    aria-hidden="true"
                    className="absolute top-1/2 left-1/2 size-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40 transition-colors duration-[var(--dur-fast)] group-hover:bg-thermal-4"
                  />
                </button>

                {callout?.id === id ? (
                  <Callout
                    name={entry.name}
                    index={indexLabel?.(id)}
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
