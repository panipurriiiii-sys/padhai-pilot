/**
 * PadhaiPilot colour tokens — AK Paper-Desk identity.
 *
 * SOURCE OF TRUTH: values were extracted 1:1 from `apps/teacher/src/app/globals.css` (the Teacher Portal is the
 * master visual reference). The frozen copy of that stylesheet lives in `__fixtures__/teacher-reference.css` and the
 * test-suite fails if any value below drifts from it.
 *
 * Light is the default for every app. Dark is the Teacher Portal's `.dark` palette. A few dark-mode values that the
 * Teacher stylesheet never defined (status / sticky tints, hover border, scrollbar) come from the previous dark-luxury
 * palette and are marked `derived` below.
 */
export type ColorScheme = 'light' | 'dark';
/** A coloured "sticky note" / status family: fill, hairline border, readable text. */
export interface TintColor {
    bg: string;
    border: string;
    text: string;
}
/** Status family: a saturated `solid` for icons/stamps/borders plus an accessible tint. */
export interface StatusColor extends TintColor {
    solid: string;
}
export interface ChartTokens {
    /** Categorical series 1..8 (distinguishable, >= 3:1 against paper) */
    categorical: readonly string[];
    /** Sequential scale, low -> high (blue ramp built from the sticky-blue tint to the brand to navy) */
    sequential: readonly string[];
    /** Diverging scale, negative -> neutral -> positive */
    diverging: readonly string[];
    /** Attendance statuses — the P / A / L / E stamp colours */
    attendance: {
        present: string;
        absent: string;
        late: string;
        excused: string;
    };
    grid: string;
    axis: string;
    axisLabel: string;
    referenceLine: string;
    tooltipBg: string;
    tooltipBorder: string;
    tooltipText: string;
}
export interface ColorPalette {
    bg: {
        /** Desk surface (warm off-white / ivory) */
        desk: string;
        /** Fresh white paper sheet, card base */
        paper: string;
        /** Warm cream paper, container base */
        paperWarm: string;
        /** Recessed secondary surface, tags */
        surfaceSubtle: string;
        surface2: string;
        /** Secondary buttons / chip base */
        secondary: string;
        /** Muted background pill */
        muted: string;
        /** Selected card fill */
        selected: string;
    };
    border: {
        paper: string;
        input: string;
        focus: string;
        hover: string;
        /** Hairline inner separators */
        subtle: string;
    };
    brand: {
        /** AK signature royal electric blue */
        electric: string;
        hover: string;
        cyan: string;
        glow: string;
        /** Text/icon colour on top of a solid brand fill */
        onBrand: string;
        /** `.btn-subtle` fill / border */
        subtleBg: string;
        subtleBorder: string;
    };
    ink: {
        primary: string;
        secondary: string;
        muted: string;
        faint: string;
    };
    sticky: {
        yellow: TintColor;
        pink: TintColor;
        mint: TintColor;
        blue: TintColor;
        beige: TintColor;
    };
    status: {
        success: StatusColor;
        warning: StatusColor;
        danger: StatusColor;
        info: StatusColor;
    };
    effects: {
        tape: string;
        /** Modal / drawer backdrop */
        scrim: string;
        scrollbarThumb: string;
        scrollbarThumbHover: string;
        /** Frosted navigation bar fill */
        glassNav: string;
        /** `.ak-desk-surface` layers */
        deskGlowWarm: string;
        deskGlowPeach: string;
        deskGrid: string;
        deskGridStrong: string;
        deskDot: string;
        /** `.electric-spotlight` radial */
        spotlight: string;
        tapeBorder: string;
        /** `.corkboard-surface` */
        corkBase: string;
        corkDotDark: string;
        corkDotMid: string;
        corkDotLight: string;
        /** Optional ambient tokens (atmosphere only, never the primary palette) */
        brandDeep: string;
        glassHighlight: string;
        glassSheen: string;
    };
    charts: ChartTokens;
}
export declare const lightPalette: ColorPalette;
export declare const darkPalette: ColorPalette;
export declare const palettes: Record<ColorScheme, ColorPalette>;
