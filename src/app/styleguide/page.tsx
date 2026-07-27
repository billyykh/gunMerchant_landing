import type { Metadata } from "next";

/**
 * Living token reference for whoever implements tickets 09 and 12–16.
 * Renders the tokens defined in globals.css so the system can be checked in a
 * browser rather than read off a spec. Not linked from the site.
 *
 * Contract: docs/design-system/MASTER.md
 */
export const metadata: Metadata = {
  title: "VANTAK — Style Guide",
  robots: { index: false, follow: false },
};

const thermal = [
  { token: "--thermal-0", hex: "#0A0A0B", role: "Cold. Ambient, inert." },
  { token: "--thermal-1", hex: "#2A1113", role: "Ember shadow, gradient base." },
  { token: "--thermal-2", hex: "#7F1D1D", role: "Dim red. Disabled, dividers." },
  { token: "--thermal-3", hex: "#DC2626", role: "Base red. Borders, glows, fills." },
  { token: "--thermal-4", hex: "#F97316", role: "Readable orange. Hover, accent text." },
  { token: "--thermal-5", hex: "#FBBF24", role: "Amber. Focus ring only." },
  { token: "--thermal-6", hex: "#FFF7ED", role: "White-hot. Text on filled accent." },
];

const surfaces = [
  { token: "--surface-0", hex: "#050506", role: "Page background" },
  { token: "--surface-1", hex: "#0D0D0F", role: "Card, Detail Panel" },
  { token: "--surface-2", hex: "#141416", role: "Popover, command palette" },
  { token: "--surface-3", hex: "#1C1C1F", role: "Input wells, pressed" },
];

const contrast = [
  { fg: "#F4F4F5", label: "--text-primary", ratio: "18.5:1", verdict: "AAA" },
  { fg: "#A1A1AA", label: "--text-secondary", ratio: "7.95:1", verdict: "AAA" },
  { fg: "#F97316", label: "--thermal-4", ratio: "7.27:1", verdict: "AAA" },
  { fg: "#8A8A93", label: "--text-muted", ratio: "5.95:1", verdict: "AA" },
  {
    fg: "#DC2626",
    label: "--thermal-3",
    ratio: "4.21:1",
    verdict: "FAILS AA for normal text — large text (≥24px) and UI borders only",
  },
];

const motion = [
  { token: "--dur-fast", value: "150ms", use: "Hover, focus, colour shifts" },
  { token: "--dur-base", value: "250ms", use: "Callout in, small transforms" },
  { token: "--dur-slow", value: "400ms", use: "Detail Panel enter, scan sweep" },
  { token: "--dur-exit", value: "150ms", use: "All exits — always faster than enters" },
  { token: "--ease-out", value: "cubic-bezier(0.16, 1, 0.3, 1)", use: "Enters" },
  { token: "--ease-in", value: "cubic-bezier(0.4, 0, 1, 1)", use: "Exits" },
];

