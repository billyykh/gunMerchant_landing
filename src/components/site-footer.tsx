import Link from "next/link";

import { PAGE_CLOSE_ATTRIBUTE } from "@/lib/page-close";
import { LEGAL_NAV, PRIMARY_NAV } from "@/lib/site-nav";

/**
 * The link shell shared by both rows.
 *
 * 44×44 is the floor including on desktop (MASTER.md §8), and `min-w-11` with a
 * left-aligned label gets it without padding the text off its column — a short
 * label like "Terms" is 40px of glyphs in a 44px box. Text controls take the
 * `--thermal-4` shift rather than a background lift (§7).
 */
const FOOTER_LINK =
  "inline-flex min-h-11 min-w-11 items-center text-sm text-text-secondary " +
  "transition-colors duration-[var(--dur-fast)] hover:text-thermal-4";

/**
 * The page's last element.
 *
 * A server component: it holds no state, and the copyright year is then read
 * from the server's clock once rather than being reconciled against the
 * visitor's on hydration.
 *
 * `relative z-10` puts it in the same stacking context as the Acts, over the
 * fixed canvas. It is opaque `--surface-0` — the same near-black the canvas
 * clears to, so the bottom of the page closes without a visible seam (§2.3).
 *
 * Visual contract: docs/design-system/MASTER.md §3–§4.
 */
export function SiteFooter() {
  return (
    <footer
      // Marked so the canvas can tell how much of its frame this covers: it
      // scrolls up over the fixed scene rather than arriving below it, and the
      // Lineup's hotspots have to be withdrawn as it passes them.
      {...{ [PAGE_CLOSE_ATTRIBUTE]: "" }}
      className="relative z-10 border-t border-[var(--border-structural)] bg-surface-0 px-6 pt-[var(--space-8)] pb-[var(--space-6)] sm:px-12 lg:px-16"
      style={{
        // The page's bottom edge on a phone is under the home indicator unless
        // it is padded out of the way. `viewportFit: "cover"` in layout.tsx is
        // what makes this resolve to anything.
        paddingBottom: "calc(var(--space-6) + env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex flex-col gap-[var(--space-6)] lg:flex-row lg:items-start lg:justify-between">
        {/* The mark alone. The tagline belongs to the Act 1 lockup, where the
            wide mono tracking against the tight display type is the brand's
            core typographic contrast (§3.2); repeated down here it is the same
            sentence said twice in one page. */}
        <Link
          href="/"
          // `self-start` because the column stretches its items: left to
          // stretch, the mark's hit area runs the full width of the footer and
          // a click anywhere along that band navigates home.
          className="brand-mark inline-flex min-h-11 items-center self-start text-lg text-text-primary"
        >
          VANTAK
        </Link>

        {/* Both navs are labelled: two unlabelled lists inside one landmark are
            two lists a screen reader user cannot tell apart. */}
        <nav aria-label="Footer">
          <ul className="flex flex-col gap-2 sm:flex-row sm:gap-6">
            {PRIMARY_NAV.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className={FOOTER_LINK}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mt-[var(--space-6)] flex flex-col gap-2 border-t border-[var(--border-structural)] pt-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Muted is the dimmest text on this page — 5.95:1, the floor (§2.2).
            Set at `small` rather than the 11px HUD step, which §3.1 reserves
            for short non-prose labels. */}
        <p className="text-sm text-text-muted">
          © {new Date().getFullYear()} VANTAK. Fictional outfitter. Nothing here
          is for sale.
        </p>

        <nav aria-label="Legal">
          <ul className="flex gap-2 sm:gap-6">
            {LEGAL_NAV.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className={FOOTER_LINK}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
