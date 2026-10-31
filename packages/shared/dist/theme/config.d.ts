import { type ApprovedFontFamily, type FontRole } from './typography.js';
export declare const THEME_CONFIG_SCHEMA_VERSION: 1;
export type DefaultScheme = 'light' | 'dark' | 'system';
export declare const DEFAULT_SCHEMES: readonly DefaultScheme[];
/** The semantic colour roles a Super Admin may override, per scheme. */
export declare const SCHEME_OVERRIDE_KEYS: readonly ["desk", "paper", "paperWarm", "surfaceSubtle", "secondary", "borderPaper", "borderInput", "inkPrimary", "inkSecondary", "inkMuted"];
export type SchemeOverrideKey = (typeof SCHEME_OVERRIDE_KEYS)[number];
export type SchemeOverrides = Partial<Record<SchemeOverrideKey, string>>;
export interface PlatformThemeConfig {
    schemaVersion: typeof THEME_CONFIG_SCHEMA_VERSION;
    appearance: {
        defaultScheme: DefaultScheme;
        /** Whether end users may flip light/dark themselves. */
        allowUserSchemeToggle: boolean;
        /** Show the grid / glow "desk" texture behind pages. */
        deskTexture: boolean;
    };
    brand: {
        /** Global primary / "electric" colour */
        primary: string;
        /** Optional explicit hover colour; derived from `primary` when omitted */
        primaryHover?: string;
        /** Optional accent (cyan micro-highlight) */
        accent?: string;
    };
    light: SchemeOverrides;
    dark: SchemeOverrides;
    /** Which approved family serves each typographic role */
    typography: Record<FontRole, ApprovedFontFamily>;
}
export declare const DEFAULT_THEME_CONFIG: PlatformThemeConfig;
/** A published, immutable revision of the platform theme as served by `GET /api/theme`. */
export interface PublishedTheme {
    /** Monotonic revision number; 0 = built-in default (no row published yet) */
    revision: number;
    /** Opaque id used as ETag / cache key, e.g. `r12-3fa91c2b` */
    revisionId: string;
    checksum: string;
    publishedAt: string | null;
    config: PlatformThemeConfig;
}
export declare const BUILT_IN_REVISION_ID = "r0-default";
export declare const BUILT_IN_PUBLISHED_THEME: PublishedTheme;
export interface ContrastCheck {
    scheme: 'light' | 'dark' | 'brand';
    label: string;
    foreground: string;
    background: string;
    ratio: number;
    required: number;
    level: 'error' | 'warning';
    passed: boolean;
}
export interface ThemeValidationResult {
    ok: boolean;
    errors: string[];
    warnings: string[];
    contrast: ContrastCheck[];
    /** Normalised, safe-to-store configuration (only present when `ok`) */
    config?: PlatformThemeConfig;
}
/**
 * Validate an untrusted theme document. Never throws. Returns a normalised config only when every rule passes.
 * Rules: strict keys, hex colours only, approved font families only, WCAG contrast floors, schemes keep their meaning.
 */
export declare function validateThemeConfig(input: unknown): ThemeValidationResult;
/**
 * What an institute may customise: its logo and one approved accent colour. Typography, spacing, component behaviour
 * and accessibility rules always come from the platform theme.
 */
export interface InstituteBranding {
    logoUrl?: string | null;
    accentColor?: string | null;
}
export interface InstituteBrandingValidation {
    ok: boolean;
    errors: string[];
    contrast: ContrastCheck[];
    branding?: {
        logoUrl: string | null;
        accentColor: string | null;
    };
}
export declare function validateInstituteBranding(input: unknown, basePalette?: {
    lightPaper: string;
    darkPaper: string;
}): InstituteBrandingValidation;
