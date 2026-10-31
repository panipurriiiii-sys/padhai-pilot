/**
 * React-Native-compatible output of the design tokens. No `react-native` import here (this package is
 * platform-neutral); the mobile app passes `Platform.OS`.
 */
import type { ChartTokens, ColorPalette, ColorScheme } from './colors.js';
import { hitSlop, spacing } from './spacing.js';
import { radii } from './radii.js';
import { motion } from './motion.js';
import { type NativeShadow, type ShadowName } from './shadows.js';
import { nativeTypeScale, type ApprovedFontFamily, type FontRole } from './typography.js';
import type { ResolvedTheme } from './theme.js';
/** Flat colour set consumed by React Native components. Every value derives from the shared palette. */
export interface NativeThemeColors {
    background: string;
    surface: string;
    surfaceSubtle: string;
    surfaceElevated: string;
    border: string;
    borderSubtle: string;
    borderStrong: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textFaint: string;
    primary: string;
    primaryHover: string;
    primarySubtle: string;
    primarySubtleBorder: string;
    primaryContrast: string;
    accent: string;
    accentSubtle: string;
    /** Readable status foreground (use on the matching `*Subtle` fill) */
    success: string;
    successSubtle: string;
    successBorder: string;
    /** Saturated status colour for icons, dots and fills */
    successSolid: string;
    warning: string;
    warningSubtle: string;
    warningBorder: string;
    warningSolid: string;
    error: string;
    errorSubtle: string;
    errorBorder: string;
    errorSolid: string;
    info: string;
    infoSubtle: string;
    infoBorder: string;
    infoSolid: string;
    selected: string;
    scrim: string;
    tabBarBackground: string;
    tabBarBorder: string;
    stickyYellowBg: string;
    stickyYellowBorder: string;
    stickyYellowText: string;
    stickyMintBg: string;
    stickyMintBorder: string;
    stickyMintText: string;
    stickyPinkBg: string;
    stickyPinkBorder: string;
    stickyPinkText: string;
    stickyBlueBg: string;
    stickyBlueBorder: string;
    stickyBlueText: string;
    stickyBeigeBg: string;
    stickyBeigeBorder: string;
    stickyBeigeText: string;
    /** Desk texture layers */
    deskGlowWarm: string;
    deskGlowPeach: string;
    deskGrid: string;
    deskDot: string;
    brandDeep: string;
    glassHighlight: string;
    glassSheen: string;
    charts: ChartTokens;
}
export declare function toNativeColors(p: ColorPalette): NativeThemeColors;
type NativeScaleKey = keyof typeof nativeTypeScale;
export interface NativeTypography {
    fonts: {
        display: string;
        ui: string;
        uiBold: string;
        data: string;
    };
    sizes: Record<NativeScaleKey, number>;
    lineHeights: Record<NativeScaleKey, number>;
    weights: {
        regular: '400';
        medium: '500';
        semibold: '600';
        bold: '700';
        heavy: '800';
    };
}
export declare function toNativeTypography(assignment: Record<FontRole, ApprovedFontFamily>, platform: 'ios' | 'android'): NativeTypography;
export interface NativeTheme {
    scheme: ColorScheme;
    colors: NativeThemeColors;
    typography: NativeTypography;
    spacing: typeof spacing;
    radii: typeof radii;
    hitSlop: typeof hitSlop;
    shadows: Record<ShadowName, NativeShadow>;
    motion: typeof motion;
    logoUrl: string | null;
}
export declare function toNativeTheme(resolved: ResolvedTheme, scheme: ColorScheme, platform: 'ios' | 'android'): NativeTheme;
export {};
