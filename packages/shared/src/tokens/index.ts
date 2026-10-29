/**
 * PadhaiPilot Design System Tokens
 * Authoritative source of design tokens for Web and React Native.
 * Color palette extracted from portfolio reference:
 * Background: #050608 | Surface: #0A0D12 | Primary: #1677FF | Text: #F5F7FA | Muted: #929BAA
 */

export const typography = {
  fonts: {
    /** Editorial, hero moments, dashboard welcome headings */
    display: 'var(--font-display, "Playfair Display", Georgia, serif)',
    /** Primary UI font: navigation, body, buttons, forms, labels */
    primary: 'var(--font-primary, "Raleway", -apple-system, BlinkMacSystemFont, sans-serif)',
    /** Compact data, numbers, KPIs, timestamps, tables */
    data: 'var(--font-data, "Inter", -apple-system, BlinkMacSystemFont, sans-serif)',
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },
  lineHeights: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
} as const;

export const darkPalette = {
  background: '#050608',
  surface: '#0A0D12',
  surfaceElevated: '#10151D',
  surfaceHover: '#141A24',
  border: 'rgba(255, 255, 255, 0.09)', // #ffffff17
  borderStrong: 'rgba(255, 255, 255, 0.16)',
  textPrimary: '#F5F7FA',
  textSecondary: '#C3CAD6',
  textMuted: '#929BAA',
  textDisabled: '#55595F',
  primary: '#1677FF',
  primaryHover: '#3395FF',
  primaryActive: '#0A6FE8',
  primarySubtle: 'rgba(22, 119, 255, 0.12)',
  primaryBorder: 'rgba(22, 119, 255, 0.28)',
  accent: '#1677FF',
  success: '#10B981',
  successSubtle: 'rgba(16, 185, 129, 0.12)',
  warning: '#F59E0B',
  warningSubtle: 'rgba(245, 158, 11, 0.12)',
  error: '#F43F5E',
  errorSubtle: 'rgba(244, 63, 94, 0.12)',
  info: '#00B7D7',
  infoSubtle: 'rgba(0, 183, 215, 0.12)',
} as const;

export const lightPalette = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#F1F5F9',
  surfaceHover: '#E2E8F0',
  border: 'rgba(0, 0, 0, 0.08)',
  borderStrong: 'rgba(0, 0, 0, 0.15)',
  textPrimary: '#0A0D12',
  textSecondary: '#334155',
  textMuted: '#64748B',
  textDisabled: '#94A3B8',
  primary: '#1677FF',
  primaryHover: '#0A6FE8',
  primaryActive: '#0A4FBF',
  primarySubtle: 'rgba(22, 119, 255, 0.08)',
  primaryBorder: 'rgba(22, 119, 255, 0.22)',
  accent: '#1677FF',
  success: '#059669',
  successSubtle: 'rgba(5, 150, 105, 0.08)',
  warning: '#D97706',
  warningSubtle: 'rgba(217, 119, 6, 0.08)',
  error: '#E11D48',
  errorSubtle: 'rgba(225, 29, 72, 0.08)',
  info: '#0284C7',
  infoSubtle: 'rgba(2, 132, 199, 0.08)',
} as const;

export const spacing = {
  0: '0px',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
} as const;

export const radii = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const;

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.35)',
  md: '0 4px 12px -2px rgba(0, 0, 0, 0.45)',
  lg: '0 10px 25px -3px rgba(0, 0, 0, 0.55)',
  glow: '0 0 20px rgba(22, 119, 255, 0.25)',
} as const;

export const motion = {
  durations: {
    instant: '75ms',
    fast: '150ms',
    normal: '250ms',
    slow: '400ms',
  },
  easings: {
    default: 'cubic-bezier(0.16, 1, 0.3, 1)',
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  },
} as const;

export const tokens = {
  typography,
  dark: darkPalette,
  light: lightPalette,
  spacing,
  radii,
  shadows,
  motion,
} as const;

export type ThemeTokens = typeof tokens;
