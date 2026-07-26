# 09 — Catalog fixture + search command palette

**What to build:** A single static catalog fixture covering both Hero Rifle Parts and Gear Items (id, name, category, specs, placeholder price) as the one source of truth for Detail Panels and search. A header search trigger opens a shadcn Command palette (also via Cmd/Ctrl+K) that filters this fixture live — typing "thermal" surfaces the thermal drone and night-vision scope. Fully keyboard operable.

**Blocked by:** 08 — Next.js project scaffold + package install

**Status:** ready-for-agent

- [ ] One catalog fixture module exports all Parts (barrel, receiver, bolt, stock, scope, magazine, bipod, muzzle brake) and Gear Items (ammo box, thermal drone, torch, night-vision scope) with id/name/category/specs/price
- [ ] Search trigger control opens a shadcn Command palette
- [ ] Cmd/Ctrl+K opens the same palette from anywhere on the page
- [ ] Typing "thermal" returns the thermal drone and night-vision scope (and excludes non-matches)
- [ ] Palette fully operable by keyboard (open, navigate results, select, close/Escape)
- [ ] Vitest coverage for catalog search/filter logic (matching, case-insensitivity, empty query, no-match)

## Design

Contract: `docs/design-system/MASTER.md` §7 (Command palette). Tokens are already implemented in `globals.css`; `/styleguide` renders them live.

- [ ] **The search trigger is a button, not a fake input.** It shows the `⌘K` / `Ctrl K` hint inline. A text-shaped control that doesn't accept text is a known dark pattern and breaks keyboard expectations — do not render an `<input>` that only opens a dialog.
- [ ] Palette surface is `--surface-2`; the query input uses `--font-mono`
- [ ] Results grouped by catalog category, each row showing name + price; prices use `.tabular` so figures align
- [ ] Empty state is a single mono line, not an illustration
- [ ] Focus returns to the search trigger when the palette closes (Escape or selection)
- [ ] No red text below 24px anywhere in the palette — accent text uses `--thermal-4`

The catalog is also the data source for Detail Panels (tickets 13/14), so include the fields those panels render: category, spec list, and placeholder price.

