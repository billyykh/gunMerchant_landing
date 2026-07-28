/**
 * The marker that tells the 3D layer where the page's closing surface is.
 *
 * The canvas is fixed and full-viewport, so the footer scrolls up over the last
 * Act rather than after it. The scene has to know how much of its own frame the
 * page has covered — see `useOccludedBottom`.
 *
 * In a plain module for the same reason as `ACT_SECTION_ATTRIBUTE`: a constant
 * exported from a `"use client"` file becomes a client *reference* when a server
 * component imports it, and React renders the reference itself as the attribute
 * name.
 */
export const PAGE_CLOSE_ATTRIBUTE = "data-page-close";
