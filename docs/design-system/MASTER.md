# VANTAK Design System — Master

Source of truth for every visual decision on the VANTAK landing page. Implementers
read this before writing UI. Where a ticket and this document disagree, this
document wins; raise the conflict rather than improvising.

Glossary terms (Act, Part, Callout, Detail Panel, Gear Item, Lineup, HUD, Scene
State) are defined in the repo-root `CONTEXT.md` and used verbatim here.

Recorded as ADR-0004.

---

## 1. Direction

| Dimension       | Decision                                                                 |
| --------------- | ------------------------------------------------------------------------ |
| Product type    | E-commerce Luxury × Gaming — precision instrument, not a product grid     |
| Primary style   | 3D & Hyperrealism over Dark Mode (OLED)                                  |
| Landing pattern | Scroll-Triggered Storytelling (Act 1 → Assembly → Act 2 → drop → Act 3)  |
| Motion tier     | Complex — pin + scrub scroll spine                                       |
| Density         | Low/spacious — marketing surface, not a dashboard                        |
| Colour scheme   | **Dark only.** No light mode. `color-scheme: dark` is declared globally. |

The 3D scene is the protagonist. DOM UI is restrained instrumentation layered over
it — never decoration competing with it. When in doubt, remove the UI element.

**Anti-patterns for this project** (from the style database's "Do Not Use For"
column on 3D & Hyperrealism): heavy data tables, dense forms, and anything that
depends on the canvas being absent. There are none of these on this page by design.

---

## 2. Colour

### 2.1 Thermal ramp

The accent system is a real thermal-imaging ramp (cold black → ember → red →
orange → white-hot), chosen to literalise the tagline "Thermal Hunting
Specialists". Heat = attention. A cold element is inert; a white-hot element is
the single most important thing on screen.

| Token           | Hex       | Role                                                    |
| --------------- | --------- | ------------------------------------------------------- |
| `--thermal-0`   | `#0A0A0B` | Cold. Ambient, unlit, inert.                            |
| `--thermal-1`   | `#2A1113` | Ember shadow. Glow falloff, gradient base stop.         |
| `--thermal-2`   | `#7F1D1D` | Dim red. Inactive/disabled accent, dividers.            |
| `--thermal-3`   | `#DC2626` | **Base red.** Brand accent, borders, glows, large type. |
| `--thermal-4`   | `#F97316` | **Readable orange.** Hover, active, small accent text.  |
| `--thermal-5`   | `#FBBF24` | Amber. Focus ring only. Never a hover state.            |
| `--thermal-6`   | `#FFF7ED` | White-hot. Text on filled accent; peak emphasis.        |

Gradient for HUD sweeps and Callout leader lines:

```css
--gradient-thermal: linear-gradient(
  90deg,
  var(--thermal-1) 0%,
  var(--thermal-3) 45%,
  var(--thermal-4) 80%,
  var(--thermal-6) 100%
);
```

### 2.2 CRITICAL — red is a graphic colour, not a text colour

Measured against the page background `#050506`:

| Foreground          | Contrast | Verdict                                            |
| ------------------- | -------- | -------------------------------------------------- |
| `#DC2626` (red)     | **4.21:1** | ✗ **Fails WCAG AA for normal text.** Passes for large text (≥24px, or ≥18.66px bold) and for non-text UI boundaries (3:1). |
| `#F97316` (orange)  | 7.27:1   | ✓ AAA — use this for any accent text below 24px.   |
| `#FBBF24` (amber)   | 12.20:1  | ✓ Focus ring, unmistakable.                        |
| `#F4F4F5` (primary) | 18.5:1   | ✓ AAA                                              |
| `#A1A1AA` (secondary)| 7.95:1  | ✓ AAA                                              |
| `#8A8A93` (muted)   | 5.95:1   | ✓ AA                                               |

`#FFF7ED` on a filled `#DC2626` button measures 4.55:1 ✓ AA — filled red buttons
are fine, red *text* is not.

**Rule:** red renders borders, rules, glows, fills, and display-size headings.
Anything small and read-as-language uses orange or a neutral. This is the single
easiest way to fail an accessibility pass on this page.

### 2.3 Surfaces & neutrals

| Token        | Hex       | Use                                             |
| ------------ | --------- | ----------------------------------------------- |
| `--surface-0`| `#050506` | Page background. Near-black, OLED-friendly.     |
| `--surface-1`| `#0D0D0F` | Card, Detail Panel body.                        |
| `--surface-2`| `#141416` | Popover, command palette, elevated surfaces.    |
| `--surface-3`| `#1C1C1F` | Input wells, pressed states.                    |

