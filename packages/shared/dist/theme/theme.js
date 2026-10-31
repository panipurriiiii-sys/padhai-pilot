/**
 * Theme resolution: platform defaults -> approved platform config -> institute branding.
 *
 * Hierarchy (highest priority last):
 *  1. PadhaiPilot global design system        (colors.ts / typography.ts / ...)
 *  2. Approved platform-wide appearance config (PlatformThemeConfig, published by the Super Admin)
 *  3. Validated institute branding             (logo + one accent colour, only where the plan allows)
 *  4. Role-specific content/layout             (never touches tokens)
 */
import { hexToRgba, mixHex, normalizeHex } from './contrast.js';
import { palettes } from './colors.js';
import { DEFAULT_THEME_CONFIG, } from './config.js';
import { lightShadows, darkShadows } from './shadows.js';
const clone = (v) => JSON.parse(JSON.stringify(v));
const DEFAULT_PRIMARY = DEFAULT_THEME_CONFIG.brand.primary.toUpperCase();
const BRAND_SHADOWS = ['neon', 'button', 'buttonHover', 'selected', 'focusRing'];
function recolor(layers, hex) {
    const rgba = hexToRgba(hex, 1).match(/\d+/g)?.map(Number);
    if (!rgba)
        return layers;
    return layers.map((l) => ({ ...l, color: [rgba[0], rgba[1], rgba[2], l.color[3]] }));
}
function applyOverrides(p, o) {
    if (o.desk)
        p.bg.desk = o.desk;
    if (o.paper)
        p.bg.paper = o.paper;
    if (o.paperWarm)
        p.bg.paperWarm = o.paperWarm;
    if (o.surfaceSubtle) {
        p.bg.surfaceSubtle = o.surfaceSubtle;
        p.bg.surface2 = o.surfaceSubtle;
    }
    if (o.secondary)
        p.bg.secondary = o.secondary;
    if (o.borderPaper)
        p.border.paper = o.borderPaper;
    if (o.borderInput)
        p.border.input = o.borderInput;
    if (o.inkPrimary)
        p.ink.primary = o.inkPrimary;
    if (o.inkSecondary)
        p.ink.secondary = o.inkSecondary;
    if (o.inkMuted)
        p.ink.muted = o.inkMuted;
}
function applyBrand(p, scheme, brand) {
    const primary = normalizeHex(brand.primary) ?? DEFAULT_PRIMARY;
    const customPrimary = primary !== DEFAULT_PRIMARY;
    if (customPrimary) {
        p.brand.electric = primary;
        // series 1 and the sequential mid-point follow the brand colour
        p.charts = {
            ...p.charts,
            categorical: [primary, ...p.charts.categorical.slice(1)],
            sequential: [p.charts.sequential[0], p.charts.sequential[1], primary, ...p.charts.sequential.slice(3)],
        };
        if (scheme === 'light') {
            p.border.focus = primary;
            p.brand.hover = brand.primaryHover ?? mixHex(primary, '#000000', 0.12);
            p.brand.cyan = brand.accent ?? p.brand.hover;
            p.brand.glow = hexToRgba(primary, 0.45);
            p.brand.subtleBg = mixHex(primary, '#FFFFFF', 0.94);
            p.brand.subtleBorder = mixHex(primary, '#FFFFFF', 0.75);
            p.bg.selected = mixHex(primary, '#FFFFFF', 0.95);
            p.effects.spotlight = hexToRgba(primary, 0.08);
        }
        else {
            p.brand.hover = brand.primaryHover ?? mixHex(primary, '#FFFFFF', 0.2);
            p.brand.subtleBg = hexToRgba(primary, 0.12);
            p.brand.subtleBorder = hexToRgba(primary, 0.28);
            p.bg.selected = hexToRgba(primary, 0.12);
            if (brand.accent) {
                p.brand.cyan = brand.accent;
                p.border.focus = brand.accent;
                p.brand.glow = hexToRgba(brand.accent, 0.45);
            }
        }
    }
    else {
        if (brand.primaryHover)
            p.brand.hover = brand.primaryHover;
        if (brand.accent) {
            p.brand.cyan = brand.accent;
            if (scheme === 'dark') {
                p.border.focus = brand.accent;
                p.brand.glow = hexToRgba(brand.accent, 0.45);
            }
        }
    }
}
/** Build the effective palettes/typography for a platform config, optionally layered with institute branding. */
export function resolveTheme(config = DEFAULT_THEME_CONFIG, institute) {
    // Institute accent replaces the platform brand colour (hover/tints are re-derived); nothing else changes.
    const brand = institute?.accentColor
        ? { primary: institute.accentColor, accent: config.brand.accent }
        : config.brand;
    const resolved = {
        palettes: { light: clone(palettes.light), dark: clone(palettes.dark) },
        shadows: { light: clone(lightShadows), dark: clone(darkShadows) },
        typography: { ...config.typography },
        appearance: { ...config.appearance },
        logoUrl: institute?.logoUrl ?? null,
    };
    for (const scheme of ['light', 'dark']) {
        applyOverrides(resolved.palettes[scheme], config[scheme]);
        applyBrand(resolved.palettes[scheme], scheme, brand);
        const customPrimary = (normalizeHex(brand.primary) ?? DEFAULT_PRIMARY) !== DEFAULT_PRIMARY;
        if (customPrimary) {
            for (const name of BRAND_SHADOWS) {
                resolved.shadows[scheme][name] = recolor(resolved.shadows[scheme][name], brand.primary);
            }
        }
    }
    return resolved;
}
/** Which scheme to start in, given a platform default, an optional user choice and the OS preference. */
export function pickScheme(platformDefault, userChoice, system, allowUserToggle = true) {
    if (userChoice && allowUserToggle)
        return userChoice;
    if (platformDefault === 'system')
        return system ?? 'light';
    return platformDefault;
}
