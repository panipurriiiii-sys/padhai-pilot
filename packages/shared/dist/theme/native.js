import { hitSlop, spacing } from './spacing.js';
import { radii } from './radii.js';
import { motion } from './motion.js';
import { shadowToNative } from './shadows.js';
import { fontWeights, nativeFontFamily, nativeTypeScale, } from './typography.js';
export function toNativeColors(p) {
    return {
        background: p.bg.desk,
        surface: p.bg.paper,
        surfaceSubtle: p.bg.paperWarm,
        surfaceElevated: p.bg.surfaceSubtle,
        border: p.border.paper,
        borderSubtle: p.border.subtle,
        borderStrong: p.border.input,
        textPrimary: p.ink.primary,
        textSecondary: p.ink.secondary,
        textMuted: p.ink.muted,
        textFaint: p.ink.faint,
        primary: p.brand.electric,
        primaryHover: p.brand.hover,
        primarySubtle: p.brand.subtleBg,
        primarySubtleBorder: p.brand.subtleBorder,
        primaryContrast: p.brand.onBrand,
        accent: p.brand.cyan,
        accentSubtle: p.brand.subtleBg,
        success: p.status.success.text,
        successSubtle: p.status.success.bg,
        successBorder: p.status.success.border,
        successSolid: p.status.success.solid,
        warning: p.status.warning.text,
        warningSubtle: p.status.warning.bg,
        warningBorder: p.status.warning.border,
        warningSolid: p.status.warning.solid,
        error: p.status.danger.text,
        errorSubtle: p.status.danger.bg,
        errorBorder: p.status.danger.border,
        errorSolid: p.status.danger.solid,
        info: p.status.info.text,
        infoSubtle: p.status.info.bg,
        infoBorder: p.status.info.border,
        infoSolid: p.status.info.solid,
        selected: p.bg.selected,
        scrim: p.effects.scrim,
        tabBarBackground: p.bg.paper,
        tabBarBorder: p.border.paper,
        stickyYellowBg: p.sticky.yellow.bg,
        stickyYellowBorder: p.sticky.yellow.border,
        stickyYellowText: p.sticky.yellow.text,
        stickyMintBg: p.sticky.mint.bg,
        stickyMintBorder: p.sticky.mint.border,
        stickyMintText: p.sticky.mint.text,
        stickyPinkBg: p.sticky.pink.bg,
        stickyPinkBorder: p.sticky.pink.border,
        stickyPinkText: p.sticky.pink.text,
        stickyBlueBg: p.sticky.blue.bg,
        stickyBlueBorder: p.sticky.blue.border,
        stickyBlueText: p.sticky.blue.text,
        stickyBeigeBg: p.sticky.beige.bg,
        stickyBeigeBorder: p.sticky.beige.border,
        stickyBeigeText: p.sticky.beige.text,
        deskGlowWarm: p.effects.deskGlowWarm,
        deskGlowPeach: p.effects.deskGlowPeach,
        deskGrid: p.effects.deskGrid,
        deskDot: p.effects.deskDot,
        brandDeep: p.effects.brandDeep,
        glassHighlight: p.effects.glassHighlight,
        glassSheen: p.effects.glassSheen,
        charts: p.charts,
    };
}
export function toNativeTypography(assignment, platform) {
    const sizes = {};
    const lineHeights = {};
    for (const key of Object.keys(nativeTypeScale)) {
        sizes[key] = nativeTypeScale[key].size;
        lineHeights[key] = nativeTypeScale[key].lineHeight;
    }
    return {
        fonts: {
            display: nativeFontFamily(assignment.display, platform),
            ui: nativeFontFamily(assignment.primary, platform),
            uiBold: nativeFontFamily(assignment.primary, platform),
            data: nativeFontFamily(assignment.data, platform),
        },
        sizes,
        lineHeights,
        weights: {
            regular: String(fontWeights.regular),
            medium: String(fontWeights.medium),
            semibold: String(fontWeights.semibold),
            bold: String(fontWeights.bold),
            heavy: String(fontWeights.extrabold),
        },
    };
}
export function toNativeTheme(resolved, scheme, platform) {
    const shadows = {};
    const source = resolved.shadows[scheme];
    for (const name of Object.keys(source)) {
        const layers = source[name];
        const outer = layers.filter((l) => !l.inset);
        shadows[name] = shadowToNative(outer.length ? outer : layers);
    }
    return {
        scheme,
        colors: toNativeColors(resolved.palettes[scheme]),
        typography: toNativeTypography(resolved.typography, platform),
        spacing,
        radii,
        hitSlop,
        shadows,
        motion,
        logoUrl: resolved.logoUrl,
    };
}
