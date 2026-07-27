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

## Revision — framing, matched to a supplied reference

The original framings were authored blind, before the real model was in frame, and were reworked twice: first by eye, then against a reference render the requester supplied of the exact Act 1 angle and zoom they wanted.

### Measuring the model instead of guessing at it

The Blender MCP bridge was not connected, so the reference camera could not simply be read out of the blend file. Instead the GLB was parsed directly for each Part's world-space bounds, which pinned down facts the framing work had been guessing at:

- The rifle's **long axis is X** — muzzle at `+0.58`, butt at `-0.58`, overall length **1.16**
- Up is Y (scope crown at `0.25`), and the rifle is only **0.113 thick** on Z
- Its centre is `(0, 0.125, 0)`. Every camera pose had been targeting the origin, which sits under the stock, not at the subject.

### The Act 1 side is forced, not chosen

The reference has the butt running to the top-right and the muzzle off the bottom-left. Requiring the `-X` axis to project up **and** to the right needs `sin(az) > 0` and `cos(az) < 0` at the same time, which admits only the `+X/-Z` side of the rifle. The lateral side is a consequence of the composition — worth recording, because it looked like a free choice that would have to be settled by squinting at the reference.

With the side fixed, elevation 34°, azimuth 133° and distance 1.03 reproduce the reference's 31° on-screen axis and its framing: `[0.625, 0.7, -0.58]`, target `[0, 0.125, 0]`, fov 26.

### What that forced elsewhere

- **Act 2 is now further out than Act 1**, which inverts the page's usual direction. Act 1 is a close portrait that crops the muzzle on purpose; the Gunsmith View has to hold all eight Parts at once for their Callouts (ticket 13), so it cannot be tighter. Two tests asserted the old direction and were rewritten to state the new intent rather than bent to fit.
- **`EXPLODED_OFFSETS` rebuilt from a second reference render, of the Exploded state itself.** Two rules came out of it. **Nothing rotates** — Parts separate by translation alone, because a Part that tumbles as it comes off reads as having fallen off the rifle rather than been taken off it. And **not every Part separates**: the barrel, receiver, scope and brake stay as one body so the rifle is still recognisably a rifle, and only the fittings drop clear of it, down and slightly toward the camera so they do not hide behind the body.

  Two earlier attempts were rejected before this one — a scattered spread with per-Part rotation, then a technical-diagram version sliding every Part out along its own mount axis. Both missed that the reference keeps the rifle's silhouette intact. Do not re-open this without new direction.

### Assembly finished too late to be believed

The Gunsmith copy was being read over a rifle that was still coming apart. Measured in the browser rather than guessed: the Act 2 heading scrolls into view at progress **0.25** and is centred at **0.39**, while `assembly` did not finish until **0.38** — and `scrub: 1` adds a further second of lag on top. The window boundaries answer to the DOM, so Assembly now runs 0.06 → 0.24 and the Gunsmith hold opens at 0.24, before its own copy is legible. `SCROLL_WINDOWS` carries the measured numbers in a comment; if the section heights change, these have to be re-measured with them.

Act 2 also moved closer, to 1.35 from 1.85 — as close as the rifle allows while still holding all of it, since every Part needs to carry a Callout (ticket 13) and a cropped end would put one off-screen. It is then panned so the rifle sits left of centre, by shifting **camera and target together** along the camera's own right vector; moving the target alone would have swung the camera and changed the angle that had just been agreed.

### Parts stay on the centreline

Reviewing the Exploded state mid-Assembly turned up a fault the end states hid. The camera passes **straight down the barrel** during Assembly — Act 1 views from `-Z`, Act 2 from `+Z`, so the path crosses the rifle's own axis — and from there the sideways component of the offsets was plainly visible as Parts drifting off the shared centreline.

Z is also the rifle's 0.113 of thickness, its smallest dimension, so a 0.03 offset that reads as nothing in an isolated screenshot is a large fraction of the body's width. Every offset now lies in the rifle's X-Y plane: Parts separate fore-and-aft and up-and-down, never sideways. A test walks the whole Assembly and asserts `position[2] === 0` for every Part at every sample, because this is exactly the kind of invariant that gets broken by a later nudge that looks fine at both ends.

The scope's travel was cut from 0.14 to 0.07 after the first attempt lifted it out of the top of Act 1's frame — it already sits highest on the rifle, so it has the least headroom of anything. The bipod is shallower than the magazine for the same reason: it hangs under the barrel, where the bottom of the frame runs out fastest.

Act 1 was then panned right and pulled back to 0.95x, by the same rule as Act 2 — pan along the camera's own right vector, zoom by scaling the offset between camera and target, both applied to the pair together, so neither operation rotates the framing the reference fixed. Both the scrubbed pose and the reduced-motion still were moved together; letting them drift apart would mean two different Act 1 compositions.
- **The reduced-motion Act 1 still keeps the same angle but steps back** to 1.35. The scrubbed Act 1 crops deliberately and the visitor scrolls on within a moment; a still is the whole of what that visitor will ever see, so nothing may be cut off permanently.
- **A second white key was added.** The new Act 1 camera sits almost exactly on the red rim light's axis, and a rim light on the camera's own axis stops rimming anything — it floods the subject with its colour. Act 1 rendered blood-red. The camera also crosses sides during the page (Act 1 from `-Z`, Acts 2–3 from `+Z`), so one key can only ever cover half the story. Red stays where it rims Acts 2 and 3, at reduced intensity, and a second neutral key covers Act 1.

The `Canvas` element's initial `camera` prop tracks the Act 1 keyframe, so the first painted frame is already the pose `useFrame` sets.

### Verified in the browser

Act 1 matches the reference angle and zoom, in neutral tan and black rather than red. Act 2 holds the whole assembled rifle in frame. Act 3 unchanged.

One caution: the pane renders at roughly 1.2 aspect, and the framing was solved for ~16:9. Since three.js fixes the **vertical** FOV, a narrower window crops horizontally — Act 1 is tighter there than the reference. Ticket 16 owns responsive framing; that is where the narrow-viewport case should be settled.

