# 14 — Act 2→3 drop + Act 3 Lineup interaction

**What to build:** Continued scrolling past the Gunsmith View sends the Hero Rifle falling into the Lineup among placeholder Gear Items. Hovering a Gear Item makes it float up with a Callout; clicking triggers an auto-rotate showcase pose plus its Detail Panel (reusing the ticket-13 Detail Panel component and catalog data).

**Blocked by:** 13 — Act 2 Gunsmith interaction

**Status:** done

- [x] Continued scroll past Act 2 animates the Hero Rifle falling/moving into the Lineup composition
- [x] Placeholder Gear Items (ammo box, thermal drone, torch, night-vision scope) are positioned in the Lineup alongside the landed Hero Rifle
- [x] Hovering a Gear Item makes it float up and shows a HUD Callout
- [x] Clicking a Gear Item triggers an auto-rotate showcase pose and opens its Detail Panel via the reused ticket-13 component
- [x] On touch devices, tap substitutes for hover to trigger the float-up/Callout and showcase
- [x] Scrolling back up from Act 3 reverses the drop symmetrically per the Scene State seam

## Design

Contract: `docs/design-system/MASTER.md` §5–§7. This Act reuses ticket 13's Callout and Detail Panel unchanged — if either needs a variant to work here, fix the shared component rather than forking it.

- [x] Float-up on hover is a 3D transform inside the canvas, not a DOM effect
- [x] Callout for a Gear Item uses the identical component and styling as an Act 2 Part
- [x] Auto-rotate showcase is continuous only while the Gear Item is the active selection, and stops when its Detail Panel closes — a decorative infinite rotation on an idle object violates the "infinite animation is for loading only" rule
- [x] Reduced motion: no float, no auto-rotate. Hover/selection cross-fades over `--dur-fast` and the showcase pose is rendered statically (MASTER.md §6.3).
- [x] Only one glowing element on screen at a time — with five objects in the Lineup this is the Act most likely to break the rule
- [x] Gear Items are keyboard-reachable in a stable order and open the same Detail Panel
- [x] The drop animates `transform` only — never layout properties

## Resolution

`src/lib/gear-presentation.ts`, `src/components/scene/use-lineup-gear.ts`, `src/components/scene/scene-contents.tsx`, `src/components/scene/project-hotspots.ts`, `src/components/scene/use-hero-rifle.ts`, a re-authored Lineup in `scene-state.ts`, and ticket 13's `GunsmithHud` generalised into `src/components/hud/hotspot-layer.tsx`. 34 new tests, 206 across the suite.

### Nothing was forked, so two things had to move

Ticket 13's HUD was Part-shaped throughout — `HOTSPOT_ORDER`, `hotspotIndexLabel`, `PartName` in the channel. The instruction here was to reuse rather than fork, and the honest reading of that is that the layer itself is the reusable thing: pointing at an object in the scene, reading its Callout, opening its Detail Panel is one interaction, and what differs between the Acts is only which set is offered and whether it is numbered. `GunsmithHud` became `HotspotLayer`, `part-hotspots.ts` became `hotspots.ts` with a list per Act, and `SceneLayer` mounts it twice against two channels. `Callout` and `DetailPanel` were not touched — `index` was already optional at 66d4d09, which is what let the Lineup go unnumbered.

The Lineup is unnumbered deliberately. `01/04` on a torch claims an order that is a composition rather than a specification; the rifle's `03/08` is a real position along a real object.

### One frame loop for the whole scene

The Act 2 HUD projects Parts after the camera is placed. Act 3 has to do the same for Gear Items — and split across two components, that ordering would depend on React Three Fiber's subscription order, which is mount order, which Suspense is free to change. So `hero-rifle.tsx` became `useHeroRifle` (load and bind), `useLineupGear` (load and bind), `projectHotspots` (the shared projection pass) and `SceneContents`, which owns the single `useFrame`. Scene State is still derived once per frame, which was already the rule; now nothing in the scene can disagree about which frame it is on.

### The Lineup was re-authored against the models

The old arrangement was written before any Gear Item existed, spaced at ±2.2 with the camera 6.5 out. The models are metric and small — the drone is 0.45 across, the ammo box 0.36, the night-vision scope 0.26, the torch 0.13, against a 1.16 rifle — so that arrangement put four specks either side of the rifle. Measured sizes and the Gear Item origin convention are now recorded in `ASSETS.md`, which is where the arrangement's comment already claimed they were.

Nine to one is the real spread and is not corrected in code. Depth does what scaling would have: the smaller items step slightly toward the lens. Slightly, because the camera looks down, and a bigger step turned the row into a diagonal cascade rather than a lineup — that was visible immediately and took two passes to settle.

The group is held out of the right-hand third of the frame, because that is where the Detail Panel arrives. First attempt put the torch and the scope behind it: clicking either opened a panel describing an object that was rotating where nobody could see it, which is the one thing this Act exists to do.

