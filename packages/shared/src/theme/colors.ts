/**
 * PadhaiPilot colour tokens — AK Paper-Desk identity.
 *
 * SOURCE OF TRUTH: values were extracted 1:1 from `apps/teacher/src/app/globals.css` (the Teacher Portal is the
 * master visual reference). The frozen copy of that stylesheet lives in `__fixtures__/teacher-reference.css` and the
 * test-suite fails if any value below drifts from it.
 *
 * Light is the default for every app. Dark is the Teacher Portal's `.dark` palette. A few dark-mode values that the
 * Teacher stylesheet never defined (status / sticky tints, hover border, scrollbar) come from the previous dark-luxury
 * palette and are marked `derived` below.
 */

import { mixHex } from './contrast.js';

export type ColorScheme = 'light' | 'dark';

/** A coloured "sticky note" / status family: fill, hairline border, readable text. */
export interface TintColor {
  bg: string;
  border: string;
  text: string;
}

/** Status family: a saturated `solid` for icons/stamps/borders plus an accessible tint. */
export interface StatusColor extends TintColor {
  solid: string;
}

export interface ChartTokens {
  /** Categorical series 1..8 (distinguishable, >= 3:1 against paper) */
  categorical: readonly string[];
  /** Sequential scale, low -> high (blue ramp built from the sticky-blue tint to the brand to navy) */
  sequential: readonly string[];
  /** Diverging scale, negative -> neutral -> positive */
  diverging: readonly string[];
  /** Attendance statuses — the P / A / L / E stamp colours */
  attendance: { present: string; absent: string; late: string; excused: string };
  grid: string;
  axis: string;
  axisLabel: string;
  referenceLine: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
}

export interface ColorPalette {
  bg: {
    /** Desk surface (warm off-white / ivory) */
    desk: string;
    /** Fresh white paper sheet, card base */
    paper: string;
    /** Warm cream paper, container base */
    paperWarm: string;
    /** Recessed secondary surface, tags */
    surfaceSubtle: string;
    surface2: string;
    /** Secondary buttons / chip base */
    secondary: string;
    /** Muted background pill */
    muted: string;
    /** Selected card fill */
    selected: string;
  };
  border: {
    paper: string;
    input: string;
    focus: string;
    hover: string;
    /** Hairline inner separators */
    subtle: string;
  };
  brand: {
    /** AK signature royal electric blue */
    electric: string;
    hover: string;
    cyan: string;
    glow: string;
    /** Text/icon colour on top of a solid brand fill */
    onBrand: string;
    /** `.btn-subtle` fill / border */
    subtleBg: string;
    subtleBorder: string;
  };
  ink: {
    primary: string;
    secondary: string;
    muted: string;
    faint: string;
  };
  sticky: {
    yellow: TintColor;
    pink: TintColor;
    mint: TintColor;
    blue: TintColor;
    beige: TintColor;
  };
  status: {
    success: StatusColor;
    warning: StatusColor;
    danger: StatusColor;
    info: StatusColor;
  };
  effects: {
    tape: string;
    /** Modal / drawer backdrop */
    scrim: string;
    scrollbarThumb: string;
    scrollbarThumbHover: string;
    /** Frosted navigation bar fill */
    glassNav: string;
    /** `.ak-desk-surface` layers */
    deskGlowWarm: string;
    deskGlowPeach: string;
    deskGrid: string;
    deskGridStrong: string;
    deskDot: string;
    /** `.electric-spotlight` radial */
    spotlight: string;
    tapeBorder: string;
    /** `.corkboard-surface` */
    corkBase: string;
    corkDotDark: string;
    corkDotMid: string;
    corkDotLight: string;
    /** Optional ambient tokens (atmosphere only, never the primary palette) */
    brandDeep: string;
    glassHighlight: string;
    glassSheen: string;
  };
  charts: ChartTokens;
}

