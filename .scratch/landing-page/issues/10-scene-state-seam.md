# 10 — Scene State seam (pure module + tests)

**What to build:** The project's single primary seam — a pure TypeScript module that derives Scene State (Part transforms, camera pose, active Act, interaction availability) from a global scroll progress value, with no WebGL/rendering dependency. Rendering code will later consume this module's output; it never computes narrative logic itself.

**Blocked by:** 08 — Next.js project scaffold + package install

**Status:** done

- [x] Given a scroll progress value (0–1), the module returns the correct active Act (Hero / Gunsmith / Lineup)
- [x] Part transforms interpolate correctly across the Act 1→2 Assembly range, including exact boundary values
- [x] Reversal symmetry holds: scrolling back up produces the mirrored transform of the forward pass at the same progress value
- [x] Camera pose is derived per scroll progress to keep the subject framed through Assembly and the Act 2→3 drop
- [x] Interaction availability (e.g. hover/click enabled only in Gunsmith/Lineup) is correctly derived per Act
- [x] A `prefers-reduced-motion` variant returns static composed Scene State per Act instead of interpolated values
- [x] Full Vitest coverage for all of the above with no WebGL/canvas involved

## Design

Contract: `docs/design-system/MASTER.md` §6.3 (reduced motion).

This module is pure logic and carries no styling, but it owns one visual decision: the reduced-motion path is a **first-class output, not a degraded one**. The static composed Scene State per Act must be a deliberately framed composition — the Hero Rifle assembled, the Lineup arranged — good enough to be the whole experience for a visitor who never sees an animation. Test it as such, not as "whatever the interpolation returns at progress 1.0".

Interaction availability is what tickets 13/14 gate their Callout and Detail Panel on, so it must stay correct in the reduced-motion variant too: reduced motion removes animation, never functionality.

## Resolution

`src/lib/scene-state.ts`, 27 tests in `src/lib/scene-state.test.ts`. Built test-first, one behaviour per cycle. No WebGL, no React, no three.js import — the seam is plain TypeScript and the tests run in milliseconds.

**Two entry points, not one.** `deriveSceneState(progress)` drives the animated page. `deriveStaticSceneState(act)` drives the reduced-motion page and takes an **Act, not a progress value** — MASTER.md §6.3 selects the still by which Act's DOM section is in view, so passing a scroll number there would have been the wrong shape and would have quietly reintroduced "whatever interpolation returns".

**Act ranges are exported as `ACT_RANGES`,** with five windows rather than three: `hero`, `assembly`, `gunsmith`, `drop`, `lineup`. The transitions needed to be first-class because interaction is gated on the *settled* windows, not on the Act. Mid-Assembly and mid-drop the subject moves under the cursor, so a Callout anchored to a Part would chase the pointer — `interaction.parts` is therefore true only across the settled Gunsmith window, and false during the drop even though the Act is still `gunsmith`.

**The Exploded pose lives here, in code.** `hero-rifle.glb` exports every Part already assembled (ASSETS.md), so the assembled pose is the zero offset and Parts interpolate from an authored scatter offset down to zero. Offsets are hand-set per Part so the Act 1 arrangement reads as a composition behind the brand lockup rather than as debris.

**Reduced motion shows the Hero Rifle assembled in all three Acts.** A frozen Exploded pile is meaningless to a visitor who will never see it come together, so the Act 1 still is the assembled rifle in the Act 1 camera framing. Interaction parity with the animated path is asserted directly against `deriveSceneState`, so the two paths cannot drift apart.

**Camera is keyframed per settled Act and lerped across the transitions**, which is what keeps it continuous. A regression test walks 100 scroll steps and fails on any jump over 0.5 units — that is the test that will catch someone adding a fourth camera pose without wiring the interpolation.

Interpolation is deliberately **linear**: GSAP's `scrub: 1` already supplies the easing (MASTER.md §6.1), and easing in both places compounds into a sluggish feel.

**Note for ticket 11:** `PART_NAMES` is the binding contract with the GLB mesh names. Bind by these strings; do not re-derive them from the loaded scene graph.

Verified: 29/29 tests pass, `npx tsc --noEmit` clean, `npm run lint` clean.

