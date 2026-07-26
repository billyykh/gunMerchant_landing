# 11 — Persistent canvas + scroll spine + Assembly (placeholder Parts)

**What to build:** A single full-viewport R3F canvas, mounted once and never unmounted or swapped between Acts, rendering placeholder geometry (boxes) standing in for the Hero Rifle Parts. GSAP ScrollTrigger (scrubbed) + Lenis smooth scrolling bind real page scroll to the Scene State module, so scrolling visibly disperses/assembles the placeholder Parts (Act 1 Exploded → Act 2 assembled), reversible by scrolling back up. A loading indicator shows while any 3D assets stream in.

**Blocked by:** 10 — Scene State seam (pure module + tests)

**Status:** ready-for-agent

- [ ] One persistent full-viewport canvas fixed behind the DOM, mounted for the whole page lifecycle
- [ ] Placeholder Parts (simple primitives, one per Hero Rifle Part) render at the transforms Scene State produces
- [ ] Lenis smooth scrolling active; GSAP ScrollTrigger scrubs Scene State's scroll progress directly off real scroll position
- [ ] Scrolling forward visibly assembles the placeholder Parts; scrolling back up disassembles them symmetrically
- [ ] Camera follows Scene State's derived pose, keeping the subject framed throughout
- [ ] A loading indicator displays until initial 3D assets/scene are ready, then disappears
- [ ] `prefers-reduced-motion` renders the static composed view per Act instead of scrubbing

## Design

Contract: `docs/design-system/MASTER.md` §6 (Motion).

- [ ] `scrub: 1`, **not** `scrub: true` — the 1s catch-up smooths raw scroll input and is what pairs correctly with Lenis
- [ ] Every timeline wrapped in `useGSAP(() => {...}, { scope: containerRef })` so it reverts on unmount. A ScrollTrigger leaked across an Act boundary is the most likely source of scroll jank on this page.
- [ ] Lenis and ScrollTrigger share one ticker — never two independent RAF loops
- [ ] Only `transform` and `opacity` are animated. Never `width`, `height`, `top`, or `left`: they force layout on every scroll frame.
- [ ] Canvas element is `aria-hidden` — the narrative is carried by DOM text so a screen reader user does not get an empty page
- [ ] Loading indicator is a **determinate** mono readout (`LOADING ASSETS 42%`) driven by drei's `useProgress` plus a 1px thermal progress rule — not an indeterminate spinner. Assets total ≈17.7 MB, so an honest percentage matters.
- [ ] Layout is reserved so nothing shifts when assets resolve (CLS < 0.1)
- [ ] Page background stays `--surface-0` near-black — any lift produces a visible seam where DOM sections overlap the canvas
- [ ] Reduced-motion path disables pin, scrub, and Lenis entirely and falls back to native scrolling (MASTER.md §6.3)

