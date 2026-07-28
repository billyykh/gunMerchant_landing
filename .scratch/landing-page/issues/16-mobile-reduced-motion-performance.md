# 16 — Mobile + reduced-motion + performance pass

**What to build:** The full three-Act experience holds up on mobile (reduced rendering quality, tap-first interaction already covered by 13/14) and for motion-sensitive visitors (static composed views), and the page holds smooth frame rates on a mid-range laptop across all three Acts.

**Blocked by:** 14 — Act 2→3 drop + Act 3 Lineup interaction, 15 — Footer

**Status:** ready-for-human

- [x] Mobile viewport renders all three Acts with reduced device pixel ratio and simplified lighting/effects
- [x] `prefers-reduced-motion` shows the static composed view per Act (Hero, Gunsmith, Lineup) with no scrub animation, across the whole page not just the Scene State module
- [x] Verified smooth frame rate through all three Acts on a mid-range laptop (no dropped-frame stutter during Assembly/drop scrubbing) — *see the caveat under Verified: the machine was faster than the target*
- [ ] Verified acceptable frame rate/responsiveness on a representative mobile device or throttled profile — **not done, see Not verified**
- [x] All DOM UI (header, search palette, Detail Panels, footer) confirmed operable end-to-end by keyboard only

## Design — this ticket is the delivery gate

Contract: `docs/design-system/MASTER.md` §8 (accessibility floor), §9 (responsive), §10 (checklist). Walk §10 item by item; this ticket does not close until every line passes.

**Responsive**

- [x] Breakpoints behave per §9: nav collapses to a sheet below 640px, Detail Panel becomes a 92vh bottom sheet, DPR capped at 1.5, lighting simplified
- [x] No horizontal scroll at any width — verify at 375px and 1280px
- [x] Zoom is never disabled (`user-scalable=no` is forbidden)
- [x] Safe-area insets respected for the fixed header and the bottom sheet — authored; cannot be exercised without a notched device

**Accessibility floor**

- [x] Every text colour measured against its actual background; body ≥16px and ≥4.5:1
- [x] **No red text below 24px anywhere on the page**
- [x] Focus ring visible and amber on every interactive element, never removed. Verified by Tab.
- [ ] Touch targets 44×44px with 8px spacing, including desktop icon buttons — **passes everywhere except the projected hotspots; see Does not pass**
- [x] Canvas `aria-hidden`; the Act narrative and all product content readable as DOM text
- [x] Nothing conveyed by colour alone (cart badge, Callout state, availability)

**Motion & performance**

- [x] Reduced-motion path renders a complete, usable page — not a degraded one
- [x] Nothing animates `width`, `height`, `top`, or `left`
- [x] No looping animation outside loading indicators
- [x] Only one glowing element on screen at a time in every Act
- [x] No layout shift when the ≈17.7 MB of 3D assets resolve (CLS < 0.1)

**Hygiene**

- [x] No raw hex in components — every colour resolves through a token
- [x] All icons are SVG (`lucide-react`); no emoji used as icons

## Resolution

`src/lib/camera-framing.ts`, `src/lib/scene-palette.ts`, `src/hooks/use-media-query.ts`, a `HotspotList` branch in `hotspot-layer.tsx`, `usePageCloseInView`, and fixes across the header, the command palette, the Detail Panel and `page.tsx`. 28 new tests, 246 across the suite.

### Responsive framing was the ticket

A three.js perspective camera fixes its **vertical** field of view. A narrower window therefore does not show less top and bottom — it shows less left and right, and every composition here is wide: a 1.16 m rifle photographed side-on in Acts 1 and 2, a row of five objects in Act 3. Uncorrected, a 375×812 phone sees a horizontal field of view of 12.2° against the 44.3° the Act was composed at. That is a few centimetres of barrel.

