/**
 * The marker that ties an Act's DOM section to the 3D scene.
 *
 * Lives in a plain module, not in the client hook that reads it: a constant
 * exported from a `"use client"` file becomes a client *reference* when a
 * server component imports it, and React renders the reference itself as the
 * attribute name. Rendered and observed from one constant so the two can never
 * drift.
 */
export const ACT_SECTION_ATTRIBUTE = "data-act";
