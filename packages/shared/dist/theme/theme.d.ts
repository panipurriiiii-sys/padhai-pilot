import { type ColorPalette, type ColorScheme } from './colors.js';
import { type DefaultScheme, type InstituteBranding, type PlatformThemeConfig } from './config.js';
import type { ApprovedFontFamily, FontRole } from './typography.js';
import { type ShadowLayer, type ShadowName } from './shadows.js';
export interface ResolvedTheme {
    palettes: Record<ColorScheme, ColorPalette>;
    shadows: Record<ColorScheme, Record<ShadowName, ShadowLayer[]>>;
    typography: Record<FontRole, ApprovedFontFamily>;
    appearance: PlatformThemeConfig['appearance'];
    /** Institute logo (if the institute is entitled and set one) */
    logoUrl: string | null;
}
/** Build the effective palettes/typography for a platform config, optionally layered with institute branding. */
export declare function resolveTheme(config?: PlatformThemeConfig, institute?: InstituteBranding | null): ResolvedTheme;
/** Which scheme to start in, given a platform default, an optional user choice and the OS preference. */
export declare function pickScheme(platformDefault: DefaultScheme, userChoice: ColorScheme | null | undefined, system: ColorScheme | null | undefined, allowUserToggle?: boolean): ColorScheme;
