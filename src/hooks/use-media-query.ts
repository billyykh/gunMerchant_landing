"use client";

import * as React from "react";

/**
 * Whether a media query currently matches.
 *
 * Subscribed rather than read once: every query this page asks about can change
 * mid-session — a window is resized, a phone is turned, a visitor turns reduced
 * motion on while reading.
 *
 * `false` is the server snapshot for every caller. There is no platform to ask
 * on the server, and the markup is built for the full desktop path; a query
 * that wants the opposite default has to say so at the call site.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query]
  );

  const getSnapshot = React.useCallback(
    () => window.matchMedia(query).matches,
    [query]
  );

  return React.useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/**
 * The `base` breakpoint — below `sm` (MASTER.md §9), where the nav collapses to
 * a sheet, the Detail Panel becomes a bottom sheet, and the canvas drops its
 * pixel ratio and half its lights.
 */
export function useIsCompact(): boolean {
  return useMediaQuery("(max-width: 639.98px)");
}
