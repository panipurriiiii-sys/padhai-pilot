/**
 * Elevation tokens. Structured layers are the single source; CSS strings and React Native shadow props are derived.
 * Values are the Teacher Portal's multi-layer "physical paper" drop shadows.
 */
const WARM = [60, 52, 40];
const BRAND = [22, 119, 255];
const BLACK = [0, 0, 0];
const layer = (x, y, blur, spread, rgb, alpha, inset = false) => ({ x, y, blur, spread, color: [rgb[0], rgb[1], rgb[2], alpha], ...(inset ? { inset: true } : {}) });
export const lightShadows = {
    paper: [layer(0, 1, 2, 0, WARM, 0.06), layer(0, 6, 16, -4, WARM, 0.1)],
    lift: [layer(0, 2, 4, 0, WARM, 0.08), layer(0, 14, 28, -6, WARM, 0.16)],
    sticky: [layer(0, 1, 1, 0, WARM, 0.08), layer(0, 8, 14, -6, WARM, 0.22)],
    neon: [layer(0, 0, 0, 1, BRAND, 0.35), layer(0, 10, 24, -10, BRAND, 0.4)],
    button: [layer(0, 2, 10, 0, BRAND, 0.35)],
    buttonHover: [layer(0, 4, 14, 0, BRAND, 0.45)],
    selected: [layer(0, 2, 12, 0, BRAND, 0.15)],
    focusRing: [layer(0, 0, 0, 3, BRAND, 0.15)],
    inputInset: [layer(0, 1, 2, 0, WARM, 0.04, true)],
    stampInset: [layer(0, 2, 4, 0, BLACK, 0.08, true)],
    tape: [layer(0, 1, 3, 0, WARM, 0.08)],
};
/** Dark mode uses flat, deeper shadows (Teacher `.dark`); neon is unchanged. */
export const darkShadows = {
    paper: [layer(0, 2, 8, 0, BLACK, 0.4)],
    lift: [layer(0, 4, 20, 0, BLACK, 0.6)],
    sticky: [layer(0, 2, 10, 0, BLACK, 0.5)],
    neon: lightShadows.neon,
    button: lightShadows.button,
    buttonHover: lightShadows.buttonHover,
    selected: lightShadows.selected,
    focusRing: lightShadows.focusRing,
    inputInset: [layer(0, 1, 2, 0, BLACK, 0.3, true)],
    stampInset: lightShadows.stampInset,
    tape: lightShadows.tape,
};
const px = (n) => (n === 0 ? '0' : `${n}px`);
const alphaToString = (a) => String(a);
/** Serialise layers exactly the way the Teacher stylesheet writes them. */
export function shadowToCss(layers) {
    return layers
        .map((l) => {
        const parts = l.inset ? ['inset', px(l.x), px(l.y), px(l.blur)] : [px(l.x), px(l.y), px(l.blur)];
        if (l.spread !== 0)
            parts.push(px(l.spread));
        parts.push(`rgba(${l.color[0]}, ${l.color[1]}, ${l.color[2]}, ${alphaToString(l.color[3])})`);
        return parts.join(' ');
    })
        .join(', ');
}
const rgbToHex = (c) => `#${[c[0], c[1], c[2]].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
/**
 * React Native supports one shadow per view: use the dominant (largest blur) layer. shadowRadius ~= blur / 2 per the
 * CSS -> RN convention. `elevation` is the Android approximation.
 */
export function shadowToNative(layers) {
    const main = layers.reduce((a, b) => (b.blur >= a.blur ? b : a), layers[0]);
    return {
        shadowColor: rgbToHex(main.color),
        shadowOffset: { width: main.x, height: main.y },
        shadowOpacity: main.color[3],
        shadowRadius: Math.max(1, main.blur / 2),
        elevation: Math.max(1, Math.round(main.blur / 5)),
    };
}
export const shadowsFor = (scheme) => scheme === 'dark' ? darkShadows : lightShadows;