export const lightPalette: ColorPalette = {
  bg: {
    desk: '#F8F7F4',
    paper: '#FFFFFF',
    paperWarm: '#FAF8F5',
    surfaceSubtle: '#F3EFE9',
    surface2: '#F3EFE9',
    secondary: '#EEE9E2',
    muted: '#EEEAE5',
    selected: '#F0F6FF',
  },
  border: {
    paper: '#E3DFD9',
    input: '#DDD8D2',
    focus: '#1677FF',
    hover: '#B8B2A6',
    subtle: '#EEEAE5',
  },
  brand: {
    electric: '#1677FF',
    hover: '#0A6FE8',
    cyan: '#0A6FE8',
    glow: 'rgba(22, 119, 255, 0.45)',
    onBrand: '#FFFFFF',
    subtleBg: '#EFF6FF',
    subtleBorder: '#BFDBFE',
  },
  ink: {
    primary: '#1C1917',
    secondary: '#44403C',
    muted: '#78716C',
    faint: '#A8A29E',
  },
  sticky: {
    yellow: { bg: '#FFF3C4', border: '#F6E09E', text: '#5C3D00' },
    pink: { bg: '#FDE2E4', border: '#F8BCC2', text: '#6D1B28' },
    mint: { bg: '#DAF5E4', border: '#B2E6C4', text: '#0E4A28' },
    blue: { bg: '#E1EDFF', border: '#BBD4FC', text: '#0A3D78' },
    beige: { bg: '#F2E8DC', border: '#DECDBD', text: '#4A3728' },
  },
  // Solids come from the Teacher "rubber stamp" borders (P / A / L / E). Tints come from the sticky-note and stamp fills.
  status: {
    success: { solid: '#10B981', bg: '#DAF5E4', border: '#B2E6C4', text: '#0E4A28' },
    warning: { solid: '#F59E0B', bg: '#FEF3C7', border: '#F6E09E', text: '#78350F' },
    danger: { solid: '#F43F5E', bg: '#FDE2E4', border: '#F8BCC2', text: '#6D1B28' },
    info: { solid: '#3B82F6', bg: '#E1EDFF', border: '#BBD4FC', text: '#0A3D78' },
  },
  effects: {
    tape: 'rgba(224, 218, 208, 0.55)',
    scrim: 'rgba(0, 0, 0, 0.4)',
    scrollbarThumb: '#D5D0C7',
    scrollbarThumbHover: '#B8B2A6',
    glassNav: 'rgba(248, 247, 244, 0.88)',
    deskGlowWarm: 'rgba(244, 230, 202, 0.7)',
    deskGlowPeach: 'rgba(254, 222, 196, 0.45)',
    deskGrid: 'rgba(208, 205, 202, 0.25)',
    deskGridStrong: 'rgba(208, 205, 202, 0.35)',
    deskDot: 'rgba(107, 97, 87, 0.05)',
    spotlight: 'rgba(22, 119, 255, 0.08)',
    tapeBorder: 'rgba(200, 195, 185, 0.4)',
    corkBase: '#DEB078',
    corkDotDark: '#AA672D',
    corkDotMid: '#97571E',
    corkDotLight: '#D49E5F',
    brandDeep: '#0A4FBF',
    glassHighlight: 'rgba(255, 255, 255, 0.6)',
    glassSheen: 'rgba(255, 255, 255, 0.16)',
  },
  // Categorical hues come from the Teacher Portal: electric blue, the emerald / amber / rose Tailwind shades its
  // badges use, and the sticky-note ink colours (navy, beige-brown, mint-dark) plus muted ink.
  charts: {
    categorical: ['#1677FF', '#059669', '#D97706', '#BE123C', '#0A3D78', '#4A3728', '#78716C', '#0E4A28'],
    sequential: [
      '#E1EDFF',
      mixHex('#E1EDFF', '#1677FF', 0.5),
      '#1677FF',
      mixHex('#1677FF', '#0A3D78', 0.5),
      '#0A3D78',
    ],
    diverging: ['#F43F5E', '#F8BCC2', '#F3EFE9', '#B2E6C4', '#10B981'],
    attendance: { present: '#10B981', absent: '#F43F5E', late: '#F59E0B', excused: '#3B82F6' },
    grid: '#E3DFD9',
    axis: '#DDD8D2',
    axisLabel: '#78716C',
    referenceLine: '#B8B2A6',
    tooltipBg: '#FFFFFF',
    tooltipBorder: '#E3DFD9',
    tooltipText: '#1C1917',
  },
};

