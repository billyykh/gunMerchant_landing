/**
 * The site's primary navigation, in one place.
 *
 * Rendered three times — inline in the header, inside the mobile sheet, and
 * again in the footer — from this one list. Kept as three literals instead, the
 * footer ends up offering a category the header dropped.
 *
 * Placeholder hrefs: this is a landing page with no routes behind it yet.
 */
export const PRIMARY_NAV = [
  { label: "Rifles", href: "#" },
  { label: "Optics", href: "#" },
  { label: "Field Gear", href: "#" },
] as const;

/**
 * The footer's second row. Separate from the primary set because these are
 * obligations rather than merchandise — they belong at the bottom of the page
 * and nowhere else.
 */
export const LEGAL_NAV = [
  { label: "Terms", href: "#" },
  { label: "Privacy", href: "#" },
  { label: "Contact", href: "#" },
] as const;
