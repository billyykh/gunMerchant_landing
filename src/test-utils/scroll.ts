import { act } from "@testing-library/react";

/**
 * Stage a scroll position.
 *
 * jsdom never scrolls anything: `window.scrollY` is a plain property and no
 * scroll event is ever dispatched. Anything reading scroll position has to have
 * it set for it, and the two halves have to be done together — setting the
 * property without the event leaves subscribers unaware, and the event without
 * the property leaves them reading a stale zero.
 */
export const scrollTo = (y: number) => {
  act(() => {
    window.scrollY = y;
    window.dispatchEvent(new Event("scroll"));
  });
};