`fitFraming(fov, aspect)` holds the width the composition was authored with. It widens the vertical field of view first, because widening is free and leaves the camera where the composition put it, and stops at 70° — past that, perspective bows straight edges and the near plane starts eating the subject. Whatever width the cap could not buy is paid for by moving the camera back along its own view direction, which costs nothing but distance. The reference is 16:9, the frame each pose in `scene-state.ts` was tuned in, so a 16:9 window gets exactly what was authored and a wider one is left alone to gain the side room §9 promises at `xl`.

**The dolly pulled the Lineup into Act 1.** Ticket 14 rejected gating the Gear Items on the grounds that they sit far outside the Act 1 and 2 framings. That was true at the time and responsive framing ended it — on portrait the row walked into the bottom of the Act 1 frame. They are now hidden until `dropProgress > 0`, which is also four draw calls and ~46k triangles a phone no longer pays for across two thirds of the page.

### Eight hotspots do not fit on a phone

Measured at 375×812: the eight Parts project into a 230px span with the closest pair of anchors **9px apart**, against the 52px that 44×44 targets with 8px between them require. The receiver's target almost entirely covers the magazine's, so a finger cannot choose and whichever is later in the DOM wins.

This is geometry, not a tuning error. The composition scales with the frame; the 44px floor does not. And it cannot be fixed by spreading the Parts, because the hotspots are offered in the **assembled** pose — the receiver and the magazine are 3 cm apart on a real rifle.

So below `sm` the model stays the picture and the catalog becomes a list: a bottom bar of chips, same order, same names, same Detail Panel, numbered for the Parts and unnumbered for the Lineup exactly as the Callouts are. §9 downscales rendering, never content. No Callout there — a leader line from a chip at the bottom of the screen to a Part it is not beside is an arrow to nowhere.

**The bar had ticket 15's bug from the other side.** Fixed to the bottom of the window is where the footer arrives, so at the page's end the Lineup's chips sat over the footer's own links while the objects they named were behind that same opaque surface. `usePageCloseInView` withdraws it, the reactive twin of the `useOccludedBottom` the canvas already reads per frame.

### Contract violations found by measuring

- **The primary button failed contrast on hover.** §7 shifts the fill to `--thermal-4`; §2.2 records `--thermal-6` on the resting red as 4.59:1. On the orange it is **2.67:1**. A control that meets the floor only until you point at it does not meet it, so the label turns over with the fill — `--surface-0` on that orange is 6.99:1.
- **The header's own controls were under the floor.** The brand link was 62×28 and each nav link 35×18. The inline nav is hidden below `md`, but `md` starts at 768px and that is a tablet in portrait. Both now carry 44px boxes; the row's `gap-6` was already well past the 8px floor.
- **The command palette was built for a mouse.** 32px rows and a 14px input. The rows are now 44px, and the input is 16px below `sm` — iOS Safari zooms the page in on focus for anything smaller, and §9 forbids taking zoom away, so the fix is to give it nothing to correct.
- **"Scroll to assemble" was still showing under reduced motion**, where nothing assembles. Hidden from the media query rather than from JS, so `page.tsx` stays a server component.
- **Four raw hex light colours** (§10). three.js cannot read a CSS custom property, so they are transcriptions in `scene-palette.ts` — and `scene-palette.test.ts` parses `globals.css` and fails if any has drifted from the token it claims to be. A transcription that is never checked against its source is a hex literal with a comment attached.

### Code review

Ran and returned no findings, but two of its statements were wrong on inspection — it reported that "only the Callout glows" when the codebase contains no `box-shadow` at all, and that the media-query subscription updates before the first render when `useSyncExternalStore` renders the server snapshot first. Both hazards it was asked about and did not address were then checked by hand: the compact hotspot list's collision with the footer was found that way and fixed above.

The remaining known consequence of the server snapshot is that the first client commit on a phone uses the desktop branch — four lights and `dpr={[1,2]}` — before flipping. Nothing is on screen at that point (the canvas has not settled, so no hotspots are offered), but it does cost one extra drawing-buffer allocation at load on the least capable device. Left as it is: the alternatives are guessing the viewport on the server or blocking the first paint.

