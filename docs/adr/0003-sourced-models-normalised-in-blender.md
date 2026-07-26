# Models are sourced from Sketchfab and normalised in Blender

Supersedes ADR-0002.

Self-authoring every model in Blender produced results below the visual bar the page needs. We now source free Sketchfab models (rifle kit, drone, ammo pack, flashlight) and run each through a Blender normalisation pass instead: pick the wanted variant meshes, strip armatures and unused variants, decimate to the polygon budget, rename meshes to the naming convention, fix origins/scale, and re-export as GLB. The naming convention and export contract in `src/assets/ASSETS.md` are unchanged — code still binds to the same names; only the origin of the geometry changed.

## Consequences

- Photorealism comes from the sourced assets; part separation, naming, budget, and pivots still come from our Blender pass, so Assembly requirements hold.
- Every sourced asset must have its Sketchfab URL, author, and licence recorded in the ASSETS.md provenance table before its normalisation ticket closes — free Sketchfab downloads are typically CC-BY and require attribution.
- Raw downloads and normalised contract exports both live under the assets directory; only the contract-named exports are loaded by code.
