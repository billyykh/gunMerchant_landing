# Spec: VANTAK Landing Page — Three-Act Scroll-Driven 3D Experience

Status: ready-for-agent

## Problem Statement

Online firearm and hunting-gear storefronts are almost universally flat grids of product thumbnails. A visitor cannot appreciate the build quality, modularity, or scale of a precision rifle from a JPEG. VANTAK ("Thermal Hunting Specialists") wants a landing page where the product itself is the storytelling device — the visitor watches the Hero Rifle come together and explores the gear ecosystem around it, the way a game like Call of Duty lets players inspect a weapon in its Gunsmith screen.

This is a frontend-only portfolio piece: the brand, products, and prices are fictional placeholder data.

## Solution

A single scrolling page structured as three Acts over one persistent 3D scene:

- **Act 1 — Hero.** The visitor lands on the brand name in large type with the Hero Rifle's Parts floating Exploded in the dark behind it. A HUD-styled header offers logo, search, nav, and cart.
- **Act 1 → 2 — Assembly.** As the visitor scrolls, the Parts fly together and the Hero Rifle assembles, scrubbed directly by scroll position (scrolling back up disassembles it).
- **Act 2 — Gunsmith View.** The assembled Hero Rifle presents itself for inspection. Hovering a Part shows a HUD Callout; clicking opens a Detail Panel with specs, placeholder price, and CTA. The rifle subtly parallaxes with mouse movement.
- **Act 2 → 3 — The drop.** Continued scrolling sends the Hero Rifle moving and falling down into the Lineup.
- **Act 3 — Lineup.** The Hero Rifle lands among the Gear Items (ammo box, thermal drone, torch, night-vision scope). Hovering a Gear Item makes it float up; clicking triggers an auto-rotate showcase plus its Detail Panel.
- **Footer.** Minimal footer closes the page. No further content sections for now.

Visual direction: dark, immersive, red-on-near-black, HUD overlay elements (thin lines, monospaced data readouts). Tagline: "Thermal Hunting Specialists".

## User Stories

