import type { Act } from "@/lib/scene-state";
import { ACT_SECTION_ATTRIBUTE } from "@/lib/act-sections";

interface ActSectionProps {
  act: Act;
  className?: string;
  children: React.ReactNode;
}

/**
 * One Act's DOM section, tagged so the reduced-motion path can tell which Act
 * the visitor is looking at. The only place the marker attribute is written.
 */
export function ActSection({ act, className, children }: ActSectionProps) {
  return (
    <section {...{ [ACT_SECTION_ATTRIBUTE]: act }} className={className}>
      {children}
    </section>
  );
}
