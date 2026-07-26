# 08 — Next.js project scaffold + package install

**What to build:** A working Next.js (App Router, TypeScript) project with Tailwind and shadcn/ui initialised, Vitest (+ React Testing Library) wired for unit tests, and an empty homepage that builds and runs. This is the foundation every other web ticket sits on.

**Blocked by:** None — can start immediately

**Status:** done

- [x] `next` (App Router) + TypeScript project scaffolded, `npm run dev` serves a page
- [x] Tailwind CSS configured and working
- [x] shadcn/ui initialised (`components.json` present, `button.tsx` added to confirm the pipeline)
- [x] Vitest + React Testing Library configured, `npm run test` passes
- [x] Runtime deps installed: `three`, `@react-three/fiber`, `@react-three/drei`, `gsap`, `lenis`
- [x] ESLint/TypeScript strict mode passes with no errors
- [x] `package.json` scripts cover dev/build/test
- [x] Design tokens applied — see Resolution

## Resolution

Scaffold complete on Next.js 16.2.11 / React 19.2.4 / Tailwind v4, with `three` 0.185, `@react-three/fiber` 9.6, `@react-three/drei` 10.7, `gsap` 3.15, `lenis` 1.3 installed.

**The design system landed with this ticket** rather than being left for each UI ticket to invent. `docs/design-system/MASTER.md` (ADR-0004) is the contract; the tokens are implemented in `src/app/globals.css`.

- Tailwind v4 means tokens live in `@theme inline` + `:root` in `globals.css`. There is no `tailwind.config.ts` — do not add one looking for the palette.
- shadcn's token *names* are preserved (`--background`, `--primary`, `--ring`, …) so shadcn components resolve correctly, but every value is repointed to the VANTAK scale. shadcn defaults are overridden deliberately; do not "restore" them.
- Dark only. `:root` carries the dark values directly and `color-scheme: dark` is declared. `.dark` is retained as a no-op class so copied shadcn markup with `dark:` variants keeps working.
- Fonts wired in `layout.tsx` via `next/font/google`: Space Grotesk (`--font-space-grotesk`), DM Sans (`--font-dm-sans`), JetBrains Mono (`--font-jetbrains-mono`), mapped to `--font-heading` / `--font-sans` / `--font-mono`.
- `--destructive` is remapped to amber, not red — a red destructive colour is indistinguishable from the brand accent.
- Utility classes provided for reuse: `.brand-lockup`, `.brand-tagline`, `.hud-label`, `.hud-brackets`, `.tabular`.
- `src/app/page.tsx` holds the Act 1 Hero DOM (brand lockup, tagline, scroll hint) so the system is verifiable before the 3D layer exists. Ticket 12 extends this file; it does not start over.
- `/styleguide` renders the live token reference — ramp, surfaces, measured contrast, type scale, HUD vocabulary, buttons, motion tokens. `noindex`, not linked from the site.

**Gotcha worth keeping:** the corner-bracket pseudo-elements must set border colour with **longhand** properties. `border-top: 1px solid` is a shorthand with no colour term, which resets `border-top-color` to `currentColor` and silently repaints the brackets white. Caught in the browser, not in review.

**Verified:** `npm run test` 2/2 passing, `npx tsc --noEmit` clean, `npm run lint` clean. In-browser: tokens resolve (`body` background `rgb(5,5,6)`, h1 Space Grotesk at `-0.04em` tracking, HUD label `rgb(249,115,22)` at 11px), focus ring renders amber `rgb(251,191,36)` 2px with 2px offset on keyboard Tab, no console errors, and no horizontal overflow at 1280px or 375px.
