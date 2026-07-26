# VANTAK visual system: dark-only, thermal-ramp accent, restrained HUD

The landing page needed a documented visual system before any UI ticket could be
implemented without improvisation. Tickets 08–16 described *what* to build but not
how it should look, so every implementer would have invented their own palette,
type scale, and motion timings.

The system is specified in full in `docs/design-system/MASTER.md`. The decisions
worth recording here, because they constrain code:

**Dark only.** No light mode, `color-scheme: dark` declared globally. A single
persistent WebGL canvas sits behind the DOM for the whole page; a light DOM
background produces a visible seam wherever a section is transparent over the
canvas, and the 3D scene is lit for a near-black environment. Supporting both
schemes would mean two lighting rigs.

**Accent is a thermal ramp, not a single red.** Cold black → ember → red → orange →
white-hot, literalising the "Thermal Hunting Specialists" tagline. Heat encodes
attention: inert elements are cold, the focused element is hottest.

**Red is a graphic colour, not a text colour.** `#DC2626` measures 4.21:1 against
the `#050506` background — below the WCAG AA 4.5:1 threshold for normal text, though
it passes for large text (≥24px) and non-text UI boundaries (3:1). Orange `#F97316`
(7.27:1) carries all small accent text instead. This is the constraint most likely
to be violated by someone reaching for the brand colour by reflex.

**Typography: Space Grotesk + DM Sans + JetBrains Mono.** Considered against a
military-poster pairing (Bebas Neue) and a gaming pairing (Russo One / Chakra Petch).
The gaming pairing tracked closest to the Call of Duty Gunsmith reference but reads
as a game UI rather than a premium equipment brand; Space Grotesk keeps the technical
character while letting the 3D asset supply the tactical register.

**HUD intensity is medium.** Corner brackets, leader lines, mono readouts, and a
single non-looping scan sweep. Rejected: persistent full-screen crosshair, ambient
coordinate readouts, scanline overlays, glitch effects. Those belong to
Retro-Futurism and would compete with the 3D scene, which is the page's protagonist.

**Elevation is drawn, not blurred.** Borders and background steps instead of drop
shadows, which read as light-mode material and disappear on near-black. A thermal
glow marks the single active element.

## Consequences

- shadcn/ui defaults must be overridden, not accepted — its default radius, shadows,
  and neutral palette all fight this system. Radius drops to 2px throughout.
- `--destructive` is remapped to amber, because a red destructive colour is
  indistinguishable from the brand accent. Acceptable here only because the page is
  frontend-only with no destructive actions; any future destructive action needs an
  outline and an explicit label, not colour alone.
- Amber `#FBBF24` is reserved exclusively for focus rings so focus is never mistaken
  for a hover state. It must not be used as a hover or accent colour.
- Every UI ticket (09, 12–16) carries the accessibility floor from MASTER.md §8 in
  its acceptance criteria; the checklist in §10 gates delivery.
