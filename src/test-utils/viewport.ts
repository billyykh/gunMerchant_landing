import { vi } from "vitest";

/**
 * Answer media queries as a viewport of the given width would.
 *
 * jsdom parses no CSS and has no layout, so `matchMedia` there answers whatever
 * it is told to. Only the `max-width` form is understood, which is the only
 * form the app asks about.
 */
export function setViewportWidth(width: number) {
  const query = vi.fn((text: string) => {
    const limit = text.match(/max-width:\s*([\d.]+)px/);
    return {
      matches: limit ? width <= Number(limit[1]) : false,
      media: text,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as unknown as MediaQueryList;
  });

  vi.stubGlobal("matchMedia", query);
  return query;
}

/** The `base` breakpoint — where the nav is a sheet and the Parts are a list. */
export const asPhone = () => setViewportWidth(375);
