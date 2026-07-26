# 09 — Catalog fixture + search command palette

**What to build:** A single static catalog fixture covering both Hero Rifle Parts and Gear Items (id, name, category, specs, placeholder price) as the one source of truth for Detail Panels and search. A header search trigger opens a shadcn Command palette (also via Cmd/Ctrl+K) that filters this fixture live — typing "thermal" surfaces the thermal drone and night-vision scope. Fully keyboard operable.

**Blocked by:** 08 — Next.js project scaffold + package install

**Status:** done

- [x] One catalog fixture module exports all Parts (barrel, receiver, bolt, stock, scope, magazine, bipod, muzzle brake) and Gear Items (ammo box, thermal drone, torch, night-vision scope) with id/name/category/specs/price
- [x] Search trigger control opens a shadcn Command palette
- [x] Cmd/Ctrl+K opens the same palette from anywhere on the page
- [x] Typing "thermal" returns the thermal drone and night-vision scope (and excludes non-matches)
- [x] Palette fully operable by keyboard (open, navigate results, select, close/Escape)
- [x] Vitest coverage for catalog search/filter logic (matching, case-insensitivity, empty query, no-match)

## Design

Contract: `docs/design-system/MASTER.md` §7 (Command palette). Tokens are already implemented in `globals.css`; `/styleguide` renders them live.

- [ ] **The search trigger is a button, not a fake input.** It shows the `⌘K` / `Ctrl K` hint inline. A text-shaped control that doesn't accept text is a known dark pattern and breaks keyboard expectations — do not render an `<input>` that only opens a dialog.
- [ ] Palette surface is `--surface-2`; the query input uses `--font-mono`
- [ ] Results grouped by catalog category, each row showing name + price; prices use `.tabular` so figures align
- [ ] Empty state is a single mono line, not an illustration
- [ ] Focus returns to the search trigger when the palette closes (Escape or selection)
- [ ] No red text below 24px anywhere in the palette — accent text uses `--thermal-4`

The catalog is also the data source for Detail Panels (tickets 13/14), so include the fields those panels render: category, spec list, and placeholder price.

## Resolution

`src/lib/catalog.ts` (fixture + search, 16 tests) and `src/components/catalog-search.tsx` (trigger + palette, 13 tests).

**The catalog is keyed by the GLB contract names.** An entry's `id` is `Rifle_Barrel`, `Gear_ThermalDrone` and so on, so a Part clicked in the 3D scene resolves to its Detail Panel content with `findCatalogEntry(meshName)` — no lookup table between the scene graph and the copy. A test asserts the key set matches `PART_NAMES` + `GEAR_NAMES` exactly, so adding a Gear Item without its catalog entry fails.

**The `id` is deliberately not searched.** It is a pipeline contract name, not language a visitor would type, and matching it would surface `Rifle_MuzzleBrake` semantics in a product search. Search covers name, category, and every spec label and value — which is what makes "thermal" reach the night-vision scope at all: the word appears only in its `Sensor` spec, never in its name. That is asserted directly rather than assumed.

**cmdk's own filtering is off (`shouldFilter={false}`).** Its fuzzy matcher only sees each item's `value`, so it could not match on specs, and the ticket's "thermal" requirement would have failed. Results and grouping come from `searchCatalog` + `groupByCategory` instead.

**Categories render in a fixed order** (`Rifle System`, `Optics`, `Support`, `Field Gear`), so results do not reshuffle between keystrokes. Empty categories are dropped rather than rendered as bare headings.

**The empty state is rendered directly, not via `CommandEmpty`,** whose visibility depends on cmdk's internal filtered count — which is exactly the mechanism turned off above.

### The shadcn defaults that had to go

MASTER.md §7 says not to accept them, and three fought the system:

- `command.tsx` and `dialog.tsx` shipped `rounded-xl!` / `rounded-lg!` — 12px and 8px radii, with `!important`, against the system's 2px. Overriding from the call site would have been an `!important` fight that Tailwind's utility ordering decides, not class order, so the vendored components were edited instead. Verified in the browser: the palette renders at `border-radius: 2px`.
- The search control is a **button**, never an `<input>` that only opens a dialog. It carries the `⌘K` / `Ctrl K` hint inline.
- `--popover` already resolves to `--surface-2`, so the palette surface came out right by token. Confirmed as `rgb(20, 20, 22)` in the browser.

**Platform hint via `useSyncExternalStore`.** The ⌘/Ctrl label genuinely differs between server and client. The obvious `useEffect` + `setState` is what `react-hooks/set-state-in-effect` exists to catch; the store's third argument is the server snapshot, which is precisely this problem.

### A bug jsdom could not see

The palette opened but the first keystroke went nowhere: Base UI's popup took focus itself rather than passing it to the query box. **jsdom reported the query box focused either way** — the unit test passed against broken behaviour. Found by driving the real browser and reading `document.activeElement`.

The first fix, Base UI's `initialFocus` prop, stopped the dialog opening at all — also invisible to jsdom, which kept passing. `autoFocus` on the input is what actually works.

### Verified in the browser

Palette opens, query box takes focus, typing `thermal` narrows to exactly Night-Vision Clip-On (Optics) and Thermal Recon Drone (Field Gear). Palette surface `rgb(20,20,22)`, radius `2px`, query box and prices in JetBrains Mono with `tabular-nums`, prices in `--text-muted`. A sweep of every element rendering its own text found **no red below 24px**.

**Not confirmable in this pane:** the close path. Base UI keeps the popup mounted until its exit animation ends, and the browser pane does not composite frames, so the animation runs forever and the element never unmounts. `data-closed` and `data-ending-style` do appear, so the close is being registered. Escape-closes, select-closes, and focus-returns-to-trigger are covered by unit tests; re-check them by hand when the header lands in ticket 12.

**Note for ticket 12:** `<CatalogSearch />` currently sits at the top of `src/app/page.tsx` purely so the palette is reachable before a Header exists. Move it into the Header; it needs no props.

**Note for tickets 13/14:** `findCatalogEntry(id)` and `formatPrice(price)` are the Detail Panel's data path.

Verified: 71/71 tests pass, `npx tsc --noEmit` clean, `npm run lint` clean, `npm run build` succeeds.