Neutrals are very slightly cool so the thermal accents read warmer by contrast.

The page background must stay genuinely near-black: the WebGL canvas sits behind
the DOM, and any lift in the DOM background produces a visible seam where a
transparent section overlaps the canvas.

### 2.4 Destructive colour collision

shadcn's `--destructive` is red by default, which is indistinguishable from the
brand accent here. This page has no destructive actions (frontend only, no cart
mutations), so `--destructive` is mapped to amber `#FBBF24` with a solid outline.
If a genuinely destructive action is ever added, it must be distinguished by an
outline + explicit label, never by colour alone.

---

## 3. Typography

Pairing: **Space Grotesk** (headings) + **DM Sans** (body) + **JetBrains Mono**
(HUD readouts). Loaded via `next/font/google`, self-hosted, `display: swap`.

| Role       | Family        | Token            |
| ---------- | ------------- | ---------------- |
| Display / headings | Space Grotesk | `--font-heading` |
| Body / UI  | DM Sans       | `--font-sans`    |
| HUD data   | JetBrains Mono| `--font-mono`    |

### 3.1 Scale

| Step        | Size / line-height   | Use                                      |
| ----------- | -------------------- | ---------------------------------------- |
| `display`   | `clamp(3.5rem, 11vw, 9rem)` / 0.92 | Act 1 brand lockup "VANTAK"  |
| `h1`        | `clamp(2.5rem, 6vw, 4rem)` / 1.05  | Act headings                 |
| `h2`        | `2rem` / 1.15        | Detail Panel product name                |
| `h3`        | `1.25rem` / 1.3      | Panel subsections                        |
| `body`      | `1rem` / 1.5         | Paragraphs. Never below 16px for body.   |
| `small`     | `0.875rem` / 1.5     | Secondary copy                           |
| `hud`       | `0.6875rem` / 1.4    | Mono readouts, Callout labels            |

`hud` is 11px — permitted because it is a short non-prose label, always uppercase,
always ≥ 7:1 contrast. Never set a sentence at this size.

### 3.2 Treatments

- **Brand lockup**: Space Grotesk 700, `letter-spacing: -0.04em`. Tight tracking at
  display size; the negative tracking is what makes it read as a mark rather than a word.
- **Tagline** "Thermal Hunting Specialists": JetBrains Mono 400, uppercase,
  `letter-spacing: 0.32em`, `--text-secondary`. The wide tracking against the tight
  lockup is the core typographic contrast of the brand.
- **HUD labels**: JetBrains Mono 500, uppercase, `letter-spacing: 0.08em`.
- **Numerals** (prices, specs): JetBrains Mono with `font-variant-numeric: tabular-nums`
  so figures align in the Detail Panel spec list.
- Body copy max width `65ch`.

---

## 4. Space, shape, elevation

Spacious scale (marketing surface):

```
--space-1: 4px    --space-5: 32px
--space-2: 8px    --space-6: 48px
--space-3: 12px   --space-7: 64px
--space-4: 16px   --space-8: 96px
--space-9: 128px
```

Section rhythm: `--space-8` vertical between DOM blocks; `--space-9` for Act
boundaries.

**Radius: `--radius: 2px`.** Near-sharp corners throughout. This is a precision
instrument brand — rounded corners read as consumer software and undercut it. The
only exception is the cart badge, which is a pill.

**Elevation is drawn, not blurred.** No soft drop shadows — they read as light-mode
material and get lost on near-black anyway. Surfaces separate via:

1. a 1px border (`rgba(255,255,255,0.10)` structural, `--thermal-3` at 30% for HUD),
2. a background step from the surface scale,
3. optionally a thermal glow: `box-shadow: 0 0 24px -6px rgba(220,38,38,0.45)`.

Glow is reserved for the active/focused element. More than one glowing element on
screen at a time means the hierarchy is broken.

---

## 5. HUD language (intensity: medium — restrained)

The HUD is instrumentation, not chrome. It appears **only** where it carries
meaning. There is no persistent full-screen crosshair, no ambient coordinate
readout, no always-on grid — those were considered and rejected as competing with
the 3D scene.

Permitted HUD vocabulary:

- **Corner brackets** — 12px L-shaped 1px rules at the corners of a Detail Panel or
  focused Callout. Brackets only; never a closed rectangle frame.
- **Leader line** — 1px line from a Callout label to its Part anchor point, painted
  with `--gradient-thermal`, with a 3px dot at the anchor.
- **Mono readout** — uppercase `hud`-step label, optionally prefixed with a
  `//` or index like `03/08`.
