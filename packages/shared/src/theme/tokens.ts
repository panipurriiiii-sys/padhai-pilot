/** Aggregated, typed design tokens — the single authoritative definition used by every platform. */
import { palettes } from './colors.js';
import {
  APPROVED_FONT_FAMILIES,
  DEFAULT_FONT_ASSIGNMENT,
  FONT_FAMILIES,
  fontWeights,
  letterSpacing,
  nativeTypeScale,
  typeScale,
} from './typography.js';
import { spacing, hitSlop, MIN_TOUCH_TARGET } from './spacing.js';
import { radii } from './radii.js';
import { lightShadows, darkShadows } from './shadows.js';
import { motion } from './motion.js';

export const tokens = {
  colors: palettes,
  typography: {
    families: FONT_FAMILIES,
    approved: APPROVED_FONT_FAMILIES,
    defaultAssignment: DEFAULT_FONT_ASSIGNMENT,
    weights: fontWeights,
    scale: typeScale,
    nativeScale: nativeTypeScale,
    letterSpacing,
  },
  spacing,
  hitSlop,
  minTouchTarget: MIN_TOUCH_TARGET,
  radii,
  shadows: { light: lightShadows, dark: darkShadows },
  motion,
} as const;

export type DesignTokens = typeof tokens;
