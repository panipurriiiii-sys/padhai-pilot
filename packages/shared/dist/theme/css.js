import { radii } from './radii.js';
import { spacing } from './spacing.js';
import { motion, cubicBezierCss } from './motion.js';
import { shadowToCss } from './shadows.js';
import { fontStackFor } from './typography.js';
const SHADOW_VAR = {
    paper: '--shadow-paper',
    lift: '--shadow-lift',
    sticky: '--shadow-sticky',
    neon: '--shadow-neon',
    button: '--shadow-button',
    buttonHover: '--shadow-button-hover',
    selected: '--shadow-selected',
    focusRing: '--shadow-focus-ring',
    inputInset: '--shadow-input-inset',
    stampInset: '--shadow-stamp-inset',
    tape: '--shadow-tape',
};
/** Colour variables for one palette, in Teacher Portal order. */
export function colorVariables(p) {
    const v = {
        '--bg-desk': p.bg.desk,
        '--bg-paper': p.bg.paper,
        '--bg-paper-warm': p.bg.paperWarm,
        '--bg-surface-subtle': p.bg.surfaceSubtle,
        '--bg-surface-2': p.bg.surface2,
        '--bg-secondary': p.bg.secondary,
        '--bg-muted': p.bg.muted,
        '--bg-selected': p.bg.selected,
        '--border-paper': p.border.paper,
        '--border-input': p.border.input,
        '--border-focus': p.border.focus,
        '--border-hover': p.border.hover,
        '--border-subtle': p.border.subtle,
        '--brand-electric': p.brand.electric,
        '--brand-hover': p.brand.hover,
        '--brand-cyan': p.brand.cyan,
        '--brand-glow': p.brand.glow,
        '--on-brand': p.brand.onBrand,
        '--brand-subtle-bg': p.brand.subtleBg,
        '--brand-subtle-border': p.brand.subtleBorder,
    };
    for (const name of ['yellow', 'pink', 'mint', 'blue', 'beige']) {
        v[`--sticky-${name}`] = p.sticky[name].bg;
        v[`--sticky-${name}-border`] = p.sticky[name].border;
        v[`--sticky-${name}-text`] = p.sticky[name].text;
    }
    v['--tape-frost'] = p.effects.tape;
    v['--ink-primary'] = p.ink.primary;
    v['--ink-secondary'] = p.ink.secondary;
    v['--ink-muted'] = p.ink.muted;
    v['--ink-faint'] = p.ink.faint;
    for (const name of ['success', 'warning', 'danger', 'info']) {
        v[`--status-${name}`] = p.status[name].solid;
        v[`--status-${name}-bg`] = p.status[name].bg;
        v[`--status-${name}-border`] = p.status[name].border;
        v[`--status-${name}-text`] = p.status[name].text;
    }
    v['--scrim'] = p.effects.scrim;
    v['--scrollbar-thumb'] = p.effects.scrollbarThumb;
    v['--scrollbar-thumb-hover'] = p.effects.scrollbarThumbHover;
    v['--glass-nav'] = p.effects.glassNav;
    v['--desk-glow-warm'] = p.effects.deskGlowWarm;
    v['--desk-glow-peach'] = p.effects.deskGlowPeach;
    v['--desk-grid'] = p.effects.deskGrid;
    v['--desk-grid-strong'] = p.effects.deskGridStrong;
    v['--desk-dot'] = p.effects.deskDot;
    v['--spotlight'] = p.effects.spotlight;
    v['--tape-border'] = p.effects.tapeBorder;
    v['--cork-base'] = p.effects.corkBase;
    v['--cork-dot-dark'] = p.effects.corkDotDark;
    v['--cork-dot-mid'] = p.effects.corkDotMid;
    v['--cork-dot-light'] = p.effects.corkDotLight;
    v['--brand-deep'] = p.effects.brandDeep;
    v['--glass-highlight'] = p.effects.glassHighlight;
    v['--glass-sheen'] = p.effects.glassSheen;
    p.charts.categorical.forEach((c, i) => (v[`--chart-${i + 1}`] = c));
    p.charts.sequential.forEach((c, i) => (v[`--chart-seq-${i + 1}`] = c));
    p.charts.diverging.forEach((c, i) => (v[`--chart-div-${i + 1}`] = c));
    for (const k of ['present', 'absent', 'late', 'excused'])
        v[`--chart-${k}`] = p.charts.attendance[k];
    v['--chart-grid'] = p.charts.grid;
    v['--chart-axis'] = p.charts.axis;
    v['--chart-axis-label'] = p.charts.axisLabel;
    v['--chart-reference'] = p.charts.referenceLine;
    v['--chart-tooltip-bg'] = p.charts.tooltipBg;
    v['--chart-tooltip-border'] = p.charts.tooltipBorder;
    v['--chart-tooltip-text'] = p.charts.tooltipText;
    return v;
}
/** Variables that do not change between schemes. */
export function staticVariables() {
    const v = {};
    for (const [k, n] of Object.entries(radii))
        v[`--radius-${k}`] = k === 'full' ? '9999px' : `${n / 16}rem`;
    for (const [k, n] of Object.entries(spacing))
        v[`--space-${k}`] = `${n / 16}rem`;
    v['--duration-instant'] = `${motion.duration.instant}ms`;
    v['--duration-fast'] = `${motion.duration.fast}ms`;
    v['--duration-base'] = `${motion.duration.base}ms`;
    v['--duration-slow'] = `${motion.duration.slow}ms`;
    v['--duration-ambient'] = `${motion.duration.ambient}ms`;
    v['--ease-control'] = motion.easing.control;
    v['--ease-surface'] = motion.easing.surface;
    v['--ease-emphasized'] = cubicBezierCss(motion.easing.emphasized);
    v['--ease-standard'] = cubicBezierCss(motion.easing.standard);
    v['--stagger-step'] = `${motion.stagger.step}ms`;
    v['--enter-offset'] = `${motion.enterOffset}px`;
    v['--press-scale'] = String(motion.pressScale.button);
    v['--press-scale-subtle'] = String(motion.pressScale.subtle);
    v['--blur-glass'] = '10px';
    v['--hover-lift'] = `-${motion.hoverLift}px`;
    return v;
}
export function fontVariables(typography) {
    return {
        '--font-display': fontStackFor(typography.display),
        '--font-primary': fontStackFor(typography.primary),
        '--font-data': fontStackFor(typography.data),
    };
}
export function shadowVariables(shadows) {
    const v = {};
    for (const [name, varName] of Object.entries(SHADOW_VAR)) {
        v[varName] = shadowToCss(shadows[name]);
    }
    return v;
}
/** Complete variable set for a scheme of a resolved theme. */
export function schemeVariables(theme, scheme) {
    return { ...colorVariables(theme.palettes[scheme]), ...shadowVariables(theme.shadows[scheme]) };
}
/** Only the entries of `next` that differ from `base` (used so runtime overrides stay tiny). */
export function diffVariables(base, next) {
    const out = {};
    for (const [k, val] of Object.entries(next))
        if (base[k] !== val)
            out[k] = val;
    return out;
}
export function renderBlock(selector, vars, indent = '  ') {
    const body = Object.entries(vars)
        .map(([k, val]) => `${indent}${k}: ${val};`)
        .join('\n');
    return `${selector} {\n${body}\n}`;
}
export const DARK_SELECTOR = ".dark, .admin-dark, [data-theme='dark']";
export const LIGHT_SELECTOR = ":root, [data-theme='light']";
/**
 * Runtime override stylesheet: only what differs from the built-in defaults. Injected by the web theme loader into
 * `<style id="pp-theme">`, so it sits after the shipped CSS and wins by order.
 */