## Does not pass

**Touch targets on the projected hotspots.** At 1280×800 the closest pair of Part anchors is **28px** apart, against the 52px §7/§8 ask for. The same geometry as the mobile case: eight anchors on one assembled rifle. Below `sm` this is solved outright by the list; on a pointer viewport the overlay is the design's whole idea (§5's leader lines and Callouts) and removing it would gut the page to satisfy a rule aimed at fingers.

What is true on a pointer device: each hotspot's own 3px dot is unambiguous, hovering names the Part before any click, and every Part is reachable by Tab in order. 28px also clears WCAG 2.5.8's 24px minimum, which exempts targets whose position is determined by the content — these are the Parts' own positions.

This needs a human decision, which is why the ticket is `ready-for-human` rather than `done`: either §7/§8 gains an explicit exemption for scene-anchored targets, or Act 2 changes so that fewer Parts are offered at once.

## Not verified

**A real mobile device or a throttled CPU profile.** The frame-rate figures below were taken at a 375×812 viewport on desktop hardware. That confirms the DPR cap and the halved light count are in effect and cost nothing, and it says nothing about a phone's GPU. The preview browser exposes no CPU or GPU throttling.

**The `prefers-reduced-motion` CSS block.** The JS path was verified end to end by temporarily forcing the flag and walking all three Acts — Act 1 shows the rifle assembled rather than a frozen Exploded pile (§6.3), Acts 2 and 3 show their stills, and both interaction lists are offered, so reduced motion removes animation and not functionality. The `@media (prefers-reduced-motion: reduce)` rules answer to the browser's own preference, which cannot be emulated here, so they were read rather than exercised.

**Safe-area insets.** Authored on the header, the footer and the bottom sheet; a desktop browser resolves every `env(safe-area-inset-*)` to 0.

## Verified

246/246 tests, `npx tsc --noEmit`, `npm run lint`, `npm run build` all clean.

**Frame rate.** 3,998 consecutive frames sampled across a full scroll through all three Acts at 1440×900: median 6.9 ms, p99 7.1 ms, worst frame 13.9 ms, and **not one frame over 16.7 ms**. On a 375×812 viewport, 2,498 frames with a worst of 7.5 ms. The machine is a 144 Hz desktop, not the mid-range laptop the acceptance line names, so read this as "nothing in the scrub is expensive" rather than as a result for the target hardware.

**CLS 0.0000** across load and asset resolution, against the 0.1 budget.

**Contrast.** A scripted pass over every text-bearing leaf element, comparing computed colour against the nearest painted background at the WCAG floor for its size and weight: zero failures on Act 1, with the command palette open, and with a Detail Panel open. Zero red text below 24px anywhere.

**Responsive.** At 375: effective DPR 1.4987 against the 1.5 cap, no horizontal scroll, Detail Panel 747px against 92vh of 812, palette rows 44px and input 16px, list chips 44px tall and 8px apart. At 1280: no horizontal scroll, projected overlay restored, palette back to its compact desktop sizing.

**Keyboard.** Tab through the header confirmed `:focus-visible` on each control with a 2px `#FBBF24` outline at 2px offset — verified by pressing Tab, not by calling `.focus()`. The footer was verified the same way in ticket 15, and both Detail Panel paths in tickets 13 and 14.

**Motion.** No `transition` or `animation` touches `width`, `height`, `top` or `left` anywhere in the stylesheet or the components. `hud-scan` computes to one iteration at 400 ms. The codebase declares no `box-shadow` at all, so the one-glowing-element rule holds trivially — §4 makes the thermal glow optional, and nothing currently takes it.

**At the page's end on a phone**, all seven footer links return themselves from `elementFromPoint`, and no interaction bar is up.
