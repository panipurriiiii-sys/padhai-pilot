/** Spacing scale: a 4px grid. Names match the native `spacing` keys; web exposes them as `--space-*`. */
export declare const spacing: {
    readonly none: 0;
    readonly xxs: 2;
    readonly xs: 4;
    readonly sm: 8;
    readonly md: 12;
    readonly lg: 16;
    readonly xl: 20;
    readonly xxl: 24;
    readonly xxxl: 32;
    readonly giant: 40;
};
export type SpacingKey = keyof typeof spacing;
/** Minimum comfortable touch target (dp / px). */
export declare const MIN_TOUCH_TARGET = 44;
export declare const hitSlop: {
    readonly small: {
        readonly top: 8;
        readonly bottom: 8;
        readonly left: 8;
        readonly right: 8;
    };
    readonly medium: {
        readonly top: 12;
        readonly bottom: 12;
        readonly left: 12;
        readonly right: 12;
    };
    readonly large: {
        readonly top: 16;
        readonly bottom: 16;
        readonly left: 16;
        readonly right: 16;
    };
};
