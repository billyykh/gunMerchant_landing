"use client";

import { useMediaQuery } from "./use-media-query";

/**
 * Whether the visitor has asked their platform for reduced motion.
 *
 * On this page that is not a cosmetic downgrade: it switches the whole scroll
 * spine off — no pin, no scrub, no Lenis — and renders a composed still per
 * Act instead (MASTER.md §6.3). The preference can change mid-session, which is
 * why `useMediaQuery` subscribes rather than reading once.
 *
 * `false` is the server snapshot: on the server there is no platform to ask,
 * and the animated path is what the markup is built for.
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
