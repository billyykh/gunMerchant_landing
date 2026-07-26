# 14 — Act 2→3 drop + Act 3 Lineup interaction

**What to build:** Continued scrolling past the Gunsmith View sends the Hero Rifle falling into the Lineup among placeholder Gear Items. Hovering a Gear Item makes it float up with a Callout; clicking triggers an auto-rotate showcase pose plus its Detail Panel (reusing the ticket-13 Detail Panel component and catalog data).

**Blocked by:** 13 — Act 2 Gunsmith interaction

**Status:** ready-for-agent

- [ ] Continued scroll past Act 2 animates the Hero Rifle falling/moving into the Lineup composition
- [ ] Placeholder Gear Items (ammo box, thermal drone, torch, night-vision scope) are positioned in the Lineup alongside the landed Hero Rifle
- [ ] Hovering a Gear Item makes it float up and shows a HUD Callout
- [ ] Clicking a Gear Item triggers an auto-rotate showcase pose and opens its Detail Panel via the reused ticket-13 component
- [ ] On touch devices, tap substitutes for hover to trigger the float-up/Callout and showcase
- [ ] Scrolling back up from Act 3 reverses the drop symmetrically per the Scene State seam

## Design

Contract: `docs/design-system/MASTER.md` §5–§7. This Act reuses ticket 13's Callout and Detail Panel unchanged — if either needs a variant to work here, fix the shared component rather than forking it.

- [ ] Float-up on hover is a 3D transform inside the canvas, not a DOM effect
- [ ] Callout for a Gear Item uses the identical component and styling as an Act 2 Part
- [ ] Auto-rotate showcase is continuous only while the Gear Item is the active selection, and stops when its Detail Panel closes — a decorative infinite rotation on an idle object violates the "infinite animation is for loading only" rule
- [ ] Reduced motion: no float, no auto-rotate. Hover/selection cross-fades over `--dur-fast` and the showcase pose is rendered statically (MASTER.md §6.3).
- [ ] Only one glowing element on screen at a time — with five objects in the Lineup this is the Act most likely to break the rule
- [ ] Gear Items are keyboard-reachable in a stable order and open the same Detail Panel
- [ ] The drop animates `transform` only — never layout properties

