import { Platform } from 'react-native';
import { darkPalette, hitSlop as sharedHitSlop, lightPalette, spacing as sharedSpacing, toNativeColors } from '@padhai-pilot/shared';
import type { NativeThemeColors } from '@padhai-pilot/shared';

/** Colours come from the shared design tokens (packages/shared/src/theme), the single source for web and mobile. */
export type ThemeColors = NativeThemeColors;
export const lightColors: ThemeColors = toNativeColors(lightPalette);
export const darkColors: ThemeColors = toNativeColors(darkPalette);

export const spacing = sharedSpacing;

export const radii = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const typography = {
  fonts: {
    // The three permitted families, bundled from assets/fonts (same faces the web portals load).
    // Android resolves fonts/<Family>.ttf (regular) and fonts/<Family>_bold.ttf (fontWeight 700);
    // iOS resolves the family name registered in Info.plist.
    // 1. Playfair Display: premium headings and titles
    display: Platform.select({ ios: 'Playfair Display', default: 'PlayfairDisplay' }),
    // 2. Raleway: primary interface, labels, buttons, navigation
    ui: 'Raleway',
    uiBold: 'Raleway',
    // 3. Inter: data, numbers, marks, tables, compact metadata
    data: 'Inter',
  },
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    title: 30,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
  lineHeights: {
    xs: 15,
    sm: 18,
    base: 22,
    lg: 24,
    xl: 28,
    xxl: 32,
    title: 38,
  },
} as const;

export const hitSlop = sharedHitSlop;
