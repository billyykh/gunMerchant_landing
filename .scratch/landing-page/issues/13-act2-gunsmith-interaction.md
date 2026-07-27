# 13 — Act 2 Gunsmith interaction

**What to build:** Interactive inspection of the assembled Hero Rifle in the Gunsmith View. Hovering a placeholder Part shows a HUD Callout (leader line + label); clicking opens a Detail Panel populated from the ticket-09 catalog fixture (name, specs, placeholder price, CTA), closable via a close control, click-away, or Escape. The assembled rifle parallaxes gently with mouse movement.

**Blocked by:** 11 — Persistent canvas + scroll spine + Assembly (placeholder Parts), 09 — Catalog fixture + search command palette

**Status:** done

- [x] Hovering a Part in the Gunsmith View shows a HUD Callout (leader line + name) anchored to that Part
- [x] Clicking a Part opens a Detail Panel with that Part's name/specs/price/CTA sourced from the catalog fixture
- [x] Detail Panel closes via a close control, clicking away, or pressing Escape
- [x] Assembled Hero Rifle parallaxes subtly with mouse movement in the Gunsmith View (no orbit/drag controls)
- [x] On touch devices, tap substitutes for hover to trigger Callout and Detail Panel
- [x] Detail Panel and Callout are keyboard-reachable/operable, not mouse-only

## Design

Contract: `docs/design-system/MASTER.md` §5 (HUD language), §7 (Callout, Detail Panel). This ticket builds the two components the whole HUD vocabulary rests on — get them right and ticket 14 is a reuse.

**Callout**

- [x] Label uses `.hud-label` (mono, uppercase, 11px, `0.08em`, `--thermal-4`) over `--surface-1` at 90%, 1px `--border-hud` border, with `.hud-brackets` corner marks
- [x] Leader line is 1px painted with `--gradient-thermal`, terminating in a 3px anchor dot at the Part
- [x] Enters `opacity 0→1` + `y 6px→0` over `--dur-base` / `--ease-out`; exits over `--dur-exit`
- [x] Optional index prefix reads `03/08` in the same mono style

**Detail Panel**

- [x] Right-side panel, width `min(420px, 92vw)`, `--surface-1`, 1px left border `--border-hud`, corner brackets top-left and bottom-left only — **brackets, never a closed frame**
- [x] Slides `translateX(24px)→0` + fade over `--dur-slow` / `--ease-out`; exits over `--dur-exit`
- [x] Exactly **one** scan sweep on open — a single 400ms downward gradient pass, never looped. Infinite animation is reserved for loading indicators.
- [x] Contents in order: category (mono, `--thermal-4`), product name (h2, Space Grotesk), spec list (mono `.tabular`, thin `--thermal-2` rules between rows), placeholder price, primary CTA (filled `--thermal-3`, `--thermal-6` text)
- [x] Focus is trapped while open and returned to the triggering element on close; use the Radix primitive's `aria-modal` semantics rather than hand-rolling
- [x] Mobile: becomes a bottom sheet at 92vh

**Both**

- [x] Only one glowing element (`--glow-thermal`) on screen at a time — two means the hierarchy is broken
- [x] Keyboard equivalence for 3D hover: Parts are tabbable in Detail Panel trigger order and open the same panel
- [x] No red text below 24px

## Resolution

`src/lib/part-hotspots.ts`, `src/lib/callout-placement.ts`, `src/lib/parallax.ts`, `src/hooks/use-pointer-ndc.ts`, `src/components/hud/callout.tsx`, `src/components/hud/detail-panel.tsx`, `src/components/scene/hotspot-channel.ts`, `src/components/scene/gunsmith-hud.tsx`, plus the projection and parallax passes added to `hero-rifle.tsx`. 71 new tests, 175 across the suite.

### The HUD is DOM, and the canvas only tells it where to stand

