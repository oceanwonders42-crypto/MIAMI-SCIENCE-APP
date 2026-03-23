/** Shared SVG attrs for minimalist line art (reads `currentColor` from category-themed parent). */
export const stroke = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 2.05,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
