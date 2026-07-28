# VANTAK 3D Assets — Pipeline & Naming Convention

This is the **contract** between the Blender asset pipeline (ADR-0002) and the
Assembly / Scene State code. The animation code binds to the mesh names below.
**Never rename a mesh casually** — a rename silently breaks Assembly.

Models are **sourced from free Sketchfab assets and normalised in Blender**
(ADR-0003): pick wanted variants, strip armatures, decimate to budget, rename to
this contract, fix origins/scale, re-export as GLB into this directory.

## Where the files live

- **Contract exports** — `public/models/*.glb`. These are the files the page
  loads, so they must be served at a URL: drei's `useGLTF` fetches them, and
  Next.js serves only `public/`. Referenced in code as `/models/<name>.glb`.
- **Raw Sketchfab downloads** — this directory, under their download names.
  They are never loaded by the page; they are kept for provenance and for
  re-running the normalisation.

## Source files & provenance

Code only ever loads the contract-named exports.

| Raw file          | Contract export          | 
| ----------------- | ------------------------ | 
| `rifle.glb`       | `hero-rifle.glb`         | 
| `rifle.glb` (scope meshes) | `night-vision-scope.glb`|
| `crate.glb`       | `ammo-box.glb`           | 
| `drone.glb`       | `thermal-drone.glb`      | 
| `flashlight.glb`  | `torch.glb`              | 


## Scene units & orientation

- **Units:** Metric, `1 Blender unit = 1 meter`. Length unit = meters.
- **Real-world scale:** the Hero Rifle is an M24-style bolt-action, overall
  length ≈ `1.16 m`. Model to real proportions; do not eyeball-scale in code.
- **Axes (Blender authoring):**
  - `+X` = muzzle / forward (barrel points toward +X)
  - `+Z` = up (scope sits on top, +Z)
  - `+Y` = the rifle's left side
- **glTF export up-axis:** `+Y up` (glTF default → three.js / R3F native). The
  exporter converts Blender-Z-up to glTF-Y-up automatically; author in Blender's
  Z-up as above and let the exporter handle it.

## Export settings (one preset, applied to every asset)

- **Format:** glTF Binary (`.glb`), one file per asset.
- **Transforms:** apply all transforms before export → every exported object has
  `scale = (1,1,1)`, `rotation = (0,0,0)`. Location is meaningful (see origins).
- **Include:** selected objects of the asset only (no lights/cameras).
- **+Y up:** on. **Compression:** off for now (revisit if payload too heavy).
- **Materials:** exported. **Apply modifiers:** on.
- **Every material must export `alphaMode: OPAQUE`.** These are solid props; none
  of them is glass. Sourced assets routinely arrive with an alpha channel wired
  into Principled Alpha, or with a stray sub-1.0 alpha value — Blender then
  exports `alphaMode: BLEND` and the prop renders see-through, most visibly under
  coloured rim light. Before exporting: unlink Alpha, set it to `1.0`, and set
  `blend_method = 'OPAQUE'`. Audit the finished GLB and fail on any `BLEND`/`MASK`.

### Export also needs the window override

`bpy.ops.export_scene.gltf` dereferences `bpy.context.active_object` and hits the
same restricted-context `AttributeError` as the importer. Wrap the export call in
the same `temp_override` described under the import gotchas below.

## Importing the raw Sketchfab files (gotchas)

These cost real time to find; anyone re-running the normalisation needs them.

- **Import needs a real window context.** Driving Blender headlessly (e.g. over
  MCP), `bpy.ops.import_scene.gltf` fails on any rigged file — `bpy.context.object`
  and `bpy.context.window` are absent, so the importer's armature paths raise
  `AttributeError`. Wrap the call in
  `bpy.context.temp_override(window=…, screen=…, area=…, region=…)` taken from
  `bpy.context.window_manager.windows[0]`.
- **Rigged meshes carry no usable object transform.** In `rifle.glb` and
  `crate.glb` the meshes are skinned: `matrix_world` reads as identity and the real
  placement comes from bone deformation. Reading `matrix_world` and baking it gives
  geometry ~100× off. Bake through the evaluated depsgraph instead —
  `bpy.data.meshes.new_from_object(obj.evaluated_get(dg), depsgraph=dg)`, then
  `mesh.transform(obj.evaluated_get(dg).matrix_world)`. This resolves skinning,
  modifiers and parenting in one step.
- **Capture before you mutate.** Unparenting objects inside a loop makes every
  later `matrix_world` read in that same loop stale.
- **`bound_box` is cached.** After `mesh.transform()` it reports pre-transform
  values; measure from vertex coordinates instead.
- Kit variants are stacked along **Z**, not hidden: the default configuration is
  the layer all default parts share, with alternatives offset above or below it.
- Sketchfab files wrap geometry in a `Sketchfab_model → root → GLTF_SceneRootNode`
  empty chain, and often ship a large backdrop `Icosphere`. Both get discarded.

## Origin / pivot convention

- **Author every Part in its final ASSEMBLED position.** The mesh's local
  transform as exported == the assembled pose. Assembly code treats the exported
  transform as the "assembled" keyframe.
- **The Exploded pose is computed in code**, not authored — code offsets each
  Part outward from the assembled pose along a scatter vector. (If a Part needs a
  hand-authored exploded offset later, it ships as sidecar data, never as a
  second mesh.)
- **Each Part's origin sits at its attachment/pivot point** — where it mates to
  the receiver (e.g. the bolt's origin at the bolt-face seat, the scope's origin
  at its rail clamp), NOT the bounding-box center. This keeps Assembly
  interpolation and any per-Part rotation readable.
