import { Platform } from 'react-native';

export interface ThemeColors {
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
  primary: string;
  primarySubtle: string;
  primaryContrast: string;
  accent: string;
  accentSubtle: string;
  success: string;
  successSubtle: string;
  warning: string;
  warningSubtle: string;
  error: string;
  errorSubtle: string;
  tabBarBackground: string;
  tabBarBorder: string;
}

// Light Luxury Educational Palette
export const lightColors: ThemeColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSubtle: '#F1F5F9',
  surfaceElevated: '#FFFFFF',
  border: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  borderStrong: '#CBD5E1',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  primary: '#1677FF',
  primarySubtle: '#EFF6FF',
  primaryContrast: '#FFFFFF',
  accent: '#D97706',
  accentSubtle: '#FEF3C7',
  success: '#10B981',
  successSubtle: '#ECFDF5',
  warning: '#F59E0B',
  warningSubtle: '#FFFBEB',
  error: '#EF4444',
  errorSubtle: '#FEF2F2',
  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
};

// Dark Luxury Control Plane Palette (Aditya Kashid Aesthetic)
export const darkColors: ThemeColors = {
  background: '#07090E',
  surface: '#0D111A',
  surfaceSubtle: '#131826',
  surfaceElevated: '#181E30',
  border: '#1E2536',
  borderSubtle: '#151A28',
  borderStrong: '#2B344C',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  primary: '#1677FF',
  primarySubtle: '#0F1E36',
  primaryContrast: '#FFFFFF',
  accent: '#F59E0B',
  accentSubtle: '#2A1F0D',
  success: '#10B981',
  successSubtle: '#064E3B',
  warning: '#F59E0B',
  warningSubtle: '#78350F',
  error: '#EF4444',
  errorSubtle: '#7F1D1D',
  tabBarBackground: '#0D111A',
  tabBarBorder: '#1E2536',
};

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  giant: 40,
} as const;

export const radii = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export const typography = {
  fonts: {
    // 1. Playfair Display — for premium headings and titles
    display: Platform.select({
      ios: 'Playfair Display',
      android: 'serif',
      default: 'serif',
    }),
    // 2. Raleway — for primary interface, labels, buttons, navigation
    ui: Platform.select({
      ios: 'Raleway',
      android: 'sans-serif',
      default: 'sans-serif',
    }),
    uiBold: Platform.select({
      ios: 'Raleway-Bold',
      android: 'sans-serif-medium',
      default: 'sans-serif',
    }),
    // 3. Inter — for data, numbers, marks, tables, and compact metadata
    data: Platform.select({
      ios: 'Inter',
      android: 'sans-serif',
      default: 'monospace',
    }),
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

export const hitSlop = {
  small: { top: 8, bottom: 8, left: 8, right: 8 },
  medium: { top: 12, bottom: 12, left: 12, right: 12 },
  large: { top: 16, bottom: 16, left: 16, right: 16 },
} as const;