1. As a visitor, I want the brand name and tagline to hit me full-screen on arrival, so that I immediately know whose site I'm on and what they stand for.
2. As a visitor, I want to see the Hero Rifle's Parts floating Exploded behind the hero type, so that I sense this is a premium, technical product experience from the first frame.
3. As a visitor, I want a subtle scroll hint in Act 1, so that I know the page rewards scrolling.
4. As a visitor, I want the Parts to assemble smoothly into the Hero Rifle as I scroll, so that I experience the product's modularity as a story rather than a spec sheet.
5. As a visitor, I want Assembly scrubbed to my scroll position (reversing when I scroll up), so that I feel in direct control of the animation rather than watching a video.
6. As a visitor, I want the camera to frame the action throughout Assembly, so that the rifle is always composed well on screen regardless of where I stop scrolling.
7. As a visitor in the Gunsmith View, I want a Part to highlight with a HUD Callout when I hover it, so that I can tell which Parts are explorable.
8. As a visitor in the Gunsmith View, I want clicking a Part to open a Detail Panel with its name, specs, and placeholder price, so that I can inspect the product like a Gunsmith screen.
9. As a visitor, I want the Detail Panel to close via a close control, clicking away, or pressing Escape, so that I'm never trapped in it.
10. As a visitor in the Gunsmith View, I want the Hero Rifle to parallax gently with my mouse, so that the scene feels alive and dimensional.
11. As a visitor, I want continued scrolling past the Gunsmith View to send the Hero Rifle falling into the Lineup, so that the page transitions with momentum instead of a hard cut.
12. As a visitor in the Lineup, I want to see the Hero Rifle sitting among the Gear Items, so that I understand VANTAK sells a whole hunting ecosystem, not just one rifle.
13. As a visitor in the Lineup, I want a Gear Item to float up with a Callout when I hover it, so that I can tell each item is interactive.
14. As a visitor in the Lineup, I want clicking a Gear Item to auto-rotate it in a showcase pose and open its Detail Panel, so that I can examine it from all sides without dragging.
15. As a shopper, I want a search control in the header that opens a command palette (also via Cmd/Ctrl+K), so that I can find products quickly.
16. As a shopper, I want search results drawn from the product catalog fixture, so that typing "thermal" surfaces the thermal drone and night-vision scope.
17. As a shopper, I want a cart icon with an item-count badge in the header, so that the page reads as a real store.
18. As a visitor, I want nav links in the header, so that the page reads as part of a larger site.
19. As a visitor, I want the header transparent over the hero and blurred/backed once I scroll, so that it never fights the 3D scene for attention.
20. As a visitor, I want a loading indicator while 3D assets stream in, so that a heavy first load never looks broken.
21. As a visitor on a mid-range laptop, I want the page to hold smooth frame rates through all three Acts, so that the experience feels premium rather than janky.
22. As a mobile visitor, I want the full three-Act experience at reduced rendering quality, so that the story survives on my phone without melting it.
23. As a mobile visitor, I want tap to substitute for hover on Parts and Gear Items, so that Callouts and Detail Panels remain reachable without a mouse.
24. As a motion-sensitive visitor with prefers-reduced-motion set, I want static composed views of each Act instead of scroll-driven animation, so that I can browse without discomfort.
25. As a keyboard user, I want all DOM UI (header, search palette, Detail Panels, footer) operable by keyboard, so that the page is not mouse-only.
26. As a visitor, I want a minimal footer with brand mark and placeholder links, so that the page ends deliberately.
27. As the maintainer, I want all product content (names, specs, prices) in one catalog fixture, so that swapping placeholder data for real data later touches one place.
28. As the maintainer, I want the Hero Rifle and Gear Items loaded from self-authored GLB files with a documented Part-naming convention, so that models can be re-exported from Blender without breaking Assembly.

## Implementation Decisions

