/** Spacing scale: a 4px grid. Names match the native `spacing` keys; web exposes them as `--space-*`. */
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
};
/** Minimum comfortable touch target (dp / px). */
export const MIN_TOUCH_TARGET = 44;
export const hitSlop = {
    small: { top: 8, bottom: 8, left: 8, right: 8 },
    medium: { top: 12, bottom: 12, left: 12, right: 12 },
    large: { top: 16, bottom: 16, left: 16, right: 16 },
};
