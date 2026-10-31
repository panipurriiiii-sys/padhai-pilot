/**
 * React-Native-compatible output of the design tokens. No `react-native` import here (this package is
 * platform-neutral); the mobile app passes `Platform.OS`.
 */
import type { ChartTokens, ColorPalette, ColorScheme } from './colors.js';
import { hitSlop, spacing } from './spacing.js';
import { radii } from './radii.js';
import { motion } from './motion.js';
import { shadowToNative, type NativeShadow, type ShadowLayer, type ShadowName } from './shadows.js';
import {
  fontWeights,
  nativeFontFamily,
  nativeTypeScale,
  type ApprovedFontFamily,
  type FontRole,
} from './typography.js';
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

export function toNativeColors(p: ColorPalette): NativeThemeColors {
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

type NativeScaleKey = keyof typeof nativeTypeScale;

export interface NativeTypography {
  fonts: { display: string; ui: string; uiBold: string; data: string };
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

export function toNativeTypography(
  assignment: Record<FontRole, ApprovedFontFamily>,
  platform: 'ios' | 'android',
): NativeTypography {
  const sizes = {} as Record<NativeScaleKey, number>;
  const lineHeights = {} as Record<NativeScaleKey, number>;
  for (const key of Object.keys(nativeTypeScale) as NativeScaleKey[]) {
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
      regular: String(fontWeights.regular) as '400',
      medium: String(fontWeights.medium) as '500',
      semibold: String(fontWeights.semibold) as '600',
      bold: String(fontWeights.bold) as '700',
      heavy: String(fontWeights.extrabold) as '800',
    },
  };
}

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

export function toNativeTheme(resolved: ResolvedTheme, scheme: ColorScheme, platform: 'ios' | 'android'): NativeTheme {
  const shadows = {} as Record<ShadowName, NativeShadow>;
  const source = resolved.shadows[scheme];
  for (const name of Object.keys(source) as ShadowName[]) {
    const layers: ShadowLayer[] = source[name];
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
