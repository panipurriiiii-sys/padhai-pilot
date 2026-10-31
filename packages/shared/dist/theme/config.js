/**
 * Runtime-configurable global theme configuration (PlatformThemeConfig) and its validation.
 *
 * Only a deliberately small, safe surface is configurable: the brand colour, a handful of surface / ink / border
 * colours per scheme, the default colour scheme and the role -> font assignment from the approved three families.
 * Everything is validated here, and the SAME validator runs in the API (authoritative), the Admin preview and the
 * client loaders, so an invalid document can never be applied anywhere.
 *
 * The config never contains secrets: it is public and CDN-cacheable.
 */
import { contrastRatio, normalizeHex, parseHex, relativeLuminance, WCAG } from './contrast.js';
import { lightPalette, darkPalette } from './colors.js';
import { APPROVED_FONT_FAMILIES, DEFAULT_FONT_ASSIGNMENT, isApprovedFontFamily, } from './typography.js';
export const THEME_CONFIG_SCHEMA_VERSION = 1;
export const DEFAULT_SCHEMES = ['light', 'dark', 'system'];
/** The semantic colour roles a Super Admin may override, per scheme. */
export const SCHEME_OVERRIDE_KEYS = [
    'desk',
    'paper',
    'paperWarm',
    'surfaceSubtle',
    'secondary',
    'borderPaper',
    'borderInput',
    'inkPrimary',
    'inkSecondary',
    'inkMuted',
];
export const DEFAULT_THEME_CONFIG = Object.freeze({
    schemaVersion: THEME_CONFIG_SCHEMA_VERSION,
    appearance: Object.freeze({ defaultScheme: 'light', allowUserSchemeToggle: true, deskTexture: true }),
    brand: Object.freeze({ primary: lightPalette.brand.electric }),
    light: Object.freeze({}),
    dark: Object.freeze({}),
    typography: Object.freeze({ ...DEFAULT_FONT_ASSIGNMENT }),
});
export const BUILT_IN_REVISION_ID = 'r0-default';
export const BUILT_IN_PUBLISHED_THEME = Object.freeze({
    revision: 0,
    revisionId: BUILT_IN_REVISION_ID,
    checksum: 'default',
    publishedAt: null,
    config: DEFAULT_THEME_CONFIG,
});
const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
function rejectUnknownKeys(obj, allowed, path, errors) {
    for (const key of Object.keys(obj)) {
        if (!allowed.includes(key))
            errors.push(`${path}.${key} is not a configurable theme setting.`);
    }
}
function readHex(value, path, errors) {
    if (value === undefined || value === null)
        return undefined;
    if (typeof value !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(value.trim())) {
        errors.push(`${path} must be a 6-digit hex colour like #1677FF.`);
        return undefined;
    }
    return normalizeHex(value) ?? undefined;
}
function readScheme(raw, path, errors) {
    if (raw === undefined)
        return {};
    if (!isPlainObject(raw)) {
        errors.push(`${path} must be an object.`);
        return {};
    }
    rejectUnknownKeys(raw, SCHEME_OVERRIDE_KEYS, path, errors);
    const out = {};
    for (const key of SCHEME_OVERRIDE_KEYS) {
        const hex = readHex(raw[key], `${path}.${key}`, errors);
        if (hex)
            out[key] = hex;
    }
    return out;
}
/**
 * Validate an untrusted theme document. Never throws. Returns a normalised config only when every rule passes.
 * Rules: strict keys, hex colours only, approved font families only, WCAG contrast floors, schemes keep their meaning.
 */
