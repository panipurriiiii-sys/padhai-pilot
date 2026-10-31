/**
 * Motion tokens — ONE definition for web (CSS variables / motion libraries) and native (Animated / Reanimated).
 *
 * Principles (from the Teacher Portal): quick, physical, never decorative.
 *  - controls respond in 150ms (`ease`), surfaces lift in 200ms (`ease-out`)
 *  - hover lifts a card 2px; pressing a button scales to 0.97 (subtle/stamp 0.96)
 *  - premium moments (page / dialog entrance, list reveals) use the emphasized curve or a spring
 *  - when the user prefers reduced motion, durations collapse to `reducedMotion.duration` and springs/stagger/lifts
 *    are disabled (see `resolveMotion`)
 */

export interface SpringPreset {
  stiffness: number;
  damping: number;
  mass: number;
}

export const motion = {
  duration: {
    /** instant feedback: colour/opacity of controls */
    instant: 75,
    fast: 150,
    base: 200,
    /** entrances of dialogs, sheets, pages */
    slow: 320,
    /** hero / ambient moments */
    ambient: 600,
  },
  easing: {
    control: 'ease',
    surface: 'ease-out',
    /** cubic-bezier control points [x1, y1, x2, y2]; emphasized = expo-out feel */
    emphasized: [0.16, 1, 0.3, 1],
    standard: [0.4, 0, 0.2, 1],
    accelerate: [0.4, 0, 1, 1],
    decelerate: [0, 0, 0.2, 1],
  },
  spring: {
    gentle: { stiffness: 120, damping: 20, mass: 1 },
    snappy: { stiffness: 300, damping: 30, mass: 1 },
    bouncy: { stiffness: 220, damping: 14, mass: 1 },
  } satisfies Record<string, SpringPreset>,
  /** Staggered list reveals: delay per item, capped so long lists never feel slow. */
  stagger: {
    step: 40,
    maxItems: 8,
    initialDelay: 0,
  },
  hoverLift: 2,
  pressScale: {
    button: 0.97,
    subtle: 0.96,
  },
  /** Distance (px/dp) for fade-and-rise entrances */
  enterOffset: 8,
  reducedMotion: {
    /** Honour `prefers-reduced-motion` (web) / `AccessibilityInfo.isReduceMotionEnabled` (native) */
    respect: true,
    /** Duration used instead of the normal one (0 = no animation, state changes are instant) */
    duration: 0,
  },
} as const;

export type MotionTokens = typeof motion;

export const cubicBezierCss = (points: readonly number[]): string => `cubic-bezier(${points.join(', ')})`;

/** Delay (ms) for item `index` in a staggered list. */
export const staggerDelay = (index: number): number =>
  motion.stagger.initialDelay + Math.min(index, motion.stagger.maxItems) * motion.stagger.step;

export interface ResolvedMotion {
  duration: { instant: number; fast: number; base: number; slow: number; ambient: number };
  staggerStep: number;
  hoverLift: number;
  enterOffset: number;
  /** true when springs / transforms should be replaced by simple fades or nothing */
  reduced: boolean;
}

/** Collapse motion for users who ask for less of it. Pure, so web and native behave identically. */
export function resolveMotion(prefersReducedMotion: boolean): ResolvedMotion {
  const reduce = prefersReducedMotion && motion.reducedMotion.respect;
  const d = motion.duration;
  const r = motion.reducedMotion.duration;
  return {
    duration: reduce
      ? { instant: r, fast: r, base: r, slow: r, ambient: r }
      : { instant: d.instant, fast: d.fast, base: d.base, slow: d.slow, ambient: d.ambient },
    staggerStep: reduce ? 0 : motion.stagger.step,
    hoverLift: reduce ? 0 : motion.hoverLift,
    enterOffset: reduce ? 0 : motion.enterOffset,
    reduced: reduce,
  };
}
