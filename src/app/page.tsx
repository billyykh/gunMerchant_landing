/**
 * Act 1 Hero — DOM layer only.
 *
 * The persistent WebGL canvas (ticket 11) mounts behind this and the header
 * (ticket 12) mounts above it. This file holds the brand lockup, tagline, and
 * scroll hint so the design system is live and verifiable before the 3D layer
 * lands. Ticket 12 extends it; it does not need to start over.
 *
 * Visual contract: docs/design-system/MASTER.md
 */
export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col justify-between overflow-hidden px-6 py-12 sm:px-12 lg:px-16">
      <p className="hud-label">{"// 01 — Act 1"}</p>

      <div className="flex flex-col gap-6">
        <h1 className="brand-lockup text-text-primary">VANTAK</h1>
        <p className="brand-tagline text-xs sm:text-sm">
          Thermal Hunting Specialists
        </p>
      </div>

      <div className="flex items-center gap-3" aria-hidden="true">
        <span
          className="h-px w-16"
          style={{ background: "var(--gradient-thermal)" }}
        />
        <span className="hud-label">Scroll to assemble</span>
      </div>
    </main>
  );
}
