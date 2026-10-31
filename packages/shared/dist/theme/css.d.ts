/**
 * CSS custom-property output for web. The variable NAMES are the Teacher Portal's (`--bg-desk`, `--ink-primary`, ...)
 * so every existing class keeps working; new names follow the same `--group-name` convention.
 */
import type { ColorPalette, ColorScheme } from './colors.js';
import type { ResolvedTheme } from './theme.js';
export type CssVars = Record<string, string>;
/** Colour variables for one palette, in Teacher Portal order. */
export declare function colorVariables(p: ColorPalette): CssVars;
/** Variables that do not change between schemes. */
export declare function staticVariables(): CssVars;
export declare function fontVariables(typography: ResolvedTheme['typography']): CssVars;
export declare function shadowVariables(shadows: ResolvedTheme['shadows'][ColorScheme]): CssVars;
/** Complete variable set for a scheme of a resolved theme. */
export declare function schemeVariables(theme: ResolvedTheme, scheme: ColorScheme): CssVars;
/** Only the entries of `next` that differ from `base` (used so runtime overrides stay tiny). */
export declare function diffVariables(base: CssVars, next: CssVars): CssVars;
export declare function renderBlock(selector: string, vars: CssVars, indent?: string): string;
export declare const DARK_SELECTOR = ".dark, .admin-dark, [data-theme='dark']";
export declare const LIGHT_SELECTOR = ":root, [data-theme='light']";
/**
 * Runtime override stylesheet: only what differs from the built-in defaults. Injected by the web theme loader into
 * `<style id="pp-theme">`, so it sits after the shipped CSS and wins by order.
 */
export declare function renderRuntimeOverrides(theme: ResolvedTheme, defaults: ResolvedTheme): string;
/** [tailwind colour name, css variable] */
export declare const TAILWIND_COLORS: ReadonlyArray<readonly [string, string]>;
export declare function renderTailwindTheme(): string;
