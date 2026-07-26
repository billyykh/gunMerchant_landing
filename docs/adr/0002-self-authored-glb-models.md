# All 3D models are self-authored GLB files (Blender MCP pipeline)

**Status: superseded by ADR-0003** — self-authored quality fell short; models are now sourced from Sketchfab and normalised in Blender. The naming convention and export contract below still apply.

Assembly requires every Part of the Hero Rifle to be a separately named mesh, which off-the-shelf models rarely provide and whose licences complicate a public portfolio piece. We author all models ourselves in Blender (driven via Blender MCP or similar tooling), exporting GLB with a stable part-naming convention that the animation code binds to.

## Consequences

- Less photorealism than purchased assets, in exchange for full control of part separation, mesh naming, polygon budget, and licensing.
- The mesh-naming convention is a contract between the asset pipeline and the animation code; renaming meshes in Blender silently breaks Assembly, so the convention must be documented alongside the models.

## Convention document

The full pipeline (units, scale, export preset, origin rules) and the mesh-naming
contract live in [`src/assets/ASSETS.md`](../../src/assets/ASSETS.md), alongside the
exported GLB files.
