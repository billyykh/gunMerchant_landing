# 16 — Mobile + reduced-motion + performance pass

**What to build:** The full three-Act experience holds up on mobile (reduced rendering quality, tap-first interaction already covered by 13/14) and for motion-sensitive visitors (static composed views), and the page holds smooth frame rates on a mid-range laptop across all three Acts.

**Blocked by:** 14 — Act 2→3 drop + Act 3 Lineup interaction, 15 — Footer

**Status:** ready-for-agent

- [ ] Mobile viewport renders all three Acts with reduced device pixel ratio and simplified lighting/effects
- [ ] `prefers-reduced-motion` shows the static composed view per Act (Hero, Gunsmith, Lineup) with no scrub animation, across the whole page not just the Scene State module
- [ ] Verified smooth frame rate through all three Acts on a mid-range laptop (no dropped-frame stutter during Assembly/drop scrubbing)
- [ ] Verified acceptable frame rate/responsiveness on a representative mobile device or throttled profile
- [ ] All DOM UI (header, search palette, Detail Panels, footer) confirmed operable end-to-end by keyboard only

## Design — this ticket is the delivery gate

Contract: `docs/design-system/MASTER.md` §8 (accessibility floor), §9 (responsive), §10 (checklist). Walk §10 item by item; this ticket does not close until every line passes.

**Responsive**

- [ ] Breakpoints behave per §9: nav collapses to a sheet below 640px, Detail Panel becomes a 92vh bottom sheet, DPR capped at 1.5, lighting simplified
- [ ] No horizontal scroll at any width — verify at 375px and 1280px
- [ ] Zoom is never disabled (`user-scalable=no` is forbidden)
- [ ] Safe-area insets respected for the fixed header and the bottom sheet

**Accessibility floor**

- [ ] Every text colour measured against its actual background; body ≥16px and ≥4.5:1
- [ ] **No red text below 24px anywhere on the page** — `#DC2626` is 4.21:1 and fails AA. This is the single most likely violation; audit it explicitly rather than assuming.
- [ ] Focus ring visible and amber on every interactive element, never removed. Verify by Tab, not by calling `.focus()` — programmatic focus does not match `:focus-visible`.
- [ ] Touch targets 44×44px with 8px spacing, including desktop icon buttons
- [ ] Canvas `aria-hidden`; the Act narrative and all product content readable as DOM text
- [ ] Nothing conveyed by colour alone (cart badge, Callout state, availability)

**Motion & performance**

- [ ] Reduced-motion path renders a complete, usable page — not a degraded one
- [ ] Nothing animates `width`, `height`, `top`, or `left`
- [ ] No looping animation outside loading indicators
- [ ] Only one glowing element on screen at a time in every Act
- [ ] No layout shift when the ≈17.7 MB of 3D assets resolve (CLS < 0.1)

**Hygiene**

- [ ] No raw hex in components — every colour resolves through a token
- [ ] All icons are SVG (`lucide-react`); no emoji used as icons

