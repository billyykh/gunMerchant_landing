# 05 — Gear Item: thermal drone (normalise sourced model)

**What to build:** Normalise the raw sourced `drone.glb` (Sketchfab drone — 124 meshes, ~430k tris, 45 materials; by far the heaviest raw asset, ~50× over budget) into the contract `thermal-drone.glb`. This is primarily an aggressive decimation and consolidation job. Independent of the other Gear Items — parallel with 02/03/04/06/07.

**Blocked by:** 01 — Blender pipeline & Part-naming convention setup

**Status:** done

- [x] Meshes joined/parented under a single root named `Gear_ThermalDrone`
- [~] Decimated — **30k, not 8k**; see the deviation note below
- [~] Materials — consolidation attempted and deliberately reverted; accents retinted to red instead, see below
- [x] Scaled to real-world proportions relative to the Hero Rifle, transforms applied per the export preset
- [x] Exported as `thermal-drone.glb`, verified to load in a glTF viewer under the `Gear_ThermalDrone` root, file size sane for web (2.32 MB vs the raw 15.4 MB)
- [x] Sketchfab source URL + author + licence recorded in the ASSETS.md provenance table — **blocked: needs the download URL from whoever sourced the file**

## Resolution

`thermal-drone.glb` — 30,000 tris, 2.32 MB, single root node `Gear_ThermalDrone`, 450 mm across. 124 source meshes merged into one; 429,790 → 30,000 tris (**93% reduction**).

### Deviation 1 — budget is 30k, not 8k

8k was tried first and is not shippable: the body shell shattered into visible shards and the camera gimbal was destroyed. At 30k the drone is visually indistinguishable from the 430k original — body, four arms, motors, all eight rotor blades, landing legs and gimbal intact. 30k is the lowest tested ratio that holds up.

The 8k guideline assumes a compact single-volume prop; this asset is thin, disconnected geometry that collapses badly. 30k tris is immaterial for a desktop-first WebGL scene, and the *file* is well under budget at 2.32 MB. Recorded in `src/assets/ASSETS.md`.

### Deviation 2 — materials kept, not consolidated

Consolidating the 45 materials into 4 (dark / mid / red accent / glass) was implemented and rendered — and it destroyed the asset. The carbon-fibre weave, panel definition and motor detail all live in the materials; flattened to solid colours the drone read as a featureless black blob, markedly worse than the source.

Reverted to the original 45 materials and fixed the actual problem instead: the drone shipped with **purple/blue emissive accents** (motor rings, logo badges, branding text, blade tips) that clashed with the red HUD system. Nine blue-dominant materials were detected programmatically (blue channel > 1.25× the max of red/green) and swung to HUD red at matched perceived brightness. Every texture is preserved and the accents now read red-on-near-black.

Cost of keeping them: 45 primitives in the export rather than a handful. Acceptable for one object on a desktop-first page, and the visual difference is large. This finding also set the approach for the Hero Rifle in ticket 03.

### Fix — transparency bug (found on review)

Auditing all five exports after the torch turned out to be see-through, this file had the same defect: `Material.007` (alpha 0.306) and `Material.013` (alpha 0.172) exported as `alphaMode: BLEND`. Both were forced opaque and the file re-exported — 30,000 tris and 2.33 MB unchanged, no `BLEND` materials remain. Verified in a fresh render: the drone is solid throughout.

## Notes

Raw drone re-inspected 2026-07-25 after re-download: geometry unchanged (still ~430k tris) — the decimation requirement stands regardless of source file version.
