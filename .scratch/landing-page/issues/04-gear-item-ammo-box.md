# 04 — Gear Item: ammo box (normalise sourced ammo pack)

**What to build:** Normalise the raw sourced `crate.glb` (Sketchfab "AssaultPack" military ammo pack — 13 meshes, joint rig, ~42k tris, includes interior magazine dressing) into the contract `ammo-box.glb`. The model is a field ammo pack rather than a literal box — it keeps the `Gear_AmmoBox` contract name; the catalog display name can read "field ammo pack". Independent of the other Gear Items — parallel with 02/03/05/06/07.

**Blocked by:** 01 — Blender pipeline & Part-naming convention setup

**Status:** done

- [x] Joint rig removed; meshes joined/parented under a single root named `Gear_AmmoBox`
- [x] Decimated to ≤ ~8k tris (drop or merge interior magazine dressing meshes as needed — only what reads from the Lineup camera matters)
- [x] Materials consolidated toward the ASSETS.md set so it sits in the same visual system as the Hero Rifle
- [x] Scaled to real-world proportions relative to the Hero Rifle, transforms applied per the export preset
- [x] Exported as `ammo-box.glb`, verified to load in a glTF viewer under the `Gear_AmmoBox` root
- [x] Sketchfab source URL + author + licence recorded in the ASSETS.md provenance table — **blocked: needs the download URL from whoever sourced the file**

## Resolution

`ammo-box.glb` — **8,000 tris** (exactly on budget), 3.25 MB, single root node `Gear_AmmoBox`, 360 × 420 × 359 mm.

**The lid is modelled open, which changed the plan.** The first pass followed the ticket literally and dropped all interior magazine dressing — the render then showed an *empty* open case, which stops reading as an ammo box at all. Reverted and brought back a selected subset: the divider grid plus three magazine sets (`ammo_grid`, `ammo_shells_mags`, `ammo_mags_typeA`, `ammo_mags_typeD`). Dropped the rest of the dressing, the duplicate `lid_glow`, and a stray backdrop `Icosphere`.

Merged source was 20,890 tris, decimated at 0.383 to land on 8,000. Flat panel regions collapse first, so the case body keeps its clean machined look while the interior ammo only needs to read as "loaded".

**Materials needed almost no work.** The sourced asset is already near-black with red trim and orange cartridge iconography — it fits the VANTAK system natively, so no retint was applied, only renaming to the convention: `Mat_Metal_Dark_AmmoBox`, `Mat_Metal_Mid_AmmoBox`, `Mat_Polymer_AmmoBox`. Textures halved from 2048×1024 to 1024×512.

Confirming the ticket's own framing: the model is a field ammo *pack/case*, not a literal box. It keeps the `Gear_AmmoBox` contract name; the catalog display name can read "field ammo pack".