export function validateThemeConfig(input) {
    const errors = [];
    const warnings = [];
    const contrast = [];
    if (!isPlainObject(input)) {
        return { ok: false, errors: ['Theme config must be a JSON object.'], warnings, contrast };
    }
    rejectUnknownKeys(input, ['schemaVersion', 'appearance', 'brand', 'light', 'dark', 'typography'], 'config', errors);
    if (input.schemaVersion !== THEME_CONFIG_SCHEMA_VERSION) {
        errors.push(`config.schemaVersion must be ${THEME_CONFIG_SCHEMA_VERSION}.`);
    }
    // appearance
    const appearance = { ...DEFAULT_THEME_CONFIG.appearance };
    if (input.appearance !== undefined) {
        if (!isPlainObject(input.appearance)) {
            errors.push('config.appearance must be an object.');
        }
        else {
            const a = input.appearance;
            rejectUnknownKeys(a, ['defaultScheme', 'allowUserSchemeToggle', 'deskTexture'], 'config.appearance', errors);
            if (a.defaultScheme !== undefined) {
                if (DEFAULT_SCHEMES.includes(a.defaultScheme)) {
                    appearance.defaultScheme = a.defaultScheme;
                }
                else {
                    errors.push(`config.appearance.defaultScheme must be one of ${DEFAULT_SCHEMES.join(', ')}.`);
                }
            }
            for (const flag of ['allowUserSchemeToggle', 'deskTexture']) {
                if (a[flag] !== undefined) {
                    if (typeof a[flag] === 'boolean')
                        appearance[flag] = a[flag];
                    else
                        errors.push(`config.appearance.${flag} must be true or false.`);
                }
            }
        }
    }
    // brand
    let brand = { ...DEFAULT_THEME_CONFIG.brand };
    if (!isPlainObject(input.brand)) {
        errors.push('config.brand is required.');
    }
    else {
        rejectUnknownKeys(input.brand, ['primary', 'primaryHover', 'accent'], 'config.brand', errors);
        const primary = readHex(input.brand.primary, 'config.brand.primary', errors);
        if (!primary && input.brand.primary === undefined)
            errors.push('config.brand.primary is required.');
        brand = { primary: primary ?? DEFAULT_THEME_CONFIG.brand.primary };
        const hover = readHex(input.brand.primaryHover, 'config.brand.primaryHover', errors);
        const accent = readHex(input.brand.accent, 'config.brand.accent', errors);
        if (hover)
            brand.primaryHover = hover;
        if (accent)
            brand.accent = accent;
    }
    const light = readScheme(input.light, 'config.light', errors);
    const dark = readScheme(input.dark, 'config.dark', errors);
    // typography
    const typography = { ...DEFAULT_THEME_CONFIG.typography };
    if (input.typography !== undefined) {
        if (!isPlainObject(input.typography)) {
            errors.push('config.typography must be an object.');
        }
        else {
            rejectUnknownKeys(input.typography, ['display', 'primary', 'data'], 'config.typography', errors);
            for (const role of ['display', 'primary', 'data']) {
                const family = input.typography[role];
                if (family === undefined)
                    continue;
                if (isApprovedFontFamily(family))
                    typography[role] = family;
                else
                    errors.push(`config.typography.${role} must be one of the approved families: ${APPROVED_FONT_FAMILIES.join(', ')}.`);
            }
        }
    }
    const config = {
        schemaVersion: THEME_CONFIG_SCHEMA_VERSION,
        appearance,
        brand,
        light,
        dark,
        typography,
    };
    if (errors.length === 0)
        runContrastChecks(config, contrast, errors, warnings);
    return { ok: errors.length === 0, errors, warnings, contrast, config: errors.length === 0 ? config : undefined };
}
/** Effective colours for the contrast rules (override, else built-in token). */
function effective(config, scheme) {
    const base = scheme === 'light' ? lightPalette : darkPalette;
    const o = config[scheme];
    // Border tokens in dark mode are translucent white and cannot be measured as hex; they are not contrast-checked.
    return {
        desk: o.desk ?? base.bg.desk,
        paper: o.paper ?? base.bg.paper,
        paperWarm: o.paperWarm ?? base.bg.paperWarm,
        inkPrimary: o.inkPrimary ?? base.ink.primary,
        inkSecondary: o.inkSecondary ?? base.ink.secondary,
        inkMuted: o.inkMuted ?? base.ink.muted,
    };
}
function runContrastChecks(config, contrast, errors, warnings) {
    const add = (scheme, label, foreground, background, required, level) => {
        const ratio = Math.round(contrastRatio(foreground, background) * 100) / 100;
        const passed = ratio >= required;
        contrast.push({ scheme, label, foreground, background, ratio, required, level, passed });
        if (!passed) {
            const msg = `${scheme}: ${label} contrast is ${ratio}:1 (needs ${required}:1).`;
            (level === 'error' ? errors : warnings).push(msg);
        }
    };
    for (const scheme of ['light', 'dark']) {
        const c = effective(config, scheme);
        add(scheme, 'primary text on paper', c.inkPrimary, c.paper, WCAG.AA, 'error');
        add(scheme, 'primary text on desk', c.inkPrimary, c.desk, WCAG.AA, 'error');
        add(scheme, 'primary text on warm paper', c.inkPrimary, c.paperWarm, WCAG.AA, 'error');
        add(scheme, 'secondary text on paper', c.inkSecondary, c.paper, WCAG.AA, 'error');
        add(scheme, 'muted text on paper', c.inkMuted, c.paper, WCAG.AA_LARGE, 'error');
        add(scheme, 'muted text on paper (AA)', c.inkMuted, c.paper, WCAG.AA, 'warning');
        add(scheme, 'brand colour against paper', config.brand.primary, c.paper, WCAG.AA_LARGE, 'error');
    }
    add('brand', 'label on brand button', '#FFFFFF', config.brand.primary, WCAG.AA_LARGE, 'error');
    if (config.brand.primaryHover) {
        add('brand', 'label on brand hover', '#FFFFFF', config.brand.primaryHover, WCAG.AA_LARGE, 'error');
    }
    // schemes must keep their meaning: light stays light, dark stays dark
    const lightPaper = parseHex(effective(config, 'light').paper);
    const darkPaper = parseHex(effective(config, 'dark').paper);
    if (lightPaper && relativeLuminance(lightPaper) < 0.5)
        errors.push('light: paper must stay a light colour.');
    if (darkPaper && relativeLuminance(darkPaper) > 0.2)
        errors.push('dark: paper must stay a dark colour.');
}
const MAX_LOGO_URL_LENGTH = 2048;
export function validateInstituteBranding(input, basePalette = {
    lightPaper: lightPalette.bg.paper,
    darkPaper: darkPalette.bg.paper,
}) {
    const errors = [];
    const contrast = [];
    if (!isPlainObject(input)) {
        return { ok: false, errors: ['Branding must be a JSON object.'], contrast };
    }
    rejectUnknownKeys(input, ['logoUrl', 'accentColor'], 'branding', errors);
    let logoUrl = null;
    if (input.logoUrl !== undefined && input.logoUrl !== null && input.logoUrl !== '') {
        if (typeof input.logoUrl !== 'string' || input.logoUrl.length > MAX_LOGO_URL_LENGTH) {
            errors.push(`branding.logoUrl must be a string of at most ${MAX_LOGO_URL_LENGTH} characters.`);
        }
        else {
            try {
                const url = new URL(input.logoUrl);
                if (url.protocol !== 'https:')
                    errors.push('branding.logoUrl must be an https:// URL.');
                else
                    logoUrl = url.toString();
            }
            catch {
                errors.push('branding.logoUrl must be a valid https:// URL.');
            }
        }
    }
    let accentColor = null;
    if (input.accentColor !== undefined && input.accentColor !== null && input.accentColor !== '') {
        const hex = readHex(input.accentColor, 'branding.accentColor', errors);
        if (hex) {
            accentColor = hex;
            const checks = [
                ['brand', 'label on accent button', '#FFFFFF', hex],
                ['light', 'accent against paper', hex, basePalette.lightPaper],
                ['dark', 'accent against paper', hex, basePalette.darkPaper],
            ];
            for (const [scheme, label, fg, bg] of checks) {
                const ratio = Math.round(contrastRatio(fg, bg) * 100) / 100;
                const passed = ratio >= WCAG.AA_LARGE;
                contrast.push({ scheme, label, foreground: fg, background: bg, ratio, required: WCAG.AA_LARGE, level: 'error', passed });
                if (!passed)
                    errors.push(`${scheme}: ${label} contrast is ${ratio}:1 (needs ${WCAG.AA_LARGE}:1). Choose a colour with more contrast.`);
            }
        }
    }
    return { ok: errors.length === 0, errors, contrast, branding: errors.length === 0 ? { logoUrl, accentColor } : undefined };
}