- **Thin rule** — 1px `--thermal-2` divider inside panels.
- **Scan sweep** — a single downward gradient pass, 400ms, **once** on Detail Panel
  open. Never looped. (UX guideline #12: infinite animation is reserved for loading
  indicators.)

Explicitly out: scanline overlays on the whole viewport, CRT curvature, glitch
effects, animated noise. Those belong to Retro-Futurism, which this project is not.

---

## 6. Motion

| Token          | Value                            | Use                                  |
| -------------- | -------------------------------- | ------------------------------------ |
| `--dur-fast`   | `150ms`                          | Hover, focus, colour shifts          |
| `--dur-base`   | `250ms`                          | Callout in, small transforms         |
| `--dur-slow`   | `400ms`                          | Detail Panel enter, scan sweep       |
| `--dur-exit`   | `150ms`                          | All exits                            |
| `--ease-out`   | `cubic-bezier(0.16, 1, 0.3, 1)`  | Enters                               |
| `--ease-in`    | `cubic-bezier(0.4, 0, 1, 1)`     | Exits                                |

**Exits are always faster than enters** — a UI that lingers on the way out feels
unresponsive.

### 6.1 Scroll spine

The Assembly and the Act 2 → 3 drop are **scrubbed**, not timed. From the motion
database, tier "Scroll Reveal / Complex":

```js
gsap.timeline({
  scrollTrigger: {
    trigger: section,
    start: 'top top',
    end: '+=150%',
    scrub: 1,
    pin: true,
  },
});
```

Notes that apply here:

- In React, wrap every timeline in `useGSAP(() => {...}, { scope: containerRef })` so
  timelines are reverted on unmount. A leaked ScrollTrigger across an Act boundary is
  the most likely source of scroll jank on this page.
- `scrub: 1` (not `true`) — the 1s catch-up smooths the mechanical feel of raw
  scroll input and pairs correctly with Lenis.
- Lenis and ScrollTrigger must share a ticker; do not run two independent RAF loops.
- Animate `transform` and `opacity` only. Never animate `width`, `height`, `top`, or
  `left` — they force layout on every scroll frame.

### 6.2 DOM motion

- Callout enter: `opacity 0→1`, `y 6px→0`, `--dur-base`, `--ease-out`.
- Detail Panel: slides from the right edge, `translateX(24px)→0` + fade,
  `--dur-slow`. Exit `--dur-exit`.
- Gear Item hover float-up is a 3D transform in the canvas, not DOM — see ticket 14.
- Header background/blur crossfade on scroll: `--dur-base`.

### 6.3 Reduced motion

`prefers-reduced-motion: reduce` is a first-class path, not a fallback:

- No scrub, no pin, no Lenis. Native scrolling.
- Each Act renders as a **static composed view** — the Hero Rifle assembled, the
  Lineup arranged — selected by which Act's DOM section is in view.
- Hover and click interactions (Callout, Detail Panel, showcase) still work; they
  cross-fade with `--dur-fast` instead of transforming.
- The scan sweep and all glows become static.

---

## 7. Components

Base: shadcn/ui on Radix, restyled to the tokens. Do not accept shadcn defaults —
the default radius, shadow, and neutral palette all fight this system.

### Header
Fixed. Transparent over Act 1 (`background: transparent`, no border). Once
`scrollY > 24`, crossfades to `rgba(5,5,6,0.72)` + `backdrop-filter: blur(12px)` +
1px bottom border `rgba(255,255,255,0.08)`. Height 64px. Contents: wordmark (Space
Grotesk 700, tracking `-0.04em`), 3–4 nav links (DM Sans 500, 14px,
`--text-secondary`, hover `--thermal-4`), search trigger, cart.

Search trigger is a **button showing the `⌘K` / `Ctrl K` hint inline** — not a fake
input. A text-shaped control that doesn't accept text is a known dark pattern and
breaks keyboard expectations.

Cart: `lucide-react` icon, 44×44px hit area, badge pill `--thermal-3` background
with `--thermal-6` numerals. The badge count must also be exposed to screen readers
as text (`aria-label="Cart, 3 items"`), never colour/shape alone.

### Command palette
shadcn `Command` in a dialog on `--surface-2`. Mono input. Results grouped by
catalog category, each row showing name + mono price. Empty state is a mono line,
not an illustration. Opens on `⌘K` / `Ctrl+K` and on trigger click. Escape closes.
Focus returns to the trigger on close.

### Callout
Label + leader line + anchor dot. Label: `hud` step, `--thermal-4`,
`--surface-1` at 90% opacity behind it, 1px `--thermal-3` at 40% border, corner
brackets. Enters `--dur-base`. On touch, tap substitutes for hover.

