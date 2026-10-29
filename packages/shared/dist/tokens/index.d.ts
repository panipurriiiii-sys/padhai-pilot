/**
 * PadhaiPilot Design System Tokens
 * Authoritative source of design tokens for Web and React Native.
 * Color palette extracted from portfolio reference:
 * Background: #050608 | Surface: #0A0D12 | Primary: #1677FF | Text: #F5F7FA | Muted: #929BAA
 */
export declare const typography: {
    readonly fonts: {
        /** Editorial, hero moments, dashboard welcome headings */
        readonly display: "var(--font-display, \"Playfair Display\", Georgia, serif)";
        /** Primary UI font: navigation, body, buttons, forms, labels */
        readonly primary: "var(--font-primary, \"Raleway\", -apple-system, BlinkMacSystemFont, sans-serif)";
        /** Compact data, numbers, KPIs, timestamps, tables */
        readonly data: "var(--font-data, \"Inter\", -apple-system, BlinkMacSystemFont, sans-serif)";
    };
    readonly weights: {
        readonly regular: "400";
        readonly medium: "500";
        readonly semibold: "600";
        readonly bold: "700";
    };
    readonly sizes: {
        readonly xs: "0.75rem";
        readonly sm: "0.875rem";
        readonly base: "1rem";
        readonly lg: "1.125rem";
        readonly xl: "1.25rem";
        readonly '2xl': "1.5rem";
        readonly '3xl': "1.875rem";
        readonly '4xl': "2.25rem";
        readonly '5xl': "3rem";
    };
    readonly lineHeights: {
        readonly none: "1";
        readonly tight: "1.25";
        readonly snug: "1.375";
        readonly normal: "1.5";
        readonly relaxed: "1.625";
        readonly loose: "2";
    };
};
export declare const darkPalette: {
    readonly background: "#050608";
    readonly surface: "#0A0D12";
    readonly surfaceElevated: "#10151D";
    readonly surfaceHover: "#141A24";
    readonly border: "rgba(255, 255, 255, 0.09)";
    readonly borderStrong: "rgba(255, 255, 255, 0.16)";
    readonly textPrimary: "#F5F7FA";
    readonly textSecondary: "#C3CAD6";
    readonly textMuted: "#929BAA";
    readonly textDisabled: "#55595F";
    readonly primary: "#1677FF";
    readonly primaryHover: "#3395FF";
    readonly primaryActive: "#0A6FE8";
    readonly primarySubtle: "rgba(22, 119, 255, 0.12)";
    readonly primaryBorder: "rgba(22, 119, 255, 0.28)";
    readonly accent: "#1677FF";
    readonly success: "#10B981";
    readonly successSubtle: "rgba(16, 185, 129, 0.12)";
    readonly warning: "#F59E0B";
    readonly warningSubtle: "rgba(245, 158, 11, 0.12)";
    readonly error: "#F43F5E";
    readonly errorSubtle: "rgba(244, 63, 94, 0.12)";
    readonly info: "#00B7D7";
    readonly infoSubtle: "rgba(0, 183, 215, 0.12)";
};
export declare const lightPalette: {
    readonly background: "#F8FAFC";
    readonly surface: "#FFFFFF";
    readonly surfaceElevated: "#F1F5F9";
    readonly surfaceHover: "#E2E8F0";
    readonly border: "rgba(0, 0, 0, 0.08)";
    readonly borderStrong: "rgba(0, 0, 0, 0.15)";
    readonly textPrimary: "#0A0D12";
    readonly textSecondary: "#334155";
    readonly textMuted: "#64748B";
    readonly textDisabled: "#94A3B8";
    readonly primary: "#1677FF";
    readonly primaryHover: "#0A6FE8";
    readonly primaryActive: "#0A4FBF";
    readonly primarySubtle: "rgba(22, 119, 255, 0.08)";
    readonly primaryBorder: "rgba(22, 119, 255, 0.22)";
    readonly accent: "#1677FF";
    readonly success: "#059669";
    readonly successSubtle: "rgba(5, 150, 105, 0.08)";
    readonly warning: "#D97706";
    readonly warningSubtle: "rgba(217, 119, 6, 0.08)";
    readonly error: "#E11D48";
    readonly errorSubtle: "rgba(225, 29, 72, 0.08)";
    readonly info: "#0284C7";
    readonly infoSubtle: "rgba(2, 132, 199, 0.08)";
};
export declare const spacing: {
    readonly 0: "0px";
    readonly 1: "0.25rem";
    readonly 2: "0.5rem";
    readonly 3: "0.75rem";
    readonly 4: "1rem";
    readonly 5: "1.25rem";
    readonly 6: "1.5rem";
    readonly 8: "2rem";
    readonly 10: "2.5rem";
    readonly 12: "3rem";
    readonly 16: "4rem";
};
export declare const radii: {
    readonly none: "0px";
    readonly sm: "4px";
    readonly md: "8px";
    readonly lg: "12px";
    readonly xl: "16px";
    readonly full: "9999px";
};
export declare const shadows: {
    readonly none: "none";
    readonly sm: "0 1px 2px 0 rgba(0, 0, 0, 0.35)";
    readonly md: "0 4px 12px -2px rgba(0, 0, 0, 0.45)";
    readonly lg: "0 10px 25px -3px rgba(0, 0, 0, 0.55)";
    readonly glow: "0 0 20px rgba(22, 119, 255, 0.25)";
};
export declare const motion: {
    readonly durations: {
        readonly instant: "75ms";
        readonly fast: "150ms";
        readonly normal: "250ms";
        readonly slow: "400ms";
    };
    readonly easings: {
        readonly default: "cubic-bezier(0.16, 1, 0.3, 1)";
        readonly linear: "linear";
        readonly easeIn: "cubic-bezier(0.4, 0, 1, 1)";
        readonly easeOut: "cubic-bezier(0, 0, 0.2, 1)";
    };
};
export declare const tokens: {
    readonly typography: {
        readonly fonts: {
            /** Editorial, hero moments, dashboard welcome headings */
            readonly display: "var(--font-display, \"Playfair Display\", Georgia, serif)";
            /** Primary UI font: navigation, body, buttons, forms, labels */
            readonly primary: "var(--font-primary, \"Raleway\", -apple-system, BlinkMacSystemFont, sans-serif)";
            /** Compact data, numbers, KPIs, timestamps, tables */
            readonly data: "var(--font-data, \"Inter\", -apple-system, BlinkMacSystemFont, sans-serif)";
        };
        readonly weights: {
            readonly regular: "400";
            readonly medium: "500";
            readonly semibold: "600";
            readonly bold: "700";
        };
        readonly sizes: {
            readonly xs: "0.75rem";
            readonly sm: "0.875rem";
            readonly base: "1rem";
            readonly lg: "1.125rem";
            readonly xl: "1.25rem";
            readonly '2xl': "1.5rem";
            readonly '3xl': "1.875rem";
            readonly '4xl': "2.25rem";
            readonly '5xl': "3rem";
        };
        readonly lineHeights: {
            readonly none: "1";
            readonly tight: "1.25";
            readonly snug: "1.375";
            readonly normal: "1.5";
            readonly relaxed: "1.625";
            readonly loose: "2";
        };
    };
    readonly dark: {
        readonly background: "#050608";
        readonly surface: "#0A0D12";
        readonly surfaceElevated: "#10151D";
        readonly surfaceHover: "#141A24";
        readonly border: "rgba(255, 255, 255, 0.09)";
        readonly borderStrong: "rgba(255, 255, 255, 0.16)";
        readonly textPrimary: "#F5F7FA";
        readonly textSecondary: "#C3CAD6";
        readonly textMuted: "#929BAA";
        readonly textDisabled: "#55595F";
        readonly primary: "#1677FF";
        readonly primaryHover: "#3395FF";
        readonly primaryActive: "#0A6FE8";
        readonly primarySubtle: "rgba(22, 119, 255, 0.12)";
        readonly primaryBorder: "rgba(22, 119, 255, 0.28)";
        readonly accent: "#1677FF";
        readonly success: "#10B981";
        readonly successSubtle: "rgba(16, 185, 129, 0.12)";
        readonly warning: "#F59E0B";
        readonly warningSubtle: "rgba(245, 158, 11, 0.12)";
        readonly error: "#F43F5E";
        readonly errorSubtle: "rgba(244, 63, 94, 0.12)";
        readonly info: "#00B7D7";
        readonly infoSubtle: "rgba(0, 183, 215, 0.12)";
    };
    readonly light: {
        readonly background: "#F8FAFC";
        readonly surface: "#FFFFFF";
        readonly surfaceElevated: "#F1F5F9";
        readonly surfaceHover: "#E2E8F0";
        readonly border: "rgba(0, 0, 0, 0.08)";
        readonly borderStrong: "rgba(0, 0, 0, 0.15)";
        readonly textPrimary: "#0A0D12";
        readonly textSecondary: "#334155";
        readonly textMuted: "#64748B";
        readonly textDisabled: "#94A3B8";
        readonly primary: "#1677FF";
        readonly primaryHover: "#0A6FE8";
        readonly primaryActive: "#0A4FBF";
        readonly primarySubtle: "rgba(22, 119, 255, 0.08)";
        readonly primaryBorder: "rgba(22, 119, 255, 0.22)";
        readonly accent: "#1677FF";
        readonly success: "#059669";
        readonly successSubtle: "rgba(5, 150, 105, 0.08)";
        readonly warning: "#D97706";
        readonly warningSubtle: "rgba(217, 119, 6, 0.08)";
        readonly error: "#E11D48";
        readonly errorSubtle: "rgba(225, 29, 72, 0.08)";
        readonly info: "#0284C7";
        readonly infoSubtle: "rgba(2, 132, 199, 0.08)";
    };
    readonly spacing: {
        readonly 0: "0px";
        readonly 1: "0.25rem";
        readonly 2: "0.5rem";
        readonly 3: "0.75rem";
        readonly 4: "1rem";
        readonly 5: "1.25rem";
        readonly 6: "1.5rem";
        readonly 8: "2rem";
        readonly 10: "2.5rem";
        readonly 12: "3rem";
        readonly 16: "4rem";
    };
    readonly radii: {
        readonly none: "0px";
        readonly sm: "4px";
        readonly md: "8px";
        readonly lg: "12px";
        readonly xl: "16px";
        readonly full: "9999px";
    };
    readonly shadows: {
        readonly none: "none";
        readonly sm: "0 1px 2px 0 rgba(0, 0, 0, 0.35)";
        readonly md: "0 4px 12px -2px rgba(0, 0, 0, 0.45)";
        readonly lg: "0 10px 25px -3px rgba(0, 0, 0, 0.55)";
        readonly glow: "0 0 20px rgba(22, 119, 255, 0.25)";
    };
    readonly motion: {
        readonly durations: {
            readonly instant: "75ms";
            readonly fast: "150ms";
            readonly normal: "250ms";
            readonly slow: "400ms";
        };
        readonly easings: {
            readonly default: "cubic-bezier(0.16, 1, 0.3, 1)";
            readonly linear: "linear";
            readonly easeIn: "cubic-bezier(0.4, 0, 1, 1)";
            readonly easeOut: "cubic-bezier(0, 0, 0.2, 1)";
        };
    };
};
export type ThemeTokens = typeof tokens;