**The arrangement test now checks overlap rather than a round number.** It asserted every pair of objects was more than 0.5 apart, which was meaningless once the real models arrived — 0.5 is nothing between a drone and a box, and absurd between two objects 0.13 and 0.26 across. It now compares plan-view distance against the objects' measured footprints, so it asks the question it always claimed to: do these two stand in the same place? The rifle is checked separately, because at 1.16 long it spans the whole row and is separated in height instead.

### The showcase stops; it does not go home

Deriving the angle from "how long has this been selected" is the obvious shape and it is wrong: the moment the Detail Panel closes the angle returns to zero and the object snaps back to its resting pose — up to half a turn, instantly. Easing it back is worse, because it rewinds every turn it made.

So the showcase is state, and it simply stops. The object stays as the visitor left it, which is what happens when you put something down after turning it over; the arrangement's authored rotation is a starting pose, not one it must be returned to. That also moved the frame-to-frame bookkeeping — reset on a new selection, hold on deselect — out of the canvas and into the tested seam.

### The bug the browser found

`<primitive object={…}>` **re-parents whatever it is given into the React Three Fiber tree.** Handed the contract-named object out of a loaded GLB, it empties the scene that object came from, so the next render binds nothing and the Lineup silently disappears. React's development double-render made it the *second* pass that came up empty, which is why the models loaded, warned, and then were not there. The Gear Items now bind and move their scene root, and the contract name is checked without being taken.

### Code review

Both axes ran. Four findings stood up.

**The float was a teleport.** §6.2 calls it a float-up; the position was set straight from the seam's step every frame, so the object jumped 0.06 and back. Now damped on the frame loop, the same way the parallax lean already was, with the first frame of each Gear Item treated as a placement rather than an ease — otherwise it drifts in from wherever the GLB sat the first time Act 3 comes into view. The damping stays out of the seam: the rule is "pointed-at items sit higher", and how long the scene takes to agree is a property of the frame loop.

**The showcase never stopped when the Act ended.** The hotspots unmount when interaction is withdrawn, but the Callout and the Detail Panel are not hotspots — the panel was left floating over the following Act describing an object that had gone, and `advanceShowcase` kept turning it forever. Exactly the endless decorative animation §5 forbids, and nothing covered it. Two tests now do.

**`ASSETS.md` was cited for facts it did not contain.** Three comments pointed at it for Gear Item dimensions and for the origin-at-base convention; it recorded neither. The measurements were real — taken from the GLB accessor bounds — but the citation was not. Both are now in `ASSETS.md`, with a note that the Act 3 arrangement is authored against them.

**The channel did not know what it carried.** Widening it from `PartName` to `CatalogId` bought two Acts at the cost of three casts and a silent failure — `partHotspotIndexLabel` answers `00/08` for a name it cannot find. `HotspotChannel<T>` and `HotspotLayer<T>` remove all three casts and the `asGearName` guard with them.

Rejected, with the reason:

- **"Two Gear Items lifted at once."** The Detail Panel is modal and its backdrop sits over the hotspots; measured in the browser with `elementFromPoint`, a hotspot under an open panel is unreachable. Hover cannot reach a second object while one is selected.
- **"The Hero Rifle floats unsupported above the row."** There is no ground plane in this scene — all five objects hang in black. The rifle is placed above because it is the protagonist and the gear is what it goes to the field with, which is the Act's own sentence.
- **"Gear Items are never gated by Act."** The canvas is persistent by design (ticket 11); the rifle is likewise present in Act 3. They are far outside the Act 1 and 2 framings. If their cost matters it is ticket 16's to measure.

### Verified

206/206 tests, `npx tsc --noEmit`, `npm run lint`, `npm run build` all clean. In the browser at 1440×810: all four Gear Items projected onto their objects and tracking the camera, tab order left to right across the row, Callout on hover with no index, Detail Panel opening with the Gear Item's own catalog entry (`Thermal Recon Drone` / `$4,700`, `Night-Vision Clip-On` / `$3,950`), `hud-scan` at one iteration, Escape closing and returning focus, the showcase turning continuously across successive screenshots and holding its angle after the panel closed, and the whole group clear of the panel. Mid-drop, no hotspots are offered at all. Console clean on a fresh load.

**Not verified here: the float easing, frame by frame.** The preview pane stopped compositing partway through and throttled `requestAnimationFrame` to roughly two frames a second — measured, not guessed: 18 frames could not complete in 30 seconds. At that rate every damped value converges in one step, so the ease cannot be observed. The lift is an exponential damp structurally identical to the parallax lean that was verified in ticket 13, but ticket 16 owns the hand-verification gate and should watch this one in a real browser.

**Also for ticket 16:** the Act 3 framing crops on a portrait viewport exactly as Acts 1 and 2 do — three.js fixes the vertical field of view, so a narrow window loses the ends of the row. Same defect, same owner. Re-check Gear Item reachability there alongside the Parts.
