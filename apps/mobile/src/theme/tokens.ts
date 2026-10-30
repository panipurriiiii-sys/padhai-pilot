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
  textFaint: string;
  primary: string;
  primaryHover: string;
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

  // Web Paper-Desk Sticky Note Tokens
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
}

// Light AK Paper-Desk Palette (Exact 1:1 match with Web apps/teacher & apps/student)
export const lightColors: ThemeColors = {
  background: '#F8F6F0',        // --bg-desk (warm paper desk surface)
  surface: '#FFFFFF',           // --bg-paper (crisp white sheet, card base)
  surfaceSubtle: '#FAF8F5',     // --bg-paper-warm (warm cream container base)
  surfaceElevated: '#F3EFE9',   // --bg-surface-subtle (recessed tag surface)
  border: '#E3DFD9',            // --border-paper (subtle paper border)
  borderSubtle: '#EEEAE5',      // subtle inner separator
  borderStrong: '#DDD8D2',      // --border-input (form input border)
  textPrimary: '#1C1917',       // --ink-primary (deepest crisp ink, Stone 900)
  textSecondary: '#44403C',     // --ink-secondary (reading ink, Stone 700)
  textMuted: '#78716C',         // --ink-muted (metadata ink, Stone 500)
  textFaint: '#A8A29E',         // --ink-faint (disabled/watermark ink, Stone 400)
  primary: '#1677FF',           // --brand-electric (Royal Electric Blue)
  primaryHover: '#0A6FE8',      // --brand-hover
  primarySubtle: '#E1EDFF',     // subtle blue highlight chip
  primaryContrast: '#FFFFFF',
  accent: '#0A6FE8',            // --brand-cyan micro-highlight
  accentSubtle: '#FFF3C4',
  success: '#0E4A28',           // --sticky-mint-text
  successSubtle: '#DAF5E4',     // --sticky-mint
  warning: '#5C3D00',           // --sticky-yellow-text
  warningSubtle: '#FFF3C4',     // --sticky-yellow
  error: '#6D1B28',             // --sticky-pink-text
  errorSubtle: '#FDE2E4',       // --sticky-pink
  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#E3DFD9',

  stickyYellowBg: '#FFF3C4',
  stickyYellowBorder: '#F6E09E',
  stickyYellowText: '#5C3D00',
  stickyMintBg: '#DAF5E4',
  stickyMintBorder: '#B2E6C4',
  stickyMintText: '#0E4A28',
  stickyPinkBg: '#FDE2E4',
  stickyPinkBorder: '#F8BCC2',
  stickyPinkText: '#6D1B28',
  stickyBlueBg: '#E1EDFF',
  stickyBlueBorder: '#BBD4FC',
  stickyBlueText: '#0A3D78',
};

// Dark AK Paper-Desk Palette (Exact 1:1 match with Web apps/teacher & apps/student .dark)
export const darkColors: ThemeColors = {
  background: '#050608',        // --bg-desk (pure dark desk canvas)
  surface: '#0A0D12',           // --bg-paper (dark card base)
  surfaceSubtle: '#10151D',     // --bg-paper-warm (elevated container base)
  surfaceElevated: '#141A24',   // --bg-surface-subtle (interactive pill / chip base)
  border: 'rgba(255, 255, 255, 0.08)', // --border-paper (subtle border)
  borderSubtle: 'rgba(255, 255, 255, 0.04)',
  borderStrong: 'rgba(255, 255, 255, 0.14)', // --border-input
  textPrimary: '#F5F7FA',       // --ink-primary (crisp high-contrast ink)
  textSecondary: '#C3CAD6',     // --ink-secondary (reading ink)
  textMuted: '#929BAA',         // --ink-muted (caption ink)
  textFaint: '#55595F',         // --ink-faint (watermark ink)
  primary: '#1677FF',           // --brand-electric
  primaryHover: '#3395FF',
  primarySubtle: 'rgba(22, 119, 255, 0.12)',
  primaryContrast: '#FFFFFF',
  accent: '#00D9FF',            // --brand-cyan highlight
  accentSubtle: 'rgba(0, 217, 255, 0.12)',
  success: '#10B981',
  successSubtle: 'rgba(16, 185, 129, 0.12)',
  warning: '#F59E0B',
  warningSubtle: 'rgba(245, 158, 11, 0.12)',
  error: '#F43F5E',
  errorSubtle: 'rgba(244, 63, 94, 0.12)',
  tabBarBackground: '#0A0D12',
  tabBarBorder: 'rgba(255, 255, 255, 0.08)',

  stickyYellowBg: '#231C0D',
  stickyYellowBorder: '#5C3D00',
  stickyYellowText: '#FCD34D',
  stickyMintBg: '#0B2416',
  stickyMintBorder: '#14532D',
  stickyMintText: '#6EE7B7',
  stickyPinkBg: '#2A0F14',
  stickyPinkBorder: '#881337',
  stickyPinkText: '#FDA4AF',
  stickyBlueBg: '#0D1E36',
  stickyBlueBorder: '#1E3A8A',
  stickyBlueText: '#93C5FD',
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
