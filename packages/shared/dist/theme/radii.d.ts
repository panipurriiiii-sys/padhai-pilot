/**
 * Radius system, extracted from the Teacher Portal:
 *  sm   0.375rem  .badge-session
 *  md   0.5rem    .badge-code
 *  lg   0.75rem   controls: buttons, inputs, recessed surfaces
 *  xl   1rem      cards (.paper-card, .kpi-card)
 *  full 9999px    pills
 */
export declare const radii: {
    readonly none: 0;
    readonly xs: 4;
    readonly sm: 6;
    readonly md: 8;
    readonly lg: 12;
    readonly xl: 16;
    readonly full: 9999;
};
export type RadiusKey = keyof typeof radii;
