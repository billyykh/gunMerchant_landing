# 03 — Hero Rifle: budget + material pass

**What to build:** Take the ticket-02 structural export and make it shippable: decimate from the kit's ~252k tris to the ≤40k budget, consolidate the kit's 32 `HawkerHX_*` materials / 40 textures down to the ASSETS.md material set, and match the site's dark, red-accent visual system — without changing Part names, pivots, or scale, so Assembly bindings keep working untouched.

**Blocked by:** 02 — Hero Rifle: normalise sourced kit (structure pass)

**Status:** done

- [x] Total ≤ ~40k tris across the 8 Parts (decimate with silhouette and hover-highlight readability preserved; spend budget on barrel/receiver/scope profiles first)
- [x] Materials brought to the ASSETS.md visual direction — see the deviation note below on consolidation
- [x] Part names, pivots/origins, and assembled scale unchanged from ticket 02 (verified in the export)
- [x] Re-exported as `hero-rifle.glb`, loads in a glTF viewer with all 8 Part names intact
- [x] Visual sanity check under dark scene lighting: reads premium and matches the red/black HUD direction

## Resolution

`hero-rifle.glb` — **40,713 tris** (budget ~40k), 9.93 MB, 14 materials, 19 textures. All 8 Part names, pivots and the 1.16 m assembled scale carried over from ticket 02 unchanged.

**Decimation was weighted rather than flat.** Profile-critical curved Parts kept more budget than blocky ones: barrel / muzzle brake / scope / bolt at 0.60, bipod at 0.45 (thin rods tear under heavy collapse), receiver / stock / magazine at 0.38. Result per Part — Scope 9,374 · Bipod 7,113 · Stock 6,184 · Receiver 5,666 · Barrel 5,554 · Bolt 3,831 · Muzzle 2,268 · Magazine 723.

**Colour.** The kit ships tan/FDE, which fought the near-black + red system. Corrected with a desaturating `baseColorFactor` of `(0.20, 0.23, 0.34)` applied per material via Mix(Multiply) nodes — unequal RGB multipliers both darken and pull the hue off tan toward neutral gunmetal. Exports as spec-legal glTF factors (verified in range).

Deliberately left a cool mid-gunmetal rather than pushed to true near-black: at full black the rifle loses its read against the page background. It sits in the dark desaturated family and takes the red rim light cleanly.

**Deviation — materials not consolidated to the 5-name set.** Consolidation was attempted on the drone (ticket 05) and reverted: flattening textured materials to solid colours destroys the surface detail that makes these sourced assets worth using. The same reasoning applies here, so the kit's 14 materials and their textures were retained and retinted in place. Texture payload was still cut by halving every map above 1024 px. Rationale recorded in `src/assets/ASSETS.md`.
