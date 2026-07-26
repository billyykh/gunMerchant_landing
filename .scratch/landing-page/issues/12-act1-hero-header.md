# 12 — Act 1 Hero DOM + Header

**What to build:** The Act 1 Hero DOM layer over the canvas — full-screen brand type and tagline ("VANTAK" / "Thermal Hunting Specialists"), a subtle scroll hint, and the site header (logo, 3–4 placeholder nav links, search trigger wired to the command palette, cart icon with a static item-count badge). Header is transparent over the hero and blurs/backs once the page scrolls.

**Blocked by:** 09 — Catalog fixture + search command palette, 11 — Persistent canvas + scroll spine + Assembly (placeholder Parts)

**Status:** ready-for-agent

- [ ] Brand name and tagline render full-screen on load, above the canvas, correctly composed with the Exploded placeholder Parts behind them
- [ ] Subtle scroll-hint indicator visible in Act 1
- [ ] Header renders logo, nav links, search trigger, and cart icon with static badge count
- [ ] Header search trigger opens the ticket-09 command palette
- [ ] Header is transparent at the top of the page and gains a blurred background once scrolled
- [ ] Header and Hero DOM fully readable/usable on both desktop and mobile viewport widths

## Design

Contract: `docs/design-system/MASTER.md` §3 (Typography), §7 (Header).

**`src/app/page.tsx` already holds the Act 1 Hero DOM** — brand lockup, tagline, and scroll hint, landed with ticket 08 so the token system could be verified before the 3D layer existed. Extend that file; do not start over. The utility classes `.brand-lockup`, `.brand-tagline`, and `.hud-label` are defined in `globals.css`.

- [ ] Brand lockup uses `.brand-lockup` — Space Grotesk 700, `clamp(3.5rem, 11vw, 9rem)`, `letter-spacing: -0.04em`. The negative tracking is what makes it read as a mark rather than a word.
- [ ] Tagline uses `.brand-tagline` — JetBrains Mono, uppercase, `0.32em` tracking. The wide tracking against the tight lockup is the core typographic contrast of the brand; do not normalise either.
- [ ] Header is fixed, 64px tall, fully transparent with no border over Act 1
- [ ] Past `scrollY > 24` it crossfades over `--dur-base` to `rgba(5,5,6,0.72)` + `backdrop-filter: blur(12px)` + 1px bottom border `rgba(255,255,255,0.08)`
- [ ] Nav links: DM Sans 500, 14px, `--text-secondary`, hover `--thermal-4` over `--dur-fast`
- [ ] Search trigger is a button showing the `⌘K` / `Ctrl K` hint inline — **not** a fake input (see ticket 09)
- [ ] Cart icon is `lucide-react`, 44×44px hit area, badge is a pill with `--thermal-3` background and `--thermal-6` numerals
- [ ] **Cart count is exposed to screen readers as text** (`aria-label="Cart, 3 items"`) — never conveyed by the badge shape/colour alone
- [ ] Scroll hint pairs a `--gradient-thermal` 1px rule with a `.hud-label`; it is `aria-hidden` (decorative, and the page scrolls regardless)
- [ ] Mobile: nav collapses to a sheet, display step floors at 3.5rem, safe-area insets respected for the fixed header

