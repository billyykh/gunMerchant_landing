# 01 — Blender pipeline & Part-naming convention setup

**What to build:** A documented, repeatable Blender → GLB export pipeline (units, scale, pivot/origin rules, export settings) and the Part-naming convention that every subsequent model must follow, so that Assembly code and every future asset ticket bind to a stable contract instead of guessing. Document lives alongside the models per ADR-0002.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] Blender scene unit/scale convention chosen and documented (matches real-world rifle scale in metres, consistent with R3F scene expectations)
- [x] GLB export preset defined (applied transforms, Y-up, draco/compression posture, one GLB per asset) and documented
- [x] Part-naming convention documented for the Hero Rifle (barrel, receiver, bolt, stock, scope, magazine, bipod, muzzle brake) — exact mesh name strings the animation code will bind to
- [x] Origin/pivot convention documented per Part (e.g. pivot at the Part's attachment point, not bounding-box center) so Assembly transforms are predictable
- [x] Convention doc committed at `src/assets/ASSETS.md` (alongside the models per ADR-0002) and cross-referenced from ADR-0002

## Resolution

Convention documented at [`src/assets/ASSETS.md`](../../../src/assets/ASSETS.md). Blender scene set to Metric/meters (1 BU = 1 m), Blender 5.2 LTS. ADR-0002 updated with a pointer. Frontier now: tickets 02 and 04–07 (all unblocked).
