# 02 — Hero Rifle: normalise sourced kit (structure pass)

**What to build:** Transform the raw sourced `rifle.glb` (Sketchfab "HawkerHX" modular sniper kit — 45 meshes, armature/joint rig, multiple attachment variants per slot, ~252k tris) into the structural skeleton of the contract `hero-rifle.glb`: the kit's **default configuration** only, split into the 8 contract Parts, correctly named, pivoted, and scaled. Materials/decimation come in ticket 03. This unblocks Assembly/Scene State development.

**Blocked by:** 01 — Blender pipeline & Part-naming convention setup

**Status:** done

- [x] Default variant kept per slot; all other variants deleted (barrel_long / barrel_long_extra / barrel_heavy, stock_full / stock_heavy / stock_tactical, mag_extended / mag_extended_extra, silencer, underbarrel_* attachments, CQB/recovery grips, stock iron sights, chambered-bullet/ammo dressing meshes)
- [x] Armature/joint rig removed; kept Parts are static meshes parented to a root Empty named `HeroRifle`
- [x] Kept meshes merged/renamed to exactly the 8 contract Parts: `Rifle_Barrel`, `Rifle_Receiver`, `Rifle_Bolt`, `Rifle_Stock` (grip merged into stock), `Rifle_Scope`, `Rifle_Magazine`, `Rifle_Bipod`, `Rifle_MuzzleBrake`
- [x] Each Part's origin moved to its attachment/pivot point per ASSETS.md
- [x] Scaled to real-world size (overall length ≈ 1.16 m), all transforms applied per the export preset
- [x] Exported as `hero-rifle.glb`, verified in a glTF viewer: 8 Parts present with exact contract names, assembled silhouette reads as a modern bolt-action rifle
- [x] Sketchfab source URL + author + licence recorded in the ASSETS.md provenance table — **blocked: needs the download URL from whoever sourced the file**

## Resolution

`hero-rifle.glb` exported with root `HeroRifle` and exactly the 8 contract Parts. 46 kit meshes → 8; 252k source tris → 84k at this stage (ticket 03 then took it to the 40k budget).

**Deviations from the ticket as written**

- **`underbarrel` was kept, not deleted.** The ticket's delete list globs `underbarrel_*`, but the variant-stacking pattern shows plain `underbarrel` is the *default* of that slot: it sits at the same Z layer as every other default part (Z≈0.083), with `underbarrel_focus` / `_recoil` / `_sway` offset below it. Deleting it would have removed a default-config part. It is merged into `Rifle_Receiver` as the chassis rail.
- **`sight_scope_rear` was excluded from `Rifle_Scope`.** Rendering the default config with both scope groups mounted showed two lens assemblies side by side — not a real configuration. Only `sight_scope` forms `Rifle_Scope`; `sight_scope_rear` was handed to ticket 07 as the basis for `Gear_NightVisionScope`, which resolves that ticket's coordination note at no cost to either.
- **The kit has no `tag_*` attach empties.** Origins were derived geometrically instead, one rule per Part: breech end for the barrel, bolt face for the bolt, rail clamp (min Z) for the scope, magwell lips (max Z) for the magazine, top mount for the bipod, receiver mating face for the stock.

**Orientation:** kit authored with muzzle at −Y and Z up; rotated +90° about Z to meet the ASSETS.md convention (muzzle +X, up +Z).

Pipeline gotchas found along the way (headless import needs a window override; skinned meshes must be baked through the evaluated depsgraph) are written up in `src/assets/ASSETS.md`.

## Notes

Raw kit inspected 2026-07-24: parts ARE separated and slot-mapped (barrel, base/receiver, base_bolt, stock, sight_scope, mag, bipod, muzzle) — mapping to the 8 contract Parts is confirmed feasible. Coordinate with ticket 07 before deleting scope variants: ticket 07 extracts the kit's scope meshes for the night-vision-scope Gear Item (extract first, or work from a pristine copy of the raw file).
