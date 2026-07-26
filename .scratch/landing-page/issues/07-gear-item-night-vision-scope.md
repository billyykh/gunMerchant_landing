# 07 — Gear Item: night-vision scope (extract from rifle kit)

**What to build:** Extract the scope meshes from the raw sourced `rifle.glb` kit (`HawkerHX_sight_scope` family — scope body, adds, bubble/glass) and rebuild them as the standalone contract `night-vision-scope.glb`, restyled to read as a night-vision unit. This Gear Item is distinct from the Hero Rifle's `Rifle_Scope` Part — same source geometry is acceptable, but it ships as its own asset with its own name.

**Blocked by:** 01 — Blender pipeline & Part-naming convention setup

**Status:** done

- [x] Scope meshes extracted from the rifle kit into their own scene; everything else discarded
- [x] Joined/parented under a single root named `Gear_NightVisionScope` (must never collide with `Rifle_Scope`)
- [x] Restyled to read as night-vision: `Mat_Glass` lens with a red-tinted emissive treatment consistent with the HUD visual system
- [x] Decimated to ≤ ~8k tris — came in at 7,769, so no decimation was needed
- [x] Scaled to real-world proportions, origin at a sensible base/mount point, transforms applied per the export preset
- [x] Exported as `night-vision-scope.glb`, verified to load in a glTF viewer under the `Gear_NightVisionScope` root
- [x] Provenance: same Sketchfab source as `rifle.glb` — noted in the ASSETS.md provenance table — **blocked: needs the download URL from whoever sourced the file**

## Resolution

`night-vision-scope.glb` — **7,769 tris** (already under the 8k budget, so no decimation was applied), 1.22 MB, single root node `Gear_NightVisionScope`, 260 mm long.

**The coordination risk with ticket 02 resolved itself cleanly.** The kit turned out to carry *two* scope groups: `sight_scope` and `sight_scope_rear`. Rendering the default config with both mounted showed two lens assemblies side by side — not a real configuration — so ticket 02 kept only `sight_scope` for `Rifle_Scope` and handed `sight_scope_rear` to this ticket. Both tickets get genuinely distinct geometry from one source, no name collision, and no need to work from a pristine copy.

**Night-vision treatment:** the lens material became `Mat_Glass_NightVision` — near-black base, non-metallic, roughness 0.12, with a red emissive at strength 3.0 exported via `KHR_materials_emissive_strength`. Red was chosen over the classic NV green because the whole page is red-on-near-black and the ticket permits either. Body materials darkened with a `baseColorFactor` multiply; all exported factors verified inside the glTF-legal `[0,1]` range.

Origin sits at the mount base (centred in X/Y, resting on `Z=0`) — the same rule used for every Gear Item so hover float-up and the Act 3 auto-rotate showcase both pivot naturally.