The canvas is `aria-hidden`, and a 3D raycast has no accessible name, no tab stop and no focus ring. A HUD drawn inside the canvas would be invisible to everyone not using a mouse, and §8 asks for the opposite: Parts tabbable in Detail Panel trigger order, opening the same panel. So every Part gets a real `<button>` in the DOM — hover, tap, click, Tab and the focus ring all arrive from the platform rather than being rebuilt on top of a raycast, and `aria-haspopup="dialog"` says what it does before it is pressed.

What only the canvas knows is *where*. `hotspot-channel.ts` carries the two directions of that traffic differently, because they are different kinds of fact:

- **Positions** change every frame and change nothing about what is on the page. The DOM nodes register themselves, and `useFrame` writes their transforms directly. Through React state this would re-render the HUD sixty times a second to move eight labels.
- **Availability** changes twice in the whole page and changes what exists — outside the Gunsmith hold there are no hotspots and no tab stops. That one is a subscription, and `setAvailable` notifies only on change, because it is also called sixty times a second.

Anchors are measured from the model (`Box3` centre, converted into the Part's own local space once at bind) rather than authored as eight vectors. The GLB is the source of truth for where anything on the rifle is; hand-written anchors drift silently the first time it is re-exported. Local, not world, because the rifle moves — the root travels during the drop and each Part travels during Assembly.

### The Callout leans away from the subject

§5 asks for a leader line and does not say it is horizontal. It has to not be. A rifle photographed side-on fills the frame edge to edge, so a horizontal leader lays every label across the barrel — and a dark label on a dark barrel is the one place on this page where contrast is not the palette's to give.

The lean direction needs no measuring. The camera looks *at* the subject, so the subject's centre projects to the NDC origin at every Act and every framing: an anchor above the origin leans up, one below leans down. `placeCallout` decides side, rise, and whether to draw at all in one place, and the leader's own geometry lives beside it so `CALLOUT_REACH` — the distance that decides when a label must fold back from the viewport edge — is derived from the leader rather than kept in step with it by hand.

Culling matters more than it looks: a hidden hotspot is set `hidden`, not merely faded, because a tab stop anchored to a Part that is off-screen is a control pointing at nothing.

### Exits are half the contract

Both the Callout and the Detail Panel carry `open` alongside their Part rather than going to `null` when they close. Dropping the Part unmounts the element mid-exit, so `--dur-exit` never plays — the panel's `data-closed:animate-out` was unreachable, and the Callout had no exit at all. They fall away only when another Part replaces them.

The Callout's enter/exit is a CSS transition on `data-open` rather than a mount animation, which is also what makes the reduced-motion path honest: §6.3 asks for a `--dur-fast` cross-fade, and the global reduced-motion rule squashes every duration to `0.01ms`. The Callout overrides it for opacity alone, and transforms no distance. The panel drops its slide under `motion-safe:` and keeps the fade.

### Parallax leans the camera, not the rifle

Applied after `lookAt`, along the camera's own right and up axes, so it slides the frame instead of swinging it and needs no knowledge of which Act's angle is currently set. Moving the camera and leaving the target is what produces the parallax — near and far read slightly different shifts. `PARALLAX_REACH` is 0.015 against a camera sitting ~1.0 out, about 1.5%: enough to have parallax, far too little to recompose a shot the ticket says must not be orbitable.

The pointer is read from `window`, not from React Three Fiber's `state.pointer`, which only updates from events reaching the canvas — and the whole page sits over it. Damping is expressed as a time constant rather than a fraction per frame, so the same gesture feels the same on a 120Hz display as on a 60Hz one.

### Verified

175/175 tests, `npx tsc --noEmit`, `npm run lint`, `npm run build` all clean. In the browser at 1280×800 and 375×812: eight hotspots projected onto their Parts and moving with the camera, 44×44 each, Callout on hover and on focus with the amber ring, panel measured at exactly 420px / `--surface-1` / 1px `--border-hud` left / 12px `--thermal-3` brackets / CTA `--thermal-3` on `--thermal-6` at 44px / close control 44×44, `hud-scan` computing to `1` iteration over `0.4s`, Escape returning focus to the hotspot that opened it, bottom sheet at 747px on an 812px viewport (91.99vh), and no horizontal overflow. No console warnings.

**Base UI does not set `aria-modal`.** §7 asks for `aria-modal` semantics from the primitive; Base UI marks every sibling of the panel `aria-hidden="true"` instead. Same guarantee reached the other way round, and still the primitive's job — recorded in §7 rather than worked around.

**Not fixed here: most Parts are unreachable on a portrait phone.** Measured at 375×812, five of the eight hotspots cull because the rifle itself is off-frame — three.js fixes the *vertical* FOV, so a portrait viewport crops the horizontal composition hard. The hotspots are behaving correctly; the framing is wrong. This is the same defect ticket 12 flagged for Act 1, and it is ticket 16's to fix. Ticket 16 must re-check hotspot coverage on portrait once the framing is responsive, because "the page renders" is not the same test as "every product is reachable".

**Known and left alone:** the anchor dot for a Part whose neighbour is nearly behind it can sit within a few pixels of another. At the Act 2 framing the eight are well separated; if a future framing brings them closer, the answer is spacing the hotspots, not shrinking the 44×44 target.

### Code review

Both axes ran. Two findings landed on both, which is usually the sign they are real.

**The exits never played.** Both reviewers traced it: the Detail Panel returned `null` above its own `Dialog.Root` as soon as the entry cleared, and the entry cleared in the same render as `open=false`, so Base UI never got to render the closed state; the Callout unmounted on `pointerleave`. Fixed as described above. This is the finding worth having — every duration token was correct and none of them ran.

**The Callout label was the wrong type.** I had set the product name in the body face at 14px and written a paragraph into §7 justifying it. The Spec reviewer named it plainly: the contract already assigns the `hud` step to Callout labels in §3.1, my new paragraph contradicted a row it did not amend, and only the shape of my code required it. The paragraph is gone and the label is `.hud-label`. It reads better as instrumentation than the version I argued for.

Also fixed: `text-thermal-4/70` on the index prefix, which took an 11px label below the ≥7:1 that permits 11px at all (§3.1) — both halves now sit at full `--thermal-4` and the gap does the separating; the label border was `--border-hud` (30%) where §7 Callout asks for 40%; `.hud-scan` mixed raw `rgba(249,115,22,…)` instead of `--thermal-4` (§10); the scan sweep travelled a full panel height unclipped inside a scrolling panel, extending its scroll range while it ran; `<dt>` was left out of the spec list's mono face; the panel title was `text-2xl` where §3.1 sets h2 at `2rem`; `outline-none` sat on the element that is now the initial focus target; parallax damping was a per-frame fraction, so it converged twice as fast at 120Hz; `hotspotIndexLabel` computed a pad width for a list fixed at eight; and `popupRef` used vocabulary `CONTEXT.md` explicitly tells us to avoid for the Detail Panel. "Hotspot" was new vocabulary and is now in the glossary.

Rejected: **`rounded-md` flagged as breaking the 2px radius rule** — `--radius-md` *is* 2px in `globals.css`; the token resolves correctly. And **the backdrop called scope creep** — the panel has to close on click-away (§7), which is what the backdrop is; the dimming is deliberate at 40% so the rifle stays legible behind the panel that describes it, against the 60% the mobile nav sheet uses to hide the page entirely.

Left as it stands: `.hud-brackets-left` overlaps `.hud-brackets` by about ten lines of CSS with different values. They are two bracket arrangements, not one with a parameter — a panel whose right edge is the edge of the viewport cannot take a diagonal pair, since one mark would land in open space and the other off-screen. Folding them together would be a shared class that has to be told which of its own halves to draw.