function Section({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6 border-t border-[var(--border-structural)] pt-8">
      <div className="flex items-baseline gap-4">
        <span className="hud-label">{index}</span>
        <h2 className="text-2xl font-semibold text-text-primary">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function StyleGuide() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-6 py-16 sm:px-12">
      <header className="flex flex-col gap-4">
        <p className="hud-label">{"// VANTAK design system"}</p>
        <h1 className="text-4xl font-semibold text-text-primary">Style Guide</h1>
        <p className="max-w-[65ch] text-text-secondary">
          Live rendering of the tokens in{" "}
          <code className="font-mono text-thermal-4">src/app/globals.css</code>. The
          written contract, including the rules this page cannot show, is{" "}
          <code className="font-mono text-thermal-4">docs/design-system/MASTER.md</code>.
        </p>
      </header>

      <Section index="01" title="Thermal ramp">
        <ul className="flex flex-col gap-2">
          {thermal.map((c) => (
            <li key={c.token} className="flex items-center gap-4">
              <span
                className="h-10 w-10 shrink-0 border border-[var(--border-structural)]"
                style={{ background: c.hex }}
              />
              <code className="w-32 shrink-0 font-mono text-sm text-text-primary">
                {c.token}
              </code>
              <code className="w-20 shrink-0 font-mono text-sm text-text-muted">
                {c.hex}
              </code>
              <span className="text-sm text-text-secondary">{c.role}</span>
            </li>
          ))}
        </ul>
        <div
          className="h-6 w-full"
          style={{ background: "var(--gradient-thermal)" }}
          aria-hidden="true"
        />
      </Section>

      <Section index="02" title="Surfaces">
        <ul className="flex flex-col gap-2">
          {surfaces.map((c) => (
            <li key={c.token} className="flex items-center gap-4">
              <span
                className="h-10 w-10 shrink-0 border border-[var(--border-structural)]"
                style={{ background: c.hex }}
              />
              <code className="w-32 shrink-0 font-mono text-sm text-text-primary">
                {c.token}
              </code>
              <code className="w-20 shrink-0 font-mono text-sm text-text-muted">
                {c.hex}
              </code>
              <span className="text-sm text-text-secondary">{c.role}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section index="03" title="Contrast against --surface-0">
        <p className="max-w-[65ch] text-text-secondary">
          Red is a graphic colour, not a text colour. Anything small and read as
          language uses orange or a neutral.
        </p>
        <ul className="flex flex-col gap-3">
          {contrast.map((c) => (
            <li key={c.label} className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="w-48 shrink-0 text-base" style={{ color: c.fg }}>
                The quick brown fox
              </span>
              <code className="w-40 shrink-0 font-mono text-sm text-text-muted">
                {c.label}
              </code>
              <code className="w-16 shrink-0 font-mono text-sm text-text-primary">
                {c.ratio}
              </code>
              <span className="text-sm text-text-secondary">{c.verdict}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section index="04" title="Typography">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <span className="hud-label">Display — brand lockup</span>
            <p className="brand-lockup text-text-primary">VANTAK</p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="hud-label">Tagline — mono, 0.32em tracking</span>
            <p className="brand-tagline text-sm">Thermal Hunting Specialists</p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="hud-label">Heading — Space Grotesk</span>
            <h3 className="text-3xl font-semibold text-text-primary">
              Bolt-action precision, field-proven
            </h3>
          </div>
          <div className="flex flex-col gap-2">
            <span className="hud-label">Body — DM Sans, 16px / 1.5</span>
            <p className="max-w-[65ch] text-text-secondary">
              Body copy never drops below 16px and never exceeds 65ch. Secondary
              text carries explanation; muted text carries only what a reader can
              afford to miss.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="hud-label">Numerals — tabular</span>
            <ul className="flex flex-col gap-1">
              <li className="tabular text-text-primary">$ 4,280.00</li>
              <li className="tabular text-text-primary">$ 11,940.00</li>
              <li className="tabular text-text-primary">$ 890.00</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section index="05" title="HUD vocabulary">
        <div className="flex flex-wrap items-start gap-8">
          <div className="hud-brackets border border-[var(--border-hud)] bg-surface-1/90 px-4 py-3">
            <span className="hud-label">03/08 &mdash; Rifle_Bolt</span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="h-px w-24"
              style={{ background: "var(--gradient-thermal)" }}
            />
            <span className="h-[3px] w-[3px] rounded-full bg-thermal-6" />
            <span className="hud-label">Leader line + anchor</span>
          </div>
          <div
            className="border border-[var(--border-hud)] px-4 py-3"
            style={{ boxShadow: "var(--glow-thermal)" }}
          >
            <span className="hud-label">Active &mdash; glow</span>
          </div>
        </div>
        <p className="max-w-[65ch] text-sm text-text-muted">
          Corner brackets only, never a closed frame. Only one glowing element on
          screen at a time — more than one means the hierarchy is broken.
        </p>
      </Section>

      <Section index="06" title="Buttons">
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            className="min-h-11 rounded-md bg-thermal-3 px-5 font-medium text-thermal-6 transition-colors hover:bg-thermal-4"
            style={{ transitionDuration: "var(--dur-fast)" }}
          >
            Add to loadout
          </button>
          <button
            type="button"
            className="min-h-11 rounded-md border border-[var(--input)] px-5 font-medium text-text-primary transition-colors hover:bg-white/[0.06]"
            style={{ transitionDuration: "var(--dur-fast)" }}
          >
            View specs
          </button>
          <button
            type="button"
            className="min-h-11 rounded-md px-5 font-medium text-text-secondary transition-colors hover:text-thermal-4"
            style={{ transitionDuration: "var(--dur-fast)" }}
          >
            Compare
          </button>
        </div>
        <p className="max-w-[65ch] text-sm text-text-muted">
          Tab through these — the focus ring is amber, never red, so focus is never
          mistaken for hover. Minimum hit area is 44×44px.
        </p>
      </Section>

      <Section index="07" title="Motion">
        <ul className="flex flex-col gap-2">
          {motion.map((m) => (
            <li key={m.token} className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <code className="w-28 shrink-0 font-mono text-sm text-thermal-4">
                {m.token}
              </code>
              <code className="w-56 shrink-0 font-mono text-sm text-text-primary">
                {m.value}
              </code>
              <span className="text-sm text-text-secondary">{m.use}</span>
            </li>
          ))}
        </ul>
      </Section>
    </main>
  );
}
