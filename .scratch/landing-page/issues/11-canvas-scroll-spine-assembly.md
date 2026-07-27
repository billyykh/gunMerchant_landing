# 11 — Persistent canvas + scroll spine + Assembly (placeholder Parts)

**What to build:** A single full-viewport R3F canvas, mounted once and never unmounted or swapped between Acts, rendering placeholder geometry (boxes) standing in for the Hero Rifle Parts. GSAP ScrollTrigger (scrubbed) + Lenis smooth scrolling bind real page scroll to the Scene State module, so scrolling visibly disperses/assembles the placeholder Parts (Act 1 Exploded → Act 2 assembled), reversible by scrolling back up. A loading indicator shows while any 3D assets stream in.

**Blocked by:** 10 — Scene State seam (pure module + tests)

**Status:** done

- [x] One persistent full-viewport canvas fixed behind the DOM, mounted for the whole page lifecycle
- [x] ~~Placeholder Parts (simple primitives)~~ — the **real** `hero-rifle.glb` renders at the transforms Scene State produces; see the deviation below
- [x] Lenis smooth scrolling active; GSAP ScrollTrigger scrubs Scene State's scroll progress directly off real scroll position
- [x] Scrolling forward visibly assembles the Parts; scrolling back up disassembles them symmetrically
- [x] Camera follows Scene State's derived pose, keeping the subject framed throughout
- [~] A loading indicator displays until initial 3D assets/scene are ready, then disappears — built and unit-tested; not observable in the browser, see below
- [~] `prefers-reduced-motion` renders the static composed view per Act instead of scrubbing — built; the media query cannot be emulated in this preview pane, see below

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

## Resolution

`src/components/scene/` (canvas, spine, rifle, loading readout), `src/hooks/` (reduced motion, Act in view), and the three Act sections in `src/app/page.tsx`. 13 new tests, 84 across the suite.

### Deviation — the real model, not placeholder primitives

The ticket asked for boxes because it was written before the asset tickets closed. All five contract GLBs shipped (tickets 02–07), so the canvas loads `hero-rifle.glb` directly. Boxes would have had to be built and then thrown away, and — more to the point — the loading-indicator criterion is meaningless without real bytes to load.

### Assets moved to `public/models/`

`useGLTF` fetches over HTTP and Next.js serves only `public/`, so the five contract exports moved there and are referenced as `/models/<name>.glb`. The raw Sketchfab downloads stay in `src/assets/` — they are never loaded, only kept for provenance. `ASSETS.md` records the split.

### The scroll spine

Progress lands in a **ref, not state**. It changes every frame while scrolling, and re-rendering the React tree at 60fps to move a rifle is exactly the jank this page is trying to avoid. The canvas reads the ref inside `useFrame`.

`scrub: 1` is honoured by tweening a proxy object rather than reading `self.progress` in `onUpdate` — without a tween there is no playhead for scrub to smooth, and the value would track raw scroll input.

**The ScrollTrigger range was the one real bug here.** Written first as `trigger: document.documentElement, start: "top top", end: "bottom bottom"` — the reading of MASTER.md §6.1's example — it resolves to a **zero-length range** on the documentElement, so the tween never advanced and `onUpdate` never fired once. The scene rendered a permanently Exploded rifle that ignored scroll. Fixed with the canonical whole-page form, `start: 0, end: "max"`.

### Binding to the model

Parts are looked up by the `PART_NAMES` contract strings, never by traversal order, and each Part's **exported transform is captured once as its assembled pose** (ASSETS.md) — everything the seam returns is applied as an offset from it. A missing mesh warns with a pointer to ASSETS.md rather than failing silently.

### Lighting

Lit considerably brighter than "near-black" suggests. The Hero Rifle's materials were already pulled to a dark cool gunmetal at export (ticket 03), so lighting a dark model darkly leaves a silhouette with no surface — the first pass was nearly invisible against the page. The background still sits on `--surface-0`; only the subject is lifted.

### React Compiler vs. React Three Fiber

`react-hooks/immutability` rejects mutating a value that came out of a hook, and driving a three.js scene *is* mutation. Taking the camera from the frame-state argument (`useFrame(({ camera }) => …)`) rather than from `useThree` satisfies the rule honestly — it is the frame's camera, not a render-time value — and no suppression was needed.

### Act sections and a client/server trap

The three Acts are now real DOM sections carrying `data-act`, which gives the spine its scroll runway (~4.6 viewport heights) and gives a screen reader the narrative, since the canvas is `aria-hidden`.

The marker constant first lived in the client hook that reads it. Importing it into the server-rendered page turned it into a **client reference**, and React rendered the reference function itself as the attribute name — a wall of `Invalid attribute name` and a hydration mismatch. The constant now lives in a plain module, and a small `ActSection` component is the only place the attribute is written.

### Verified in the browser

Act 1 shows the Parts Exploded behind the brand lockup; scrolling assembles them into a recognisable M24-style bolt-action; the Gunsmith framing holds the assembled rifle; scrolling on drops it into the Lineup position with the camera pulling back. Scrolling back up retraces it. Canvas confirmed `fixed`, `aria-hidden`, and mounted once across the whole page.

**Not verified in this pane:**

- **The loading readout.** A 10 MB GLB over localhost resolves faster than the page can be inspected, so `active` was never observed true. Covered instead by unit tests against a mocked `useProgress` — renders while active, announces politely, disappears when done, and its rule scales with the percentage. Confirm by hand on a throttled connection.
- **The reduced-motion path.** The preview pane cannot emulate `prefers-reduced-motion: reduce`. The hook is unit-tested (initial value, mid-session change, listener cleanup) and the seam's static path is tested in ticket 10, but the two have not been seen working together. Ticket 16 owns this as a delivery gate — check it there.

Verified: 84/84 tests pass, `npx tsc --noEmit` clean, `npm run lint` clean, `npm run build` succeeds.

**Note for ticket 14:** the seam already returns the Lineup arrangement in `state.gear`; the Gear Item meshes just need loading and binding the same way the Parts are.