### Detail Panel
Right-side panel, width `min(420px, 92vw)`, `--surface-1`, 1px left border
`--thermal-3` at 30%, corner brackets top-left and bottom-left, one scan sweep on
open. Contents: category (mono, `--thermal-4`), product name (`h2`), spec list
(mono, tabular numerals, thin rules between), placeholder price (display weight),
primary CTA (filled `--thermal-3`, `--thermal-6` text).

Closes on the close control, Escape, or click-away. Focus trapped while open,
returned to the triggering element on close. `aria-modal` semantics via the Radix
primitive — do not hand-roll.

### Buttons
- **Primary**: filled `--thermal-3`, text `--thermal-6`, 2px radius, hover
  `--thermal-4`, `--dur-fast`.
- **Secondary**: transparent, 1px `rgba(255,255,255,0.14)` border, text
  `--text-primary`, hover `background: rgba(255,255,255,0.06)`. The border does
  **not** change on hover.
- **Ghost**: text only, `--text-secondary`, hover `--thermal-4`.

**Bordered controls change background on hover, never border colour.** A border
that turns `--thermal-3` on hover puts a lit red outline on every control the
pointer crosses, which fights the one-glowing-element rule (§4) and reads as a
selected or error state rather than a hover. A background lift is quieter, is
the same gesture on every bordered control, and leaves red for the things that
have earned it. Applies to the search trigger and secondary buttons alike; text
controls (nav links, ghost buttons) still shift to `--thermal-4`.

Minimum hit area 44×44px including on desktop icon buttons. Minimum 8px between
adjacent targets.

### Loading
3D assets are heavy (≈17.7 MB of GLB). Act 1 shows a mono progress readout
(`LOADING ASSETS 42%`) with a 1px thermal progress rule — a determinate readout
driven by drei's `useProgress`, not an indeterminate spinner. Reserve the layout so
nothing shifts when it resolves (CLS < 0.1).

---

## 8. Accessibility floor

Non-negotiable, checked before any UI ticket closes:

- Body text ≥ 16px; all text ≥ 4.5:1 (see §2.2 — the red rule).
- Focus visible on every interactive element: 2px `--thermal-5` outline with 2px
  offset. **Never** remove the focus ring. Amber is used *only* for focus so focus
  is never mistaken for hover.
- Full keyboard operation of header, palette, Detail Panels, footer. 3D hover
  interactions have a keyboard-reachable equivalent — Parts and Gear Items are
  listed in the Detail Panel trigger order, tabbable, and open the same panel.
- Touch targets 44×44px minimum, 8px spacing.
- `prefers-reduced-motion` honoured per §6.3.
- The canvas is `aria-hidden` with the narrative available as DOM text — a screen
  reader user gets the Act headings and product content, not an empty page.
- No information conveyed by colour alone (cart badge, Callout state, availability).

---

## 9. Responsive

Desktop-first by decision; mobile downscales rendering, never content.

| Breakpoint | Width     | Behaviour                                                        |
| ---------- | --------- | ---------------------------------------------------------------- |
| base       | < 640px   | Single column. Nav collapses to a sheet. Detail Panel becomes a bottom sheet at 92vh. DPR capped at 1.5, simplified lighting. Display step floors at 3.5rem. |
| `sm`       | ≥ 640px   | Hero type scales up.                                             |
| `md`       | ≥ 768px   | Nav links visible inline.                                        |
| `lg`       | ≥ 1024px  | Full desktop composition, Detail Panel as a right-side panel.    |
| `xl`       | ≥ 1280px  | Canvas framing widens; type caps out.                            |

Never horizontal-scroll. Never disable zoom (`user-scalable=no` is forbidden).
Respect safe-area insets on mobile for the fixed header and bottom sheet.

---

## 10. Pre-delivery checklist

- [ ] No raw hex in components — every colour resolves through a token.
- [ ] No red text below 24px anywhere (§2.2).
- [ ] Focus ring visible and amber on every interactive element.
- [ ] All icons are SVG (`lucide-react`). No emoji as icons, ever.
- [ ] Reduced-motion path renders a complete, usable page.
- [ ] Nothing animates `width`/`height`/`top`/`left`.
- [ ] Only one glowing element on screen at a time.
- [ ] Touch targets 44×44px; 8px apart.
- [ ] Canvas `aria-hidden`; narrative content present in DOM.
- [ ] No layout shift when 3D assets resolve.
- [ ] Keyboard-only pass completes the full page including both Detail Panel paths.
