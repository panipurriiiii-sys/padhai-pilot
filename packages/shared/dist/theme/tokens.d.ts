export declare const tokens: {
    readonly colors: Record<import("./colors.js").ColorScheme, import("./colors.js").ColorPalette>;
    readonly typography: {
        readonly families: Record<import("./typography.js").FontRole, string>;
        readonly approved: readonly ["Playfair Display", "Raleway", "Inter"];
        readonly defaultAssignment: Record<import("./typography.js").FontRole, "Playfair Display" | "Raleway" | "Inter">;
        readonly weights: {
            readonly regular: 400;
            readonly medium: 500;
            readonly semibold: 600;
            readonly bold: 700;
            readonly extrabold: 800;
        };
        readonly scale: {
            readonly micro: {
                readonly size: 10;
                readonly lineHeight: 1.4;
            };
            readonly caption: {
                readonly size: 11;
                readonly lineHeight: 1.4;
            };
            readonly xs: {
                readonly size: 12;
                readonly lineHeight: 1.333;
            };
            readonly sm: {
                readonly size: 14;
                readonly lineHeight: 1.428;
            };
            readonly base: {
                readonly size: 16;
                readonly lineHeight: 1.5;
            };
            readonly lg: {
                readonly size: 18;
                readonly lineHeight: 1.555;
            };
            readonly xl: {
                readonly size: 20;
                readonly lineHeight: 1.4;
            };
            readonly '2xl': {
                readonly size: 24;
                readonly lineHeight: 1.333;
            };
            readonly '3xl': {
                readonly size: 30;
                readonly lineHeight: 1.2;
            };
            readonly '4xl': {
                readonly size: 36;
                readonly lineHeight: 1.111;
            };
        };
        readonly nativeScale: {
            readonly xs: {
                readonly size: 11;
                readonly lineHeight: 15;
            };
            readonly sm: {
                readonly size: 13;
                readonly lineHeight: 18;
            };
            readonly base: {
                readonly size: 15;
                readonly lineHeight: 22;
            };
            readonly lg: {
                readonly size: 17;
                readonly lineHeight: 24;
            };
            readonly xl: {
                readonly size: 20;
                readonly lineHeight: 28;
            };
            readonly xxl: {
                readonly size: 24;
                readonly lineHeight: 32;
            };
            readonly title: {
                readonly size: 30;
                readonly lineHeight: 38;
            };
        };
        readonly letterSpacing: {
            readonly tight: -0.025;
            readonly normal: 0;
            readonly wide: 0.05;
        };
    };
    readonly spacing: {
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
    readonly hitSlop: {
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
    readonly minTouchTarget: 44;
    readonly radii: {
        readonly none: 0;
        readonly xs: 4;
        readonly sm: 6;
        readonly md: 8;
        readonly lg: 12;
        readonly xl: 16;
        readonly full: 9999;
    };
    readonly shadows: {
        readonly light: Record<import("./shadows.js").ShadowName, import("./shadows.js").ShadowLayer[]>;
        readonly dark: Record<import("./shadows.js").ShadowName, import("./shadows.js").ShadowLayer[]>;
    };
    readonly motion: {
        readonly duration: {
            readonly instant: 75;
            readonly fast: 150;
            readonly base: 200;
            readonly slow: 320;
            readonly ambient: 600;
        };
        readonly easing: {
            readonly control: "ease";
            readonly surface: "ease-out";
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
        readonly enterOffset: 8;
        readonly reducedMotion: {
            readonly respect: true;
            readonly duration: 0;
        };
    };
};
export type DesignTokens = typeof tokens;
