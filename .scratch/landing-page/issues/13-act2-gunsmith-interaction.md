# 13 — Act 2 Gunsmith interaction

**What to build:** Interactive inspection of the assembled Hero Rifle in the Gunsmith View. Hovering a placeholder Part shows a HUD Callout (leader line + label); clicking opens a Detail Panel populated from the ticket-09 catalog fixture (name, specs, placeholder price, CTA), closable via a close control, click-away, or Escape. The assembled rifle parallaxes gently with mouse movement.

**Blocked by:** 11 — Persistent canvas + scroll spine + Assembly (placeholder Parts), 09 — Catalog fixture + search command palette

**Status:** ready-for-agent

- [ ] Hovering a Part in the Gunsmith View shows a HUD Callout (leader line + name) anchored to that Part
- [ ] Clicking a Part opens a Detail Panel with that Part's name/specs/price/CTA sourced from the catalog fixture
- [ ] Detail Panel closes via a close control, clicking away, or pressing Escape
- [ ] Assembled Hero Rifle parallaxes subtly with mouse movement in the Gunsmith View (no orbit/drag controls)
- [ ] On touch devices, tap substitutes for hover to trigger Callout and Detail Panel
- [ ] Detail Panel and Callout are keyboard-reachable/operable, not mouse-only

## Design

Contract: `docs/design-system/MASTER.md` §5 (HUD language), §7 (Callout, Detail Panel). This ticket builds the two components the whole HUD vocabulary rests on — get them right and ticket 14 is a reuse.

**Callout**

- [ ] Label uses `.hud-label` (mono, uppercase, 11px, `0.08em`, `--thermal-4`) over `--surface-1` at 90%, 1px `--border-hud` border, with `.hud-brackets` corner marks
- [ ] Leader line is 1px painted with `--gradient-thermal`, terminating in a 3px anchor dot at the Part
- [ ] Enters `opacity 0→1` + `y 6px→0` over `--dur-base` / `--ease-out`; exits over `--dur-exit`
- [ ] Optional index prefix reads `03/08` in the same mono style

**Detail Panel**

- [ ] Right-side panel, width `min(420px, 92vw)`, `--surface-1`, 1px left border `--border-hud`, corner brackets top-left and bottom-left only — **brackets, never a closed frame**
- [ ] Slides `translateX(24px)→0` + fade over `--dur-slow` / `--ease-out`; exits over `--dur-exit`
- [ ] Exactly **one** scan sweep on open — a single 400ms downward gradient pass, never looped. Infinite animation is reserved for loading indicators.
- [ ] Contents in order: category (mono, `--thermal-4`), product name (h2, Space Grotesk), spec list (mono `.tabular`, thin `--thermal-2` rules between rows), placeholder price, primary CTA (filled `--thermal-3`, `--thermal-6` text)
- [ ] Focus is trapped while open and returned to the triggering element on close; use the Radix primitive's `aria-modal` semantics rather than hand-rolling
- [ ] Mobile: becomes a bottom sheet at 92vh

**Both**

- [ ] Only one glowing element (`--glow-thermal`) on screen at a time — two means the hierarchy is broken
- [ ] Keyboard equivalence for 3D hover: Parts are tabbable in Detail Panel trigger order and open the same panel
- [ ] No red text below 24px

