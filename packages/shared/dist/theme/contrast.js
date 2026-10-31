/** Colour maths shared by the API validators, the Admin preview and the tests. Pure, dependency-free. */
export const HEX6 = /^#[0-9a-fA-F]{6}$/;
export const HEX3 = /^#[0-9a-fA-F]{3}$/;
/** Accepts `#RGB` or `#RRGGBB`. Returns `null` for anything else (including alpha forms). */
export function parseHex(input) {
    if (typeof input !== 'string')
        return null;
    const value = input.trim();
    if (HEX3.test(value)) {
        return [
            parseInt(value[1] + value[1], 16),
            parseInt(value[2] + value[2], 16),
            parseInt(value[3] + value[3], 16),
        ];
    }
    if (HEX6.test(value)) {
        return [parseInt(value.slice(1, 3), 16), parseInt(value.slice(3, 5), 16), parseInt(value.slice(5, 7), 16)];
    }
    return null;
}
const channelToHex = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0').toUpperCase();
export const rgbToHex = (rgb) => `#${channelToHex(rgb[0])}${channelToHex(rgb[1])}${channelToHex(rgb[2])}`;
/** Normalises `#abc` / `#aabbcc` to upper-case `#AABBCC`, or `null` when invalid. */
export function normalizeHex(input) {
    const rgb = parseHex(input);
    return rgb ? rgbToHex(rgb) : null;
}
/** WCAG 2.x relative luminance. */
export function relativeLuminance(rgb) {
    const [r, g, b] = rgb.map((c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/** WCAG contrast ratio between two hex colours (1 – 21). Returns 0 if either is not a valid hex. */
export function contrastRatio(foreground, background) {
    const fg = parseHex(foreground);
    const bg = parseHex(background);
    if (!fg || !bg)
        return 0;
    const l1 = relativeLuminance(fg);
    const l2 = relativeLuminance(bg);
    const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
    return (hi + 0.05) / (lo + 0.05);
}
/** Linear mix: `amount` 0 -> `a`, 1 -> `b`. */
export function mixHex(a, b, amount) {
    const ca = parseHex(a);
    const cb = parseHex(b);
    if (!ca || !cb)
        return a;
    return rgbToHex([
        ca[0] + (cb[0] - ca[0]) * amount,
        ca[1] + (cb[1] - ca[1]) * amount,
        ca[2] + (cb[2] - ca[2]) * amount,
    ]);
}
/** `rgba(r, g, b, a)` from a hex colour. */
export function hexToRgba(hex, alpha) {
    const c = parseHex(hex);
    if (!c)
        return hex;
    return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
}
export const WCAG = {
    /** Body text */
    AA: 4.5,
    /** Large text and UI components (WCAG 1.4.11) */
    AA_LARGE: 3,
    AAA: 7,
};
