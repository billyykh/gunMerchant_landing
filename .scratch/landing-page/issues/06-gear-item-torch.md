# 06 — Gear Item: torch (normalise sourced flashlight)

**What to build:** Normalise the raw sourced `flashlight.glb` (Sketchfab flashlight — single mesh, ~1.5k tris, already under budget) into the contract `torch.glb`. Lightest ticket of the set: rename, scale, material check, re-export. Independent of the other Gear Items — parallel with 02/03/04/05/07.

**Blocked by:** 01 — Blender pipeline & Part-naming convention setup

**Status:** done

- [x] Root object renamed to `Gear_Torch`
- [x] Scaled to real-world proportions relative to the Hero Rifle, transforms applied per the export preset
- [x] Material checked against the ASSETS.md set (dark body; red accent acceptable on the switch/bezel), adjusted if it clashes with the visual system
- [x] Exported as `torch.glb`, verified to load in a glTF viewer under the `Gear_Torch` root
- [x] Sketchfab source URL + author + licence recorded in the ASSETS.md provenance table — **blocked: needs the download URL from whoever sourced the file**

## Resolution

`torch.glb` exported — 1,464 tris (budget ≤8k), 1.01 MB, single root node `Gear_Torch`.

**Normalisation applied**

- Stripped the Sketchfab wrapper hierarchy (`Sketchfab_model` → `root` → `GLTF_SceneRootNode` → …); world transform baked into the mesh, all transforms applied.
- Raw model sat rotated ~20° in the XY plane. Principal-axis (PCA) alignment put the long axis on `+X`; radial-extent comparison of the two ends confirmed the head was already forward, so no flip was needed. Final dims 130 × 30 × 30 mm — a real tactical-torch size, so no rescale was required.
- Origin set to base centre (centred in X/Y, resting on `Z=0`) — consistent choice for all Gear Items so hover float-up and the Act 3 auto-rotate showcase both pivot naturally.
- Material renamed `Mat_Metal_Dark_Torch`. Raw asset measured objectively before adjusting: base-colour median luma 0.31, metallic 0.76, roughness 0.36 — i.e. a bright, glossy chrome that clashed with the near-black/red system. Applied `baseColorFactor` 0.28 (slight cool tint) and `metallicFactor` 0.85 via glTF-exportable factor nodes.
- The roughness boost was **baked into the metallic-roughness texture's green channel** (mean 0.36 → 0.53) rather than left as a factor: a `roughnessFactor` of 1.5 exports out of the glTF-legal `[0,1]` range. All exported factors verified in-range.
- Textures downsampled 1024² → 512² across all four maps (base colour, metallic-roughness, normal, emissive). Cut payload 3.12 MB → 1.01 MB with no visible loss at Lineup framing.

### Fix — transparency bug (found on review)

The first export shipped `alphaMode: BLEND` and the torch rendered see-through,
obvious under coloured rim light. Cause: the sourced base-colour texture carries
an alpha channel (mean 0.92, so sub-1.0 in places) which was wired into Principled
Alpha, so Blender exported it as a blended material. A solid metal torch must be
opaque.

Fixed by unlinking Alpha, setting it to 1.0, forcing `blend_method = 'OPAQUE'` and
enabling backface culling. Re-exported: `alphaMode` OPAQUE, `doubleSided` false,
1,464 tris and 1.01 MB unchanged. Verified solid in a fresh render.

Audited all five contract exports for the same defect — `thermal-drone.glb` had two
BLEND materials as well (fixed under ticket 05); the rifle, ammo box and NV scope
were clean. The rule is now recorded in the ASSETS.md export preset.

**Note on material naming:** the ASSETS.md set names shared materials, but each sourced asset carries its own textures and so cannot literally reuse `Mat_Metal_Dark`. Convention adopted: `Mat_Metal_Dark_<Asset>` for a per-asset variant that targets the same visual slot.