- **Stack**: Next.js (App Router, TypeScript), React Three Fiber + drei for the 3D layer, GSAP ScrollTrigger (scrubbed timelines) + Lenis smooth scrolling for the scroll spine, shadcn/ui + Tailwind for DOM UI. See ADR-0001.
- **One persistent canvas**: a single full-viewport WebGL canvas fixed behind the DOM for the entire page. Acts are DOM scroll sections layered above it; the canvas is never unmounted or swapped between Acts.
- **Scene State seam**: a pure module derives Scene State (Part transforms, camera pose, active Act, interaction availability) from global scroll progress. Rendering consumes Scene State; it never computes narrative logic itself. This is the project's single primary seam.
- **Assets**: models sourced from free Sketchfab downloads and normalised in Blender to the documented naming convention — variant selection, armature stripping, decimation to budget, renaming, origin fixes, GLB re-export (see ADR-0003; supersedes the self-authored pipeline of ADR-0002). Hero Rifle comes from a modular sniper kit reduced to its default configuration, split into 8 Parts (barrel, receiver, bolt, stock, scope, magazine, bipod, muzzle brake), each a separately named mesh. Gear Items: ammo box (military ammo pack model), thermal drone, torch, night-vision scope (extracted from the rifle kit's scope meshes). Hunting jacket is a stretch asset (cloth is hard; only attempt after the rest ships). Sketchfab attribution is recorded per asset and surfaced on the site.
- **Act 2 interaction**: hover → Callout (HUD leader line + name); click → Detail Panel (slide-in shadcn surface with specs, placeholder price, CTA). Mouse parallax only — no orbit/drag controls, avoiding conflict with scroll gestures.
- **Act 3 interaction**: hover → the Gear Item floats up with a Callout; click → auto-rotate showcase pose + Detail Panel. No drag controls.
- **Catalog**: one static fixture of placeholder products (id, name, category, specs, price) powering Detail Panels and search results. No backend.
- **Header**: logo, search trigger opening a shadcn command palette (Cmd/Ctrl+K) over the catalog fixture, 3–4 placeholder nav links, cart icon with a static badge count. Transparent at top; blurred background once scrolled.
- **Visual system**: specified in full in `docs/design-system/MASTER.md` (ADR-0004) — that document is the contract, and where a ticket disagrees with it, it wins. Summary: dark only (no light mode, since a light DOM background seams against the persistent canvas); accent is a thermal ramp (cold black → ember → red → orange → white-hot) literalising the tagline; typography is Space Grotesk / DM Sans / JetBrains Mono; HUD intensity is medium — corner brackets, leader lines, mono readouts, one non-looping scan sweep, and explicitly no full-screen crosshair or scanline overlay; radius 2px throughout; elevation is drawn with borders and background steps, not blurred shadows. Brand: VANTAK. Tagline: "Thermal Hunting Specialists".
- **The red-text constraint**: the brand red `#DC2626` measures 4.21:1 on the `#050506` background and **fails WCAG AA for normal text**. It is a graphic colour — borders, rules, glows, fills, and display-size headings only. All small accent text uses orange `#F97316` (7.27:1). Amber `#FBBF24` is reserved exclusively for focus rings so focus is never mistaken for hover. This is the constraint most likely to be broken by reaching for the brand colour by reflex.
- **Live token reference**: `/styleguide` renders the token system in the browser (ramp, surfaces, measured contrast, type scale, HUD vocabulary, buttons, motion). Not linked from the site; `noindex`.
- **Performance posture**: desktop-first. Mobile keeps all three Acts with reduced device pixel ratio, simplified lighting/effects, and tap interactions. `prefers-reduced-motion` renders static composed views per Act with no scrub animation.
- **Frontend only**: no cart logic, no checkout, no auth, no server data.

## Testing Decisions

- A good test exercises external behavior, never implementation details: given a scroll progress value, the Scene State module returns the expected Act, Part transforms, and interaction availability — without touching WebGL.
- Modules under test: Scene State derivation (the single seam — Act boundaries, Assembly progress mapping, reversal symmetry, reduced-motion variants) and catalog search/filtering.
- 3D rendering, materials, and animation feel are verified visually in the browser, not by unit tests.
- Prior art: none — greenfield repo. Establish Vitest for unit tests; an optional Playwright smoke pass (page loads, Acts reachable by scroll, Detail Panel opens and closes) may come later.

## Out of Scope

- Real ecommerce mechanics: cart state, checkout, payments, auth, order history.
- Backend, CMS, or real product data — everything ships from the local fixture.
- Compliance surfaces (age verification, legal disclaimers) — fictional portfolio piece.
- Additional landing sections (2D product grid, brand story, testimonials, newsletter) — deliberately deferred; the page is three Acts + footer for now.
- Internationalisation.
- The hunting jacket Gear Item (stretch; ships only if time allows after the core four Gear Items).

## Further Notes

- All firearm content is fictional and non-operational — this is a visual portfolio piece for a hunting outfitter brand.
- The user pre-approved proceeding without a separate seam review ("plan looks good, just do a /to-spec, other agent will implement"); the Scene State seam above is the expectation to hold.
- The Part-naming convention is a contract between the Blender pipeline and the animation code; document it wherever the models live and never rename meshes casually (ADR-0002).
- Glossary for all capitalised terms (Act, Part, Assembly, Callout, Detail Panel, Gear Item, Lineup, Scene State, HUD) lives in the repo-root CONTEXT.md — implementers should use these terms verbatim in code and tickets.
- Every UI ticket carries the accessibility floor from `docs/design-system/MASTER.md` §8 in its acceptance criteria, and the pre-delivery checklist in §10 gates delivery. Neither is optional, and neither is restated in full per ticket — read the source.
- shadcn/ui defaults must be overridden rather than accepted: its default radius, shadows, and neutral palette all fight this system.
