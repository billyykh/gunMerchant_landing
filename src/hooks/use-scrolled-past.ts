"use client";

import * as React from "react";

/**
 * Whether the page is scrolled beyond `threshold` pixels.
 *
 * Read through `useSyncExternalStore` rather than an effect writing state: the
 * scroll position is genuinely external, it differs between server and client,
 * and the server snapshot (`false`) is the honest answer for a document that
 * has never been scrolled. Mirroring it into state instead would hydrate
 * transparent and then correct itself in a visible flash.
 *
 * Deliberately boolean, not a pixel value. A header that re-renders on every
 * scroll frame is the jank this page is built to avoid; crossing a threshold
 * happens twice.
 */
export function useScrolledPast(threshold: number): boolean {
  const subscribe = React.useCallback((onStoreChange: () => void) => {
    window.addEventListener("scroll", onStoreChange, { passive: true });
    return () => window.removeEventListener("scroll", onStoreChange);
  }, []);

  return React.useSyncExternalStore(
    subscribe,
    () => window.scrollY > threshold,
    () => false
  );
}
