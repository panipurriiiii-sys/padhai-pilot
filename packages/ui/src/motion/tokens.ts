/**
 * PadhaiPilot motion tokens - the single source of timing/easing/spring/stagger values.
 * Pure data (no imports): consumed by the web components in this package AND by React Native
 * (`@padhai-pilot/ui/motion`), so a "standard" transition is the same length on every platform.
 *
 * Principles (see docs/global-animation-system.md):
 *  1. Motion explains a change (enter, exit, reorder, feedback); it never loops for decoration.
 *  2. Fast by default: <= 240ms for UI feedback, <= 420ms for entrances, longer only for storytelling.
 *  3. Only transform + opacity on interactive/data-heavy screens (GPU friendly, no layout thrash).
 *  4. prefers-reduced-motion: positional/scale motion is removed, opacity/colour changes remain.
 */

/** Durations in seconds (web / Motion). */
export const duration = {
  instant: 0.08,
  fast: 0.15,
  standard: 0.24,
  emphasized: 0.42,
  slow: 0.7,
} as const;

/** Durations in milliseconds (React Native Animated, CSS). */
export const durationMs = {
  instant: 80,
  fast: 150,
  standard: 240,
  emphasized: 420,
  slow: 700,
} as const;

/** Cubic-bezier control points. */
export const easing = {
  /** default for most UI: quick start, soft landing */
  standard: [0.2, 0, 0, 1],
  /** entrances / reveals */
  decelerate: [0.22, 1, 0.36, 1],
  /** exits */
  accelerate: [0.4, 0, 1, 1],
  /** large moves: dialogs, page changes */
  emphasized: [0.3, 0, 0, 1],
} as const;

export const spring = {
  /** layout / indicator movement */
  snappy: { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 },
  /** cards, drawers */
  gentle: { type: 'spring', stiffness: 220, damping: 26, mass: 1 },
  /** success moments only */
  playful: { type: 'spring', stiffness: 360, damping: 18, mass: 0.9 },
} as const;

export const stagger = {
  /** delay between list items (seconds) */
  list: 0.04,
  /** delay between page sections */
  section: 0.08,
  /** never stagger more than this many items: later items appear together */
  maxItems: 10,
} as const;

/** Distances in px for entrance/hover offsets. */
export const distance = {
  nudge: 4,
  reveal: 14,
  lift: 2,
  sheet: 24,
} as const;

export const scale = {
  press: 0.97,
  hover: 1.02,
  enter: 0.96,
} as const;

/** Where motion must NOT be added (kept next to the tokens so reviewers see it). */
export const restrictedSurfaces = [
  'attendance register rows',
  'bulk marks-entry cells',
  'long student / faculty lists (> 30 rows) beyond a single first-render fade',
  'frequently refreshing numbers',
] as const;

/** Delay for item `index` in a staggered list, capped by `stagger.maxItems`. */
export function staggerDelay(index: number, step: number = stagger.list): number {
  return Math.min(index, stagger.maxItems) * step;
}

/** Chart animation timing shared by web and native charts. */
export const chart = {
  /** bars grow / lines draw in */
  enter: duration.slow,
  /** delay between bars */
  barStagger: 0.03,
  /** hover / focus feedback */
  hover: duration.fast,
} as const;
