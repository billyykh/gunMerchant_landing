"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";

import { formatPrice, type CatalogEntry } from "@/lib/catalog";
import { cn } from "@/lib/utils";

interface DetailPanelProps {
  /** `null` while nothing is selected, and between selections. */
  entry: CatalogEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The control the panel was opened from; focus returns here on close. */
  finalFocus?: React.RefObject<HTMLElement | null>;
}

/**
 * The Detail Panel — a product read out beside the scene.
 *
 * Contract: `docs/design-system/MASTER.md` §7 (Detail Panel). Built on the Base
 * UI dialog rather than hand-rolled, so `aria-modal`, the focus trap, Escape
 * and click-away all come from the primitive; §7 asks for exactly that.
 *
 * Ticket 14 reuses this unchanged for Gear Items — it is given a catalog entry
 * and knows nothing about rifles.
 */
export function DetailPanel({
  entry,
  open,
  onOpenChange,
  finalFocus,
}: DetailPanelProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  // A selection with no catalog entry is a data fault (`part-hotspots.test.ts`
  // holds the catalog to the Part list), and an empty panel over the scene is a
  // worse answer than no panel.
  if (!entry) return null;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className={
            "fixed inset-0 z-40 bg-black/40 duration-[var(--dur-slow)] " +
            "data-open:animate-in data-open:fade-in-0 " +
            "data-closed:animate-out data-closed:fade-out-0 data-closed:duration-[var(--dur-exit)]"
          }
        />

        <DialogPrimitive.Popup
          ref={panelRef}
          // Otherwise focus lands on the close control, which announces
          // "Close, button" to a screen reader before the product the visitor
          // asked to see. The container reads its title instead, and Tab
          // reaches the close control immediately after.
          initialFocus={panelRef}
          finalFocus={finalFocus}
          className={cn(
            // A bottom sheet until there is a column of viewport to give it
            // (MASTER.md §9); a right-side panel from `lg` up, where the scene
            // still has room to be looked at beside it.
            "hud-brackets-left fixed z-50 flex flex-col gap-6 overflow-y-auto",
            "inset-x-0 bottom-0 h-[92vh] border-t border-[var(--border-hud)]",
            "lg:inset-y-0 lg:right-0 lg:left-auto lg:h-auto lg:w-[min(420px,92vw)]",
            "lg:border-t-0 lg:border-l lg:border-[var(--border-hud)]",
            "bg-surface-1 p-6 sm:p-8",
            // Slides in from the edge it is anchored to. §6.2: 24px and a fade,
            // over --dur-slow; exits faster. The slide is `motion-safe` and the
            // fade is not, so `prefers-reduced-motion` gets the cross-fade §6.3
            // asks for rather than the same move at zero duration.
            "duration-[var(--dur-slow)] ease-[var(--ease-out)]",
            "data-open:animate-in data-open:fade-in-0",
            "motion-safe:data-open:slide-in-from-bottom-6",
            "lg:motion-safe:data-open:slide-in-from-bottom-0 lg:motion-safe:data-open:slide-in-from-right-6",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:duration-[var(--dur-exit)]"
          )}
          style={{
            // A bottom sheet sits on the home indicator otherwise.
            paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
          }}
        >
          {/*
           * One scan sweep on open — a single 400ms pass, never looped (§5).
           * `key` on the entry id restarts it when the visitor moves straight
           * from one Part to another without closing the panel in between.
           */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            {/*
             * Clipped by the wrapper: the sweep travels a full panel height, and
             * an unclipped child doing that inside a scrolling panel extends its
             * scroll range while it runs.
             */}
            <span key={entry.id} className="hud-scan absolute inset-0" />
          </span>

          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <p className="hud-label">{entry.category}</p>
              {/* §3.1 sets the Detail Panel product name at the h2 step. */}
              <DialogPrimitive.Title className="font-heading text-[2rem] leading-[1.15] text-text-primary">
                {entry.name}
              </DialogPrimitive.Title>
            </div>

            <DialogPrimitive.Close
              className="-mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors duration-[var(--dur-fast)] hover:bg-white/[0.06] hover:text-text-primary"
              aria-label="Close"
            >
              <XIcon className="size-4" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>

          {/*
           * A description list, not a table: these are labelled values with no
           * second axis, and a one-column table announces phantom structure.
           */}
          <dl className="tabular flex flex-col text-sm">
            {entry.specs.map((spec) => (
              <div
                key={spec.label}
                className="flex items-baseline justify-between gap-4 border-t border-thermal-2 py-3 first:border-t-0 first:pt-0"
              >
                <dt className="text-text-secondary">{spec.label}</dt>
                <dd className="text-right text-text-primary">{spec.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-auto flex flex-col gap-4 pt-2">
            <p className="tabular text-3xl text-text-primary">
              {formatPrice(entry.price)}
            </p>

            <button
              type="button"
              className="flex h-11 items-center justify-center rounded-md bg-thermal-3 px-6 font-medium text-thermal-6 transition-colors duration-[var(--dur-fast)] hover:bg-thermal-4"
            >
              Add to kit
            </button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
