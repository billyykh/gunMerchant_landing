# 12 — Act 1 Hero DOM + Header

**What to build:** The Act 1 Hero DOM layer over the canvas — full-screen brand type and tagline ("VANTAK" / "Thermal Hunting Specialists"), a subtle scroll hint, and the site header (logo, 3–4 placeholder nav links, search trigger wired to the command palette, cart icon with a static item-count badge). Header is transparent over the hero and blurs/backs once the page scrolls.

**Blocked by:** 09 — Catalog fixture + search command palette, 11 — Persistent canvas + scroll spine + Assembly (placeholder Parts)

**Status:** done

- [x] Brand name and tagline render full-screen on load, above the canvas, correctly composed with the Exploded Parts behind them
- [x] Subtle scroll-hint indicator visible in Act 1
- [x] Header renders logo, nav links, search trigger, and cart icon with static badge count
- [x] Header search trigger opens the ticket-09 command palette
- [x] Header is transparent at the top of the page and gains a blurred background once scrolled
- [x] Header and Hero DOM fully readable/usable on both desktop and mobile viewport widths

## Design

Contract: `docs/design-system/MASTER.md` §3 (Typography), §7 (Header).

**`src/app/page.tsx` already holds the Act 1 Hero DOM** — brand lockup, tagline, and scroll hint, landed with ticket 08 so the token system could be verified before the 3D layer existed. Extend that file; do not start over. The utility classes `.brand-lockup`, `.brand-tagline`, and `.hud-label` are defined in `globals.css`.

- [x] Brand lockup uses `.brand-lockup` — Space Grotesk 700, `clamp(3.5rem, 11vw, 9rem)`, `letter-spacing: -0.04em`. The negative tracking is what makes it read as a mark rather than a word.
- [x] Tagline uses `.brand-tagline` — JetBrains Mono, uppercase, `0.32em` tracking. The wide tracking against the tight lockup is the core typographic contrast of the brand; do not normalise either.
- [x] Header is fixed, 64px tall, fully transparent with no border over Act 1
- [x] Past `scrollY > 24` it crossfades over `--dur-base` to `rgba(5,5,6,0.72)` + `backdrop-filter: blur(12px)` + 1px bottom border `rgba(255,255,255,0.08)`
- [x] Nav links: DM Sans 500, 14px, `--text-secondary`, hover `--thermal-4` over `--dur-fast`
- [x] Search trigger is a button showing the `⌘K` / `Ctrl K` hint inline — **not** a fake input (see ticket 09)
- [x] Cart icon is `lucide-react`, 44×44px hit area, badge is a pill with `--thermal-3` background and `--thermal-6` numerals
- [x] **Cart count is exposed to screen readers as text** (`aria-label="Cart, 3 items"`) — never conveyed by the badge shape/colour alone
- [x] Scroll hint pairs a `--gradient-thermal` 1px rule with a `.hud-label`; it is `aria-hidden` (decorative, and the page scrolls regardless)
- [x] Mobile: nav collapses to a sheet, display step floors at 3.5rem, safe-area insets respected for the fixed header

## Resolution

`src/components/site-header.tsx`, `src/components/ui/sheet.tsx`, `src/hooks/use-scrolled-past.ts`, and the Act 1 section of `src/app/page.tsx`. 20 new tests, 104 across the suite.

### The scrolled state is a boolean, and it is in the DOM

`useScrolledPast(24)` reads through `useSyncExternalStore` rather than an effect writing state. The scroll position is genuinely external and differs between server and client, and `false` is the honest server snapshot for a document that has never been scrolled — mirroring it into state instead hydrates transparent and then corrects itself in a visible flash.

It returns a boolean, not a pixel value, because a header that re-renders on every scroll frame is exactly the jank this page is built around. Crossing a threshold happens twice.

The result lands on `data-scrolled`, and the stylesheet keys off that. Two things follow: the crossfade is a CSS transition rather than a re-render, and the tests can assert the state without asserting class names — jsdom computes no styles, so asserting classes would only restate the implementation. The actual `rgba(5,5,6,0.72)` / `blur(12px)` / `rgba(255,255,255,0.08)` values were confirmed against MASTER.md §7 in the browser.

