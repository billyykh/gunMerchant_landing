"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

import { cn } from "@/lib/utils";

/**
 * A panel anchored to the edge of the viewport.
 *
 * The same Base UI dialog the command palette uses — modal, focus-trapped,
 * Escape-closable — positioned against an edge instead of centred. Kept
 * separate from `dialog.tsx` rather than bolted on as a variant: the centred
 * dialog hardcodes its own transform, and overriding that from the outside is
 * how a component ends up with two layout systems fighting each other.
 */
function Sheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn("font-heading text-base leading-none font-medium", className)}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props) {
  return (
    <DialogPrimitive.Portal data-slot="sheet-portal">
      <DialogPrimitive.Backdrop
        data-slot="sheet-overlay"
        className="fixed inset-0 z-50 bg-black/60 duration-[var(--dur-base)] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 data-closed:duration-[var(--dur-exit)]"
      />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          // Full height against the right edge, with a drawn 1px left border
          // rather than a shadow — elevation on this system is drawn, never
          // blurred (MASTER.md §4).
          "fixed inset-y-0 right-0 z-50 flex w-[min(20rem,85vw)] flex-col gap-6 border-l border-[var(--border-structural)] bg-surface-1 p-6 outline-none",
          "duration-[var(--dur-base)] ease-[var(--ease-out)] data-open:animate-in data-open:slide-in-from-right",
          "data-closed:animate-out data-closed:slide-out-to-right data-closed:duration-[var(--dur-exit)]",
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

/*
 * No `SheetClose`. Base UI's close control carries native button semantics, and
 * this sheet's only close controls are links — see `MobileNav`, which closes
 * from `onClick` instead. Re-add it when something here is genuinely a button.
 */
export { Sheet, SheetContent, SheetTitle, SheetTrigger };