- **Each Gear Item's origin sits at its base**, on the object's own vertical
  axis — these are props that stand on a surface, and the Lineup arranges them
  on a shared floor. A shared `y` is then a shared floor rather than a
  coincidence, and the showcase rotation turns an object on the spot instead of
  swinging it around a point in mid-air.

## Measured sizes

Bounding size of each contract export, in metres, from the GLB accessor bounds.
**The Act 3 Lineup arrangement is authored against these numbers**
(`src/lib/scene-state.ts`), so re-exporting an asset at a different size moves
the composition. Re-measure and update this table if you do.

| Export                   | W × H × D (m)         | Note                        |
| ------------------------ | --------------------- | --------------------------- |
| `hero-rifle.glb`         | 1.16 × 0.19 × 0.11    | overall length, per spec    |
| `thermal-drone.glb`      | 0.45 × 0.19 × 0.33    | widest Gear Item            |
| `ammo-box.glb`           | 0.36 × 0.36 × 0.42    | measured open               |
| `night-vision-scope.glb` | 0.26 × 0.14 × 0.13    |                             |
| `torch.glb`              | 0.13 × 0.03 × 0.03    | smallest — 9× shorter than the rifle |

The nine-to-one spread between the rifle and the torch is real and is not to be
corrected in code: the Lineup composes around it with depth and framing (see the
`LINEUP_ARRANGEMENT` comment), never by scaling a model away from its true size.

## Hero Rifle — `hero-rifle.glb`

Single GLB. A root Empty named `HeroRifle` parents all Parts. Each Part is a
separately named mesh. Exact name strings (the binding contract):

| Mesh name          | Part          |
| ------------------ | ------------- |
| `Rifle_Barrel`     | barrel        |
| `Rifle_Receiver`   | receiver      |
| `Rifle_Bolt`       | bolt          |
| `Rifle_Stock`      | stock         |
| `Rifle_Scope`      | scope         |
| `Rifle_Magazine`   | magazine      |
| `Rifle_Bipod`      | bipod         |
| `Rifle_MuzzleBrake`| muzzle brake  |

- 8 Parts (within the spec's 6–9 range).
- PascalCase, `Rifle_` prefix groups them and namespaces against Gear Items.
- The Gear Item night-vision scope is a **separate** asset — do not confuse it
  with `Rifle_Scope` (see below).

## Gear Items — one GLB each

Single root object per file (mesh or Empty named as below).

| File                     | Root object name       | Item              |
| ------------------------ | ---------------------- | ----------------- |
| `ammo-box.glb`           | `Gear_AmmoBox`         | ammo box          |
| `thermal-drone.glb`      | `Gear_ThermalDrone`    | thermal drone     |
| `torch.glb`              | `Gear_Torch`           | torch             |
| `night-vision-scope.glb` | `Gear_NightVisionScope`| night-vision scope|

- `Gear_` prefix; PascalCase.
- Hunting jacket is out of scope (stretch only).

## Material naming

- `Mat_Metal_Dark` — primary near-black gunmetal.
- `Mat_Metal_Mid` — lighter machined metal.
- `Mat_Accent_Red` — HUD red accent.
- `Mat_Glass` — scope/optics lenses.
- `Mat_Polymer` — matte polymer (stock, grips).

Reuse these across assets so the Lineup reads as one visual system.

## Polygon budget (real-time)

Desktop-first, but keep it lean for mobile: Hero Rifle target ≤ ~40k tris total
across all Parts; each Gear Item ≤ ~8k tris.

### As-shipped

| Export                   | Tris   | Size    | Budget | Note                      |
| ------------------------ | ------ | ------- | ------ | ------------------------- |
| `hero-rifle.glb`         | 40,713 | 9.93 MB | ~40k   | on budget                 |
| `ammo-box.glb`           | 8,000  | 3.25 MB | ~8k    | on budget                 |
| `night-vision-scope.glb` | 7,769  | 1.22 MB | ~8k    | on budget                 |
| `torch.glb`              | 1,464  | 1.01 MB | ~8k    | well under                |
| `thermal-drone.glb`      | 30,000 | 2.32 MB | ~8k    | **deviation — see below** |

Total contract payload ≈ 17.7 MB.

**Thermal drone budget deviation.** The 8k Gear Item guideline assumes a single
compact prop. The drone is four arms, four motors, eight rotor blades, landing
legs and a camera gimbal — geometry that thin and disconnected collapses badly
under aggressive decimation. Tested at 8k the shell shattered into visible shards
and the gimbal was destroyed; at 30k the model is visually indistinguishable from
the 430k original. 30k was chosen as the lowest tested ratio that holds up. It is
still a 93% reduction from source, and 30k tris is immaterial for a desktop-first
WebGL scene.

## Material naming in practice

The shared names above describe visual *slots*. Each sourced asset carries its own
textures, so assets cannot literally share one `Mat_Metal_Dark` datablock.
Convention: **`Mat_<Slot>_<Asset>`** for a per-asset variant targeting that slot —
e.g. `Mat_Metal_Dark_Torch`, `Mat_Metal_Dark_AmmoBox`, `Mat_Glass_NightVision`.

Two further rules learned while normalising:

- **glTF factors must stay in `[0,1]`.** Darkening via a Mix(Multiply) node ahead
  of Base Color exports cleanly as `baseColorFactor`. A roughness *boost* cannot —
  a `roughnessFactor` above 1 is out of spec — so bake the boost into the
  metallic-roughness texture's green channel and leave the factor at 1.
- **Don't flatten textured materials to solid colours.** Consolidating the drone's
  45 materials into 4 flat ones was tried and reverted: it destroyed the
  carbon-fibre weave and panel definition, and the model read as a black blob.
  Where a sourced asset's materials already carry the detail, keep them and retint
  in place instead — the drone's blue/purple emissives were swung to HUD red with
  every texture preserved.
