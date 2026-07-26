# 15 — Footer

**What to build:** A minimal footer closing the page below the Lineup, with the brand mark and placeholder links, so the page ends deliberately instead of trailing off.

**Blocked by:** 08 — Next.js project scaffold + package install

**Status:** ready-for-agent

- [ ] Footer renders brand mark and a small set of placeholder links
- [ ] Footer is keyboard operable and readable on both desktop and mobile
- [ ] Footer sits below all three Acts as the final element on the page
- [ ] Footer carries a credits link listing each model's title, author, and licence, sourced from the provenance table in `src/assets/ASSETS.md`

## Design

Contract: `docs/design-system/MASTER.md` §3–§4.

- [ ] Background `--surface-0` with a 1px top border `--border-structural`; no shadow
- [ ] Brand mark in Space Grotesk with the same `-0.04em` tracking as the Act 1 lockup, at a small size
- [ ] Links: DM Sans, `--text-secondary`, hover `--thermal-4` over `--dur-fast`
- [ ] Credits and legal microcopy use `.hud-label` or `--text-muted` (`#8A8A93`, 5.95:1 — the floor; nothing dimmer)
- [ ] Vertical rhythm `--space-8`; 44×44px minimum link hit areas with 8px spacing
- [ ] No red text below 24px

