"use client";

import * as React from "react";
import Link from "next/link";
import { MenuIcon, ShoppingCartIcon } from "lucide-react";

import { CatalogSearch } from "@/components/catalog-search";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useScrolledPast } from "@/hooks/use-scrolled-past";
import { PRIMARY_NAV } from "@/lib/site-nav";

/** Placeholder until there is a cart to count. Announced, never inferred. */
const CART_COUNT = 3;

/**
 * The shell shared by the header's icon-only controls.
 *
 * These take the background lift on hover rather than the ghost button's colour
 * shift (MASTER.md §7): the affordance being offered is a 44×44 target, and
 * lighting the glyph itself reads as an active state rather than a hover.
 */
const ICON_CONTROL =
  "flex size-11 shrink-0 items-center justify-center rounded-md text-text-secondary " +
  "transition-colors duration-[var(--dur-fast)] hover:bg-white/[0.06] hover:text-text-primary";

/**
 * The site header.
 *
 * Transparent over Act 1, so the brand lockup and the canvas behind it read as
 * one composition, and it earns a surface only once content is passing
 * underneath. That state is carried on `data-scrolled` and styled from there:
 * the crossfade is a CSS transition, not a re-render per scroll frame.
 *
 * Visual contract: docs/design-system/MASTER.md §7.
 */
export function SiteHeader() {
  const scrolled = useScrolledPast(24);

  return (
    <header
      data-scrolled={scrolled}
      className={
        "fixed inset-x-0 top-0 z-50 border-b border-transparent " +
        "transition-[background-color,border-color,backdrop-filter] duration-[var(--dur-base)] ease-[var(--ease-out)] " +
        "data-[scrolled=true]:border-b-white/8 " +
        "data-[scrolled=true]:bg-surface-0/72 " +
        "data-[scrolled=true]:backdrop-blur-[12px]"
      }
      style={{
        // The header is fixed at the top edge, so on a notched phone its
        // contents sit under the cutout unless it is padded out of the way.
        // The bar keeps its 64px of content and grows by the inset rather than
        // squeezing into it — `viewportFit: "cover"` in layout.tsx is what
        // makes these resolve to anything at all.
        paddingTop: "env(safe-area-inset-top)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div className="flex h-16 items-center gap-6 px-6 sm:px-12 lg:px-16">
        <Link
          href="/"
          className="brand-mark text-lg text-text-primary"
        >
          VANTAK
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-6">
            {PRIMARY_NAV.map((link) => (
              <li key={link.label}>
                <NavLink {...link} />
              </li>
            ))}
          </ul>
        </nav>

        {/* 8px is the floor between adjacent targets, not a comfortable
            default — MASTER.md §8. Tightening it on narrow viewports would
            tighten it on exactly the devices being touched. */}
        <div className="ml-auto flex items-center gap-2">
          <CatalogSearch />
          <CartButton />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

function NavLink({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-text-secondary transition-colors duration-[var(--dur-fast)] hover:text-thermal-4"
    >
      {label}
    </Link>
  );
}

/**
 * The badge is `aria-hidden` and the count lives in the button's label instead.
 * Left visible to assistive technology it reads as a bare digit after the word
 * "Cart", which is both duplicated and ambiguous (MASTER.md §7).
 */
function CartButton() {
  return (
    <button
      type="button"
      aria-label={`Cart, ${CART_COUNT} items`}
      className={`relative ${ICON_CONTROL}`}
    >
      <ShoppingCartIcon className="size-5" aria-hidden="true" />
      {/* 11px is the floor of the type scale (MASTER.md §3.1) and the badge is
          not an exception to it — a smaller numeral is a smaller numeral. */}
      <span
        aria-hidden="true"
        className="tabular absolute top-1 right-1 min-w-4 rounded-full bg-thermal-3 px-1 text-[0.6875rem] leading-4 font-medium text-thermal-6"
      >
        {CART_COUNT}
      </span>
    </button>
  );
}

function MobileNav() {
  /*
   * Open state is held here rather than left to `SheetClose`, because these
   * close controls are links. Base UI's close control carries native button
   * semantics, and neither way of reconciling that is acceptable: left alone it
   * warns that an anchor is being treated as a button, and told the element is
   * not a native button it drops the anchor's link role, which takes the items
   * out of the accessibility tree as links entirely. Closing from `onClick`
   * leaves them plain links.
   */
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Menu"
        className={`${ICON_CONTROL} md:hidden`}
      >
        <MenuIcon className="size-5" aria-hidden="true" />
      </SheetTrigger>

      <SheetContent>
        <SheetTitle className="hud-label">Menu</SheetTitle>

        <nav aria-label="Primary, mobile">
          <ul className="flex flex-col gap-1">
            {PRIMARY_NAV.map((link) => (
              <li key={link.label}>
                {/* Closing on selection is what makes the sheet feel like
                    navigation rather than a panel the visitor has to dismiss. */}
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center text-base font-medium text-text-secondary transition-colors duration-[var(--dur-fast)] hover:text-thermal-4"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
