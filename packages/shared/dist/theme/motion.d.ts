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
export declare const motion: {
    readonly duration: {
        /** instant feedback: colour/opacity of controls */
        readonly instant: 75;
        readonly fast: 150;
        readonly base: 200;
        /** entrances of dialogs, sheets, pages */
        readonly slow: 320;
        /** hero / ambient moments */
        readonly ambient: 600;
    };
    readonly easing: {
        readonly control: "ease";
        readonly surface: "ease-out";
        /** cubic-bezier control points [x1, y1, x2, y2]; emphasized = expo-out feel */
        readonly emphasized: readonly [0.16, 1, 0.3, 1];
        readonly standard: readonly [0.4, 0, 0.2, 1];
        readonly accelerate: readonly [0.4, 0, 1, 1];
        readonly decelerate: readonly [0, 0, 0.2, 1];
    };
    readonly spring: {
        gentle: {
            stiffness: number;
            damping: number;
            mass: number;
        };
        snappy: {
            stiffness: number;
            damping: number;
            mass: number;
        };
        bouncy: {
            stiffness: number;
            damping: number;
            mass: number;
        };
    };
    /** Staggered list reveals: delay per item, capped so long lists never feel slow. */
    readonly stagger: {
        readonly step: 40;
        readonly maxItems: 8;
        readonly initialDelay: 0;
    };
    readonly hoverLift: 2;
    readonly pressScale: {
        readonly button: 0.97;
        readonly subtle: 0.96;
    };
    /** Distance (px/dp) for fade-and-rise entrances */
    readonly enterOffset: 8;
    readonly reducedMotion: {
        /** Honour `prefers-reduced-motion` (web) / `AccessibilityInfo.isReduceMotionEnabled` (native) */
        readonly respect: true;
        /** Duration used instead of the normal one (0 = no animation, state changes are instant) */
        readonly duration: 0;
    };
};
export type MotionTokens = typeof motion;
export declare const cubicBezierCss: (points: readonly number[]) => string;
/** Delay (ms) for item `index` in a staggered list. */
export declare const staggerDelay: (index: number) => number;
export interface ResolvedMotion {
    duration: {
        instant: number;
        fast: number;
        base: number;
        slow: number;
        ambient: number;
    };
    staggerStep: number;
    hoverLift: number;
    enterOffset: number;
    /** true when springs / transforms should be replaced by simple fades or nothing */
    reduced: boolean;
}
/** Collapse motion for users who ask for less of it. Pure, so web and native behave identically. */
export declare function resolveMotion(prefersReducedMotion: boolean): ResolvedMotion;
