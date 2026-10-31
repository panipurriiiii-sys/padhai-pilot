/** Colour maths shared by the API validators, the Admin preview and the tests. Pure, dependency-free. */
export declare const HEX6: RegExp;
export declare const HEX3: RegExp;
export type RGB = readonly [number, number, number];
/** Accepts `#RGB` or `#RRGGBB`. Returns `null` for anything else (including alpha forms). */
export declare function parseHex(input: string): RGB | null;
export declare const rgbToHex: (rgb: RGB) => string;
/** Normalises `#abc` / `#aabbcc` to upper-case `#AABBCC`, or `null` when invalid. */
export declare function normalizeHex(input: string): string | null;
/** WCAG 2.x relative luminance. */
export declare function relativeLuminance(rgb: RGB): number;
/** WCAG contrast ratio between two hex colours (1 – 21). Returns 0 if either is not a valid hex. */
export declare function contrastRatio(foreground: string, background: string): number;
/** Linear mix: `amount` 0 -> `a`, 1 -> `b`. */
export declare function mixHex(a: string, b: string, amount: number): string;
/** `rgba(r, g, b, a)` from a hex colour. */
export declare function hexToRgba(hex: string, alpha: number): string;
export declare const WCAG: {
    /** Body text */
    readonly AA: 4.5;
    /** Large text and UI components (WCAG 1.4.11) */
    readonly AA_LARGE: 3;
    readonly AAA: 7;
};
