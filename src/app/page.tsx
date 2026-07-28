/**
 * The three Acts as DOM.
 *
 * The persistent WebGL canvas is fixed behind all of this and never unmounts;
 * these sections are what scrolls over it, and what gives the scroll spine its
 * runway. Because the canvas is `aria-hidden`, the narrative has to live here
 * as real text — a screen reader user gets the Acts, not an empty page.
 *
 * Tickets 12–14 fill Acts 2 and 3 with their Callouts and Detail Panels.
 *
 * Visual contract: docs/design-system/MASTER.md
 */
import { ActSection } from "@/components/act-section";
import { SceneLayer } from "@/components/scene/scene-layer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <>
      <SceneLayer />
      <SiteHeader />

      <main className="relative z-10 flex flex-1 flex-col">
        <ActSection
          act="hero"
          // Top padding clears the fixed 64px header rather than tucking the
          // Act marker under it.
          className="flex min-h-screen flex-col justify-between px-6 pt-24 pb-12 sm:px-12 lg:px-16"
        >
          <p className="hud-label">{"// 01 — Act 1"}</p>

          <div className="flex flex-col gap-6">
            <h1 className="brand-lockup text-text-primary">VANTAK</h1>
            <p className="brand-tagline text-xs sm:text-sm">
              Thermal Hunting Specialists
            </p>
          </div>

          {/* Hidden under reduced motion: nothing assembles on that path, and
              a hint promising an animation that will not play is a caption for
              a different page. Done in CSS so this stays a server component —
              the preference is the browser's to answer. */}
          <div className="scroll-hint flex items-center gap-3" aria-hidden="true">
            <span
              className="h-px w-16"
              style={{ background: "var(--gradient-thermal)" }}
            />
            <span className="hud-label">Scroll to assemble</span>
          </div>
        </ActSection>

        <ActSection
          act="gunsmith"
          className="flex min-h-[180vh] flex-col justify-center px-6 sm:px-12 lg:px-16"
        >
          <p className="hud-label">{"// 02 — Act 2"}</p>
          <h2 className="mt-4 font-heading text-4xl text-text-primary sm:text-5xl">
            Gunsmith View
          </h2>
          <p className="mt-4 max-w-[65ch] text-text-secondary">
            Every Part of the rifle, laid out for inspection.
          </p>
        </ActSection>

        <ActSection
          act="lineup"
          className="flex min-h-[180vh] flex-col justify-center px-6 sm:px-12 lg:px-16"
        >
          <p className="hud-label">{"// 03 — Act 3"}</p>
          <h2 className="mt-4 font-heading text-4xl text-text-primary sm:text-5xl">
            The Lineup
          </h2>
          <p className="mt-4 max-w-[65ch] text-text-secondary">
            The rifle among the gear it goes to the field with.
          </p>
        </ActSection>
      </main>

      <SiteFooter />
    </>
  );
}
