/**
 * Radius system, extracted from the Teacher Portal:
 *  sm   0.375rem  .badge-session
 *  md   0.5rem    .badge-code
 *  lg   0.75rem   controls: buttons, inputs, recessed surfaces
 *  xl   1rem      cards (.paper-card, .kpi-card)
 *  full 9999px    pills
 */
export const radii = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export type RadiusKey = keyof typeof radii;
