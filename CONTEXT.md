# VANTAK Landing

Frontend-only portfolio landing page for VANTAK, a fictional modern hunting outfitter ("Thermal Hunting Specialists"). The page is a three-Act, scroll-driven 3D product experience.

## Language

**Act**:
One of the three scroll-driven stages of the page: Hero (Act 1), Gunsmith (Act 2), Lineup (Act 3).
_Avoid_: section, scene, stage

**Hero Rifle**:
The M24-style bolt-action rifle that anchors all three Acts.
_Avoid_: gun, weapon, the model

**Part**:
An independently animatable mesh of the Hero Rifle (barrel, receiver, bolt, stock, scope, magazine, bipod, muzzle brake).
_Avoid_: component, piece, attachment

**Exploded**:
The dispersed arrangement of Parts floating behind the brand type in Act 1.

**Assembly**:
The scroll-driven transition of Parts from Exploded to the fully assembled Hero Rifle.
_Avoid_: build animation, morph

**Gunsmith View**:
Act 2's interactive inspection of the assembled Hero Rifle, styled after Call of Duty's Gunsmith screen.

**Drop**:
The scroll-driven transition of the assembled Hero Rifle from the Gunsmith View down into the Lineup.
_Avoid_: fall, transition, Act 3 intro

**Callout**:
The HUD leader-line and label that appears when a Part or Gear Item is hovered.
_Avoid_: tooltip, annotation

**Hotspot**:
The control a Part or Gear Item is reached through — a DOM button held over the
canvas at the point the object projects to, carrying its Callout and opening its
Detail Panel. The Part is the thing; the hotspot is the handle on it.
_Avoid_: marker, pin, hitbox

**Detail Panel**:
The slide-in panel showing specs, placeholder price, and CTA for a clicked Part or Gear Item.
_Avoid_: modal, dialog, popup

**Gear Item**:
An interactive 3D product in the Lineup: ammo box, thermal drone, torch, night-vision scope, hunting jacket.
_Avoid_: accessory, product model

**Lineup**:
Act 3's arrangement of Gear Items that the Hero Rifle falls into at the end of Act 2.
_Avoid_: showcase, grid

**Scene State**:
The complete description of what the 3D scene shows at a given scroll position — Part transforms, camera pose, active Act, and interaction availability.

**HUD**:
The overlay UI aesthetic used across the page — corner brackets, leader lines, monospaced data readouts, thermal accents on near-black. Its vocabulary is closed and specified in `docs/design-system/MASTER.md` §5 (ADR-0004); anything not listed there is not HUD.
_Avoid_: overlay, chrome
