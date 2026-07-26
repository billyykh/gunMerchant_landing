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

`src/lib/scene-state.ts`, 40 tests in `src/lib/scene-state.test.ts`. Built test-first, one behaviour per cycle. No WebGL, no React, no three.js import — the seam is plain TypeScript and the tests run in milliseconds.

**Two entry points, not one.** `deriveSceneState(progress)` drives the animated page. `deriveStaticSceneState(act)` drives the reduced-motion page and takes an **Act, not a progress value** — MASTER.md §6.3 selects the still by which Act's DOM section is in view, so passing a scroll number there would have been the wrong shape and would have quietly reintroduced "whatever interpolation returns".

**Five scroll windows, exported as `SCROLL_WINDOWS`:** `heroHold`, `assembly`, `gunsmithHold`, `drop`, `lineupHold`. Deliberately *not* named after Acts — there are three Acts (CONTEXT.md) and five windows, and a name like `ACT_RANGES.hero.end` reads as "where Act 1 ends" while actually meaning "where Act 1 stops holding still". The transitions have to be first-class because interaction is gated on the holds: mid-Assembly and mid-Drop the subject moves under the cursor, so a Callout anchored to a Part would chase the pointer. `interaction.parts` is therefore true only across `gunsmithHold`, and false during the Drop even though the Act is still `gunsmith`. **This is a deliberate deviation from the acceptance criterion's "per Act" wording**, signed off with the user; ticket 13 gates its Callout on it.

Every derivation runs through one `resolveWindow(progress)` rather than its own boundary cascade — three separate cascades is how their notions of "past the Drop" drift apart, and the first draft had already picked up inconsistent `<` / `<=` operators between them.

**The seam owns the whole journey, not just Assembly.** `SceneState` carries `heroRifle` (the rifle's root transform) and `dropProgress` alongside `parts` and `assemblyProgress`, so ticket 14's "reverses the drop symmetrically per the Scene State seam" has something to consume. Part transforms are offsets *relative to* `heroRifle`. `gear` carries the Lineup arrangement for all four Gear Items, so §6.3's "the Lineup arranged" is a real output rather than something ticket 14 has to invent.

**Exploded and Lineup poses are authored here, in code.** `hero-rifle.glb` exports every Part already assembled (ASSETS.md), so the assembled pose is the zero offset. Offsets are hand-set per Part and per Gear Item so both arrangements read as compositions rather than as scatter. ASSETS.md describes a computed scatter vector with hand-authored offsets as sidecar data; hand-authoring won because a formula cannot compose.

**Reduced motion is composed, not inherited.** Act 1 gets its **own** camera pose: the scroll keyframe is pulled back to hold the Exploded Parts behind the brand lockup, and with nothing Exploded to hold it strands the assembled rifle in an empty frame. The stills are asserted on their own terms — framing distance, mutual distinctness, that the Lineup is actually arranged — because asserting them against `deriveSceneState` at some progress value is exactly the "whatever the interpolation returns" the ticket rules out. The one exception is interaction parity, which *is* asserted against the animated path, deliberately: reduced motion removes animation, never functionality.

**Camera is keyframed per settled Act and lerped across the transitions.** A regression test walks 100 scroll steps and fails on any jump over 0.5 units — that catches someone adding a pose without wiring the interpolation. A second test asserts the Act 3 camera target lies inside the bounds of the arrangement the seam itself built, so the framing and the layout cannot drift apart.

Interpolation is deliberately **linear**, and now pinned by tests at the quarter, half and three-quarter marks of both Assembly and the Drop: GSAP's `scrub: 1` already supplies the easing (MASTER.md §6.1), and easing in both places compounds into a sluggish feel.

**Reversal symmetry is tested as statelessness.** The first attempt compared `deriveSceneState` against itself over a reversed sample list, which no implementation could ever fail — the function has no direction argument. The real property is that the seam keeps no memory of where the visitor has been, so the test now probes, scrubs the whole page down and back up, and re-probes. That fails the moment anyone adds a cache, a smoothed value, or a module-level "last progress".

**Note for ticket 11:** `PART_NAMES` and `GEAR_NAMES` are the binding contract with the GLB mesh/root names. Bind by these strings; do not re-derive them from the loaded scene graph.

Verified: 42/42 tests pass across the suite, `npx tsc --noEmit` clean, `npm run lint` clean.

**Glossary:** "Drop" was added to `CONTEXT.md` — the term was in the spec and used throughout this module but had never been defined.