One test covers a case the spec does not mention: a visitor who reloads mid-page must not get a transparent header floating over their content. The hook reads its mounted position rather than assuming the top.

### The sheet is a separate primitive

`ui/sheet.tsx` is the same Base UI dialog the palette uses, anchored to an edge instead of centred. It is not a variant of `dialog.tsx`: that component hardcodes its own centring transform, and overriding it from outside is how a component ends up with two layout systems fighting each other.

### Two faults the unit tests could not see

**Base UI's close control is a button, and these were links.** `SheetClose render={<Link/>}` warns in the browser console that an anchor is being treated as a button; setting `nativeButton={false}` silences the warning but strips the anchor's link role, taking the nav items out of the accessibility tree as links entirely. Neither is acceptable, so the sheet holds its own open state and the links close it from `onClick`. jsdom passed the first version silently — the console warning is what caught it.

**The 44x44 hit area was not 44x44.** `size-11` sets it, but flex shrank the menu control to 41px on a 375px viewport. Measured in the browser, not assumed; the icon controls now carry `shrink-0`.

### The search trigger collapses on narrow viewports

At 375px the trigger's label and shortcut hint could not sit beside a wordmark, a cart and a menu without wrapping `Ctrl K` mid-word. Below `sm` it is icon-only, with the name kept in the accessibility tree via `sr-only sm:not-sr-only` — a control announced as nothing but "button" would not be a saving. The shortcut hint is dropped rather than shrunk: a touch device has no Ctrl key, so advertising one is noise. MASTER.md §7 asks for the hint inline on the trigger, not for it at every width.

### Where the header is mounted

`page.tsx`, not `layout.tsx`. The layout also wraps `/styleguide`, which is a design reference sheet rather than part of the site; a fixed 64px overlay across the top of it would obscure its own content to no purpose. Revisit if a second real route ever appears.

Verified: 104/104 tests pass, `npx tsc --noEmit` clean, `npm run lint` clean, `npm run build` succeeds. Checked in the browser at 1280x700 and 375x812 — transparent header over Act 1, spec-exact background once scrolled, nav collapsing to the sheet, 44x44 controls, and no horizontal overflow.

**Not verified here:** the Act 1 canvas framing is solved for a wide viewport, and three.js fixes the *vertical* FOV, so a portrait phone crops it hard. Ticket 16 owns responsive framing.

### Code review

Both review axes ran; the findings that stood up were fixed rather than argued with.

**The safe-area insets were dead code.** `env(safe-area-inset-*)` resolves to `0` unless the document opts in with `viewportFit: "cover"`, which `layout.tsx` did not. The criterion had been ticked off on the strength of the property being present. `viewportFit` is now set, the header pads its *top* inset as well as its sides — the one that matters for a bar pinned to `top: 0` — and the bar grows by the inset instead of squeezing its 64px of content into it.

**Colours went through literals.** §10 requires every colour to resolve through a token; `rgba(5,5,6,0.72)` was `--surface-0` retyped by hand. Now `bg-surface-0/72` and `border-b-white/8`, verified in the browser to still compute to the exact §7 values.

**4px between touch targets.** `gap-1 sm:gap-2` tightened the spacing at precisely the breakpoint where the controls are touched. §8's 8px is a floor, not a default.

**A 10px badge.** `text-[0.625rem]` invented a step below §3.1's 11px floor.

Also: the icon-control class string was extracted rather than repeated three times, the `scrollTo` test helper moved to `src/test-utils/`, and the unused `SheetClose` export was deleted with a note on why it cannot be used here.

Two deviations were **written into MASTER.md §7 instead of being defended in code comments**, since the contract says to raise a conflict rather than improvise around it: the search trigger collapsing below `sm`, and icon-only controls taking the background lift on hover despite having no border.

Rejected: the reviewer's suggestion to fold the icon controls into `ui/button.tsx`. The header's controls are the only ones of this shape so far, and a shared variant built from one caller is a guess at the second.
