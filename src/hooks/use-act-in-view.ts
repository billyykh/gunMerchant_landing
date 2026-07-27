"use client";

import * as React from "react";
import type { Act } from "@/lib/scene-state";
import { ACT_SECTION_ATTRIBUTE } from "@/lib/act-sections";

/**
 * Which Act's DOM section is currently in view.
 *
 * This is the reduced-motion path's selector (MASTER.md §6.3): with no scroll
 * spine running there is no progress value, so the composed still is chosen by
 * what the visitor has actually scrolled to.
 */
export function useActInView(enabled: boolean): Act {
  const [act, setAct] = React.useState<Act>("hero");

  React.useEffect(() => {
    if (!enabled) return;

    const sections = document.querySelectorAll<HTMLElement>(
      `[${ACT_SECTION_ATTRIBUTE}]`
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Several sections can straddle the viewport at once; the one covering
        // the most of it is the one the visitor is looking at.
        const winner = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        const name = winner?.target.getAttribute(ACT_SECTION_ATTRIBUTE);
        if (name) setAct(name as Act);
      },
      { threshold: [0.25, 0.5, 0.75] }
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, [enabled]);

  return act;
}