export function renderRuntimeOverrides(theme, defaults) {
    const blocks = [];
    const fontsDiff = diffVariables(fontVariables(defaults.typography), fontVariables(theme.typography));
    const lightDiff = {
        ...fontsDiff,
        ...diffVariables(schemeVariables(defaults, 'light'), schemeVariables(theme, 'light')),
    };
    if (Object.keys(lightDiff).length)
        blocks.push(renderBlock(':root', lightDiff));
    const darkDiff = diffVariables(schemeVariables(defaults, 'dark'), schemeVariables(theme, 'dark'));
    if (Object.keys(darkDiff).length)
        blocks.push(renderBlock(DARK_SELECTOR, darkDiff));
    if (!theme.appearance.deskTexture)
        blocks.push('.ak-desk-surface { background-image: none; }');
    return blocks.join('\n');
}
// -----------------------------------------------------------------------------------------------------------------
// Tailwind 4 `@theme inline` mapping: semantic utilities (bg-paper, text-ink-muted, border-border-paper, ...)
// -----------------------------------------------------------------------------------------------------------------
/** [tailwind colour name, css variable] */
export const TAILWIND_COLORS = [
    ['desk', '--bg-desk'],
    ['paper', '--bg-paper'],
    ['paper-warm', '--bg-paper-warm'],
    ['surface-subtle', '--bg-surface-subtle'],
    ['chip', '--bg-secondary'],
    ['muted-surface', '--bg-muted'],
    ['selected', '--bg-selected'],
    ['border-paper', '--border-paper'],
    ['border-input', '--border-input'],
    ['border-hover', '--border-hover'],
    ['border-subtle', '--border-subtle'],
    ['border-focus', '--border-focus'],
    ['electric', '--brand-electric'],
    ['brand-hover', '--brand-hover'],
    ['brand-cyan', '--brand-cyan'],
    ['brand-subtle', '--brand-subtle-bg'],
    ['brand-subtle-border', '--brand-subtle-border'],
    ['on-brand', '--on-brand'],
    ['ink-primary', '--ink-primary'],
    ['ink-secondary', '--ink-secondary'],
    ['ink-muted', '--ink-muted'],
    ['ink-faint', '--ink-faint'],
    ['scrim', '--scrim'],
    ...['success', 'warning', 'danger', 'info'].flatMap((s) => [
        [`status-${s}`, `--status-${s}`],
        [`status-${s}-bg`, `--status-${s}-bg`],
        [`status-${s}-border`, `--status-${s}-border`],
        [`status-${s}-text`, `--status-${s}-text`],
    ]),
    ...['yellow', 'pink', 'mint', 'blue', 'beige'].flatMap((s) => [
        [`sticky-${s}`, `--sticky-${s}`],
        [`sticky-${s}-border`, `--sticky-${s}-border`],
        [`sticky-${s}-text`, `--sticky-${s}-text`],
    ]),
];
export function renderTailwindTheme() {
    const lines = [
        // Exactly three families: map every Tailwind family utility onto them (font-mono -> Inter, font-serif -> Playfair).
        '  --font-display: var(--font-display);',
        '  --font-sans: var(--font-primary);',
        '  --font-primary: var(--font-primary);',
        '  --font-data: var(--font-data);',
        '  --font-mono: var(--font-data);',
        '  --font-serif: var(--font-display);',
        '',
    ];
    for (const [name, variable] of TAILWIND_COLORS)
        lines.push(`  --color-${name}: var(${variable});`);
    lines.push('');
    for (const s of ['paper', 'lift', 'sticky', 'neon'])
        lines.push(`  --shadow-${s}: var(--shadow-${s});`);
    return `@theme inline {\n${lines.join('\n')}\n}`;
}
