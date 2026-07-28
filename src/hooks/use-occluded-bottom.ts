"use client";

import * as React from "react";

import { PAGE_CLOSE_ATTRIBUTE } from "@/lib/page-close";

/**
 * Whether the page's closing surface has come into view.
 *
 * The compact breakpoint's hotspot list is a bar fixed to the bottom of the
 * window, and the footer arrives underneath it — leaving it up puts the Lineup's
 * chips over the footer's own links while the objects they name are behind an
 * opaque surface. `useOccludedBottom` answers the same question for the canvas,
 * but per frame and as a ref; this is the reactive form the DOM needs.
 */
export function usePageCloseInView(): boolean {
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const close = document.querySelector(`[${PAGE_CLOSE_ATTRIBUTE}]`);
    if (!close) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      // Any part of it at all: once the page has started closing, the scene
      // behind it is not what the visitor is looking at any more.
      { threshold: 0 }
    );

    observer.observe(close);
    return () => observer.disconnect();
  }, []);

  return inView;
}

/**
 * How many pixels of the viewport's bottom edge the page's closing surface has
 * covered.
 *
 * The canvas never unmounts and is fixed at full viewport, so the footer rides
 * up over the Lineup rather than arriving after it. Without this the last two
 * Gear Items keep their hotspots while their objects are behind an opaque
 * surface: a bare dot painted on the footer, and a tab stop that opens a Detail
 * Panel for something the visitor cannot see.
 *
 * A ref, not state — this is read inside `useFrame`. Measured on scroll and
 * resize rather than per frame, because `getBoundingClientRect` forces layout
 * and doing that sixty times a second to learn a number that only changes when
 * the page moves is how a scroll-driven page starts dropping frames.
 */
export function useOccludedBottom(): React.RefObject<number> {
  const occluded = React.useRef(0);

  React.useEffect(() => {
    const close = document.querySelector<HTMLElement>(
      `[${PAGE_CLOSE_ATTRIBUTE}]`
    );
    if (!close) return;

    const measure = () => {
      occluded.current = Math.max(
        0,
        window.innerHeight - close.getBoundingClientRect().top
      );
    };

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure, { passive: true });

    // The footer's own height changes as it reflows across breakpoints, which
    // moves its top edge without any scrolling having happened.
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(close);

    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      resizeObserver.disconnect();
    };
  }, []);

  return occluded;
}
