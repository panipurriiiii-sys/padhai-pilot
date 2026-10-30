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
  success: string;
  successSubtle: string;
  warning: string;
  warningSubtle: string;
  error: string;
  errorSubtle: string;
  tabBarBackground: string;
  tabBarBorder: string;
}

export const lightColors: ThemeColors = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceSubtle: '#F3F4F6',
  surfaceElevated: '#FFFFFF',
  border: '#E5E7EB',
  borderSubtle: '#F3F4F6',
  borderStrong: '#D1D5DB',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  primary: '#1D4ED8',
  primarySubtle: '#EFF6FF',
  primaryContrast: '#FFFFFF',
  success: '#10B981',
  successSubtle: '#ECFDF5',
  warning: '#F59E0B',
  warningSubtle: '#FFFBEB',
  error: '#EF4444',
  errorSubtle: '#FEF2F2',
  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#E5E7EB',
};

export const darkColors: ThemeColors = {
  background: '#090A0F',
  surface: '#11131A',
  surfaceSubtle: '#181B24',
  surfaceElevated: '#1F2330',
  border: '#232733',
  borderSubtle: '#1C1F2B',
  borderStrong: '#32384A',
  textPrimary: '#F3F4F6',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  primary: '#3B82F6',
  primarySubtle: '#1E293B',
  primaryContrast: '#FFFFFF',
  success: '#10B981',
  successSubtle: '#064E3B',
  warning: '#F59E0B',
  warningSubtle: '#78350F',
  error: '#EF4444',
  errorSubtle: '#7F1D1D',
  tabBarBackground: '#11131A',
  tabBarBorder: '#232733',
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
