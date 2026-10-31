/**
 * Typography tokens. PadhaiPilot uses EXACTLY three font families everywhere (web and native). A fourth family is a
 * build-time failure (see scripts/check-design-consistency.mjs).
 *
 *  - Playfair Display : premium titles / selected display headings
 *  - Raleway          : primary UI — navigation, labels, headings, body
 *  - Inter            : tables, analytics, numbers, marks, dense data
 */
export type FontRole = 'display' | 'primary' | 'data';
export declare const FONT_FAMILIES: Record<FontRole, string>;
/** The only family names a theme configuration may reference. */
export declare const APPROVED_FONT_FAMILIES: readonly ["Playfair Display", "Raleway", "Inter"];
export type ApprovedFontFamily = (typeof APPROVED_FONT_FAMILIES)[number];
export declare const isApprovedFontFamily: (value: unknown) => value is ApprovedFontFamily;
/** Generic fallback appended after the chosen family (web). */
export declare const fontStackFor: (family: ApprovedFontFamily) => string;
/** Default role -> family assignment (what the Teacher Portal ships). */
export declare const DEFAULT_FONT_ASSIGNMENT: Record<FontRole, ApprovedFontFamily>;
export declare const FONT_ROLE_USAGE: Record<FontRole, string>;
/** Weights used by the Teacher Portal (font-medium .. font-extrabold). */
export declare const fontWeights: {
    readonly regular: 400;
    readonly medium: 500;
    readonly semibold: 600;
    readonly bold: 700;
    readonly extrabold: 800;
};
/**
 * Web type scale (px). Mirrors the Tailwind sizes the Teacher Portal uses: text-[10px] .. text-4xl.
 * `lineHeight` is the unit-less ratio used with the size.
 */
export declare const typeScale: {
    readonly micro: {
        readonly size: 10;
        readonly lineHeight: 1.4;
    };
    readonly caption: {
        readonly size: 11;
        readonly lineHeight: 1.4;
    };
    readonly xs: {
        readonly size: 12;
        readonly lineHeight: 1.333;
    };
    readonly sm: {
        readonly size: 14;
        readonly lineHeight: 1.428;
    };
    readonly base: {
        readonly size: 16;
        readonly lineHeight: 1.5;
    };
    readonly lg: {
        readonly size: 18;
        readonly lineHeight: 1.555;
    };
    readonly xl: {
        readonly size: 20;
        readonly lineHeight: 1.4;
    };
    readonly '2xl': {
        readonly size: 24;
        readonly lineHeight: 1.333;
    };
    readonly '3xl': {
        readonly size: 30;
        readonly lineHeight: 1.2;
    };
    readonly '4xl': {
        readonly size: 36;
        readonly lineHeight: 1.111;
    };
};
export type TypeScaleKey = keyof typeof typeScale;
/** Native (React Native) type scale — same roles, phone-density sizes in dp/pt. */
export declare const nativeTypeScale: {
    readonly xs: {
        readonly size: 11;
        readonly lineHeight: 15;
    };
    readonly sm: {
        readonly size: 13;
        readonly lineHeight: 18;
    };
    readonly base: {
        readonly size: 15;
        readonly lineHeight: 22;
    };
    readonly lg: {
        readonly size: 17;
        readonly lineHeight: 24;
    };
    readonly xl: {
        readonly size: 20;
        readonly lineHeight: 28;
    };
    readonly xxl: {
        readonly size: 24;
        readonly lineHeight: 32;
    };
    readonly title: {
        readonly size: 30;
        readonly lineHeight: 38;
    };
};
export type NativeTypeScaleKey = keyof typeof nativeTypeScale;
export declare const letterSpacing: {
    readonly tight: -0.025;
    readonly normal: 0;
    readonly wide: 0.05;
};
/**
 * React Native font family resolution for the bundled TTFs (apps/mobile/assets/fonts).
 * Android resolves `<Family>.ttf` for regular and `<Family>_bold.ttf` for fontWeight 700; iOS uses the registered
 * family name.
 */
export declare const nativeFontFamily: (family: ApprovedFontFamily, platform: "ios" | "android") => string;
