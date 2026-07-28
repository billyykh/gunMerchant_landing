# 15 — Footer

**What to build:** A minimal footer closing the page below the Lineup, with the brand mark and placeholder links, so the page ends deliberately instead of trailing off.

**Blocked by:** 08 — Next.js project scaffold + package install

**Status:** done

- [x] Footer renders brand mark and a small set of placeholder links
- [x] Footer is keyboard operable and readable on both desktop and mobile
- [x] Footer sits below all three Acts as the final element on the page

## Design

Contract: `docs/design-system/MASTER.md` §3–§4.

- [x] Background `--surface-0` with a 1px top border `--border-structural`; no shadow
- [x] Brand mark in Space Grotesk with the same `-0.04em` tracking as the Act 1 lockup, at a small size
- [x] Links: DM Sans, `--text-secondary`, hover `--thermal-4` over `--dur-fast`
- [x] Credits and legal microcopy use `.hud-label` or `--text-muted` (`#8A8A93`, 5.95:1 — the floor; nothing dimmer)
- [x] Vertical rhythm `--space-8`; 44×44px minimum link hit areas with 8px spacing
- [x] No red text below 24px

## Resolution

`src/components/site-footer.tsx`, `src/lib/site-nav.ts`, a `.brand-mark` component class in `globals.css`, and — because the footer covered part of the scene — `src/lib/page-close.ts`, `src/hooks/use-occluded-bottom.ts` and an `occludedBottom` on the Callout placement seam. 12 new tests, 224 across the suite.

### The primary nav is now one list

The header already rendered it twice, inline and inside the mobile sheet, with a comment about what two hand-maintained copies lead to. A third copy in the footer would have been the same mistake with a longer fuse, so `PRIMARY_NAV` moved to `src/lib/site-nav.ts` and all three placements read it. `LEGAL_NAV` is separate: those are obligations rather than merchandise and belong at the bottom of the page and nowhere else. Both footer navs are labelled — two unlabelled lists inside one landmark are two lists a screen reader user cannot tell apart.

`.brand-mark` was extracted at the same time. `-0.04em` is a property of the wordmark, not a decision each placement re-makes.

### No tagline down here

The first draft repeated "Thermal Hunting Specialists" under the footer mark, and `page.test.tsx` caught it: the phrase now matched twice. That was the right failure. The wide mono tracking against the tight display lockup is the brand's core typographic contrast (§3.2) and it belongs to the Act 1 hero; repeated in the footer it is the same sentence said twice on one page. The mark alone closes it.

### The footer covered two of Act 3's hotspots

Found in the browser, and the only interesting thing in this ticket. The canvas is fixed, full-viewport and never unmounts, so the footer rides up *over* the Lineup rather than arriving after it. At the bottom of the page the night-vision scope and the torch were behind an opaque surface while their hotspots were still live: a bare dot painted on the footer, and a tab stop that opens a Detail Panel describing something the visitor cannot see. Measured before the fix — anchors at y=604 and y=667 against a footer whose top edge was at 602.

Ticket 14 fixed the same class of defect at the Act boundary, keyed on `channel.setAvailable(false)`. That signal is derived from scroll progress, and scroll progress does not know a footer exists. It also could not be the fix here: the drone and the ammo box are still perfectly visible above the footer at the same moment, so this is per-hotspot, not per-Act.

It went through the seam that already owns exactly this decision. `placeCallout` culls anchors that leave the frame; the footer is simply another edge of the frame, so `Viewport` gained `occludedBottom` and the visibility test gained one more clause. No margin on it, unlike the frame edges: those are soft, and a Callout blinking as the camera breathes across them is worse than one held a little past the edge. The footer is a hard opaque edge, and a Callout half behind it is half a Callout. The existing `node.hidden` does the rest — a hotspot the visitor cannot see stops being a tab stop.

The measurement is a `data-page-close` marker on the footer, following `ACT_SECTION_ATTRIBUTE`: a constant exported from a `"use client"` file becomes a client *reference* when a server component imports it, and React renders the reference itself as the attribute name. Read on scroll and resize into a ref rather than per frame — `getBoundingClientRect` forces layout, and doing that sixty times a second to learn a number that only changes when the page moves is how a scroll-driven page starts dropping frames.

### Code review

Two findings stood up, both about coverage rather than behaviour.

**`useOccludedBottom` had no tests.** It is the one piece of new logic with a lifecycle: window listeners that outlive the component, a `ResizeObserver`, an early return when there is no closing surface (the `/styleguide` route mounts the scene without one). Five tests now cover the measurement, the clamp at zero, tracking across a scroll, listener removal on unmount, and the no-footer case.

**Nothing held the `data-page-close` contract together.** The attribute is written in one file and read in another, with the whole occlusion fix hanging off it; deleting it would have broken the cull silently and no test would have said so.

Two nits about comment phrasing were fair on one count — the `site-nav.ts` comment read as though three copies still existed — and reworded.

### Verified

224/224 tests, `npx tsc --noEmit`, `npm run lint`, `npm run build` all clean. In the browser at 1440×900: `--surface-0` background, 1px `rgba(255,255,255,0.1)` top border, no shadow, 96px top padding; brand mark Space Grotesk 18px at `--text-primary`; all seven links 44px tall with 24px between them; legal line `#8A8A93` at 14px; amber focus ring on keyboard traversal. At 375×812: no horizontal scroll, 44×44 targets, 8px apart. Console clean.

The occlusion was verified from both directions at the page bottom — the two hotspots behind the footer reported `hidden` and untabbable while the two above it stayed live, and scrolling back until the footer's top edge passed them brought all four back. 

**One correction to the first draft:** the brand link is `self-start`. Left to stretch in the mobile column its hit area ran the full 358px width of the footer, so a click anywhere along that band navigated home.

**For ticket 16:** the footer is 542px tall on a 375px viewport, which is airy but is what 44px targets at 8px spacing plus `--space-8` rhythm produce. Worth a look during the mobile pass, alongside the safe-area inset padding, which is authored but cannot be exercised in a desktop browser.