export const darkPalette: ColorPalette = {
  bg: {
    desk: '#050608',
    paper: '#0A0D12',
    paperWarm: '#10151D',
    surfaceSubtle: '#141A24',
    surface2: '#10151D',
    secondary: '#161D28',
    muted: '#1A2230',
    // derived: brand tint on dark paper
    selected: 'rgba(22, 119, 255, 0.12)',
  },
  border: {
    paper: 'rgba(255, 255, 255, 0.09)',
    input: 'rgba(255, 255, 255, 0.14)',
    focus: '#00D9FF',
    // derived (previous dark palette `borderStrong`)
    hover: 'rgba(255, 255, 255, 0.16)',
    subtle: 'rgba(255, 255, 255, 0.05)',
  },
  brand: {
    electric: '#1677FF',
    hover: '#3395FF',
    cyan: '#00D9FF',
    glow: 'rgba(0, 217, 255, 0.45)',
    onBrand: '#FFFFFF',
    // derived (previous dark palette `primarySubtle` / `primaryBorder`)
    subtleBg: 'rgba(22, 119, 255, 0.12)',
    subtleBorder: 'rgba(22, 119, 255, 0.28)',
  },
  ink: {
    primary: '#F5F7FA',
    secondary: '#C3CAD6',
    muted: '#929BAA',
    faint: '#55595F',
  },
  // derived: dark tints from the previous mobile/web dark palette
  sticky: {
    yellow: { bg: '#231C0D', border: '#5C3D00', text: '#FCD34D' },
    pink: { bg: '#2A0F14', border: '#881337', text: '#FDA4AF' },
    mint: { bg: '#0B2416', border: '#14532D', text: '#6EE7B7' },
    blue: { bg: '#0D1E36', border: '#1E3A8A', text: '#93C5FD' },
    beige: { bg: '#1E1812', border: '#4A3728', text: '#DECDBD' },
  },
  status: {
    success: { solid: '#10B981', bg: '#0B2416', border: '#14532D', text: '#6EE7B7' },
    warning: { solid: '#F59E0B', bg: '#231C0D', border: '#5C3D00', text: '#FCD34D' },
    danger: { solid: '#F43F5E', bg: '#2A0F14', border: '#881337', text: '#FDA4AF' },
    info: { solid: '#3B82F6', bg: '#0D1E36', border: '#1E3A8A', text: '#93C5FD' },
  },
  effects: {
    tape: 'rgba(255, 255, 255, 0.12)',
    scrim: 'rgba(0, 0, 0, 0.6)',
    scrollbarThumb: 'rgba(255, 255, 255, 0.16)',
    scrollbarThumbHover: 'rgba(255, 255, 255, 0.28)',
    glassNav: 'rgba(5, 6, 8, 0.88)',
    deskGlowWarm: 'rgba(22, 119, 255, 0.06)',
    deskGlowPeach: 'rgba(0, 217, 255, 0.04)',
    deskGrid: 'rgba(255, 255, 255, 0.03)',
    deskGridStrong: 'rgba(255, 255, 255, 0.05)',
    deskDot: 'rgba(255, 255, 255, 0.04)',
    spotlight: 'rgba(0, 217, 255, 0.08)',
    tapeBorder: 'rgba(255, 255, 255, 0.16)',
    corkBase: '#DEB078',
    corkDotDark: '#AA672D',
    corkDotMid: '#97571E',
    corkDotLight: '#D49E5F',
    brandDeep: '#0A4FBF',
    glassHighlight: 'rgba(255, 255, 255, 0.08)',
    glassSheen: 'rgba(255, 255, 255, 0.04)',
  },
  charts: {
    categorical: ['#3395FF', '#34D399', '#FBBF24', '#FB7185', '#93C5FD', '#DECDBD', '#929BAA', '#6EE7B7'],
    sequential: [
      '#0D1E36',
      mixHex('#0D1E36', '#1677FF', 0.5),
      '#1677FF',
      mixHex('#1677FF', '#93C5FD', 0.5),
      '#93C5FD',
    ],
    diverging: ['#F43F5E', '#881337', '#141A24', '#14532D', '#10B981'],
    attendance: { present: '#10B981', absent: '#F43F5E', late: '#F59E0B', excused: '#3B82F6' },
    grid: 'rgba(255, 255, 255, 0.09)',
    axis: 'rgba(255, 255, 255, 0.14)',
    axisLabel: '#929BAA',
    referenceLine: 'rgba(255, 255, 255, 0.28)',
    tooltipBg: '#10151D',
    tooltipBorder: 'rgba(255, 255, 255, 0.14)',
    tooltipText: '#F5F7FA',
  },
};

export const palettes: Record<ColorScheme, ColorPalette> = {
  light: lightPalette,
  dark: darkPalette,
};
