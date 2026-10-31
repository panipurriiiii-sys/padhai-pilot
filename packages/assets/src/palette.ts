/**
 * Illustration palette: the ONLY colours canonical SVG sources may use.
 *
 * Every `light` value is copied from the Teacher Portal tokens
 * (apps/teacher/src/app/globals.css) - a test verifies each hex still exists
 * there, so the SVG library cannot drift away from the master identity.
 *
 * SVG sources are authored with these literal hex values (so a file previews
 * correctly anywhere). The build step converts each hex into a token reference
 * (`@brand`) in the generated registry. Adapters then resolve it:
 *   web    -> var(--pp-brand, #1677FF)   (themeable, dark-mode aware)
 *   native -> palette hex (or a palette override passed by the app)
 */
export interface PaletteEntry {
  /** Colour in the light paper-desk theme (hex, uppercase). */
  light: string;
  /** Teacher Portal CSS variable this maps to (web). */
  cssVar: string;
  /** Optional dark-theme fallback (Teacher Portal `.dark` palette). */
  dark?: string;
}

export const palette = {
  ink: { light: '#1C1917', cssVar: '--ink-primary', dark: '#F5F7FA' },
  inkSoft: { light: '#78716C', cssVar: '--ink-muted', dark: '#929BAA' },
  inkFaint: { light: '#A8A29E', cssVar: '--ink-faint', dark: '#55595F' },
  line: { light: '#E3DFD9', cssVar: '--border-paper', dark: '#2A313D' },
  paper: { light: '#FFFFFF', cssVar: '--bg-paper', dark: '#0A0D12' },
  paperWarm: { light: '#FAF8F5', cssVar: '--bg-paper-warm', dark: '#10151D' },
  desk: { light: '#F3EFE9', cssVar: '--bg-surface-subtle', dark: '#141A24' },
  brand: { light: '#1677FF', cssVar: '--brand-electric', dark: '#1677FF' },
  brandSoft: { light: '#E1EDFF', cssVar: '--sticky-blue' },
  brandLine: { light: '#BBD4FC', cssVar: '--sticky-blue-border' },
  brandDeep: { light: '#0A3D78', cssVar: '--sticky-blue-text' },
  yellow: { light: '#FFF3C4', cssVar: '--sticky-yellow' },
  yellowDeep: { light: '#F6E09E', cssVar: '--sticky-yellow-border' },
  pink: { light: '#FDE2E4', cssVar: '--sticky-pink' },
  pinkDeep: { light: '#F8BCC2', cssVar: '--sticky-pink-border' },
  mint: { light: '#DAF5E4', cssVar: '--sticky-mint' },
  mintDeep: { light: '#B2E6C4', cssVar: '--sticky-mint-border' },
  beige: { light: '#F2E8DC', cssVar: '--sticky-beige' },
  beigeDeep: { light: '#DECDBD', cssVar: '--sticky-beige-border' },
  success: { light: '#10B981', cssVar: '--pp-success' },
  danger: { light: '#F43F5E', cssVar: '--pp-danger' },
  warning: { light: '#F59E0B', cssVar: '--pp-warning' },
} as const satisfies Record<string, PaletteEntry>;

export type PaletteToken = keyof typeof palette;

export type PaletteOverride = Partial<Record<PaletteToken, string>>;

/** Resolve a token to a concrete colour for non-CSS renderers (React Native). */
export function resolveToken(token: PaletteToken, override?: PaletteOverride): string {
  return override?.[token] ?? palette[token].light;
}

/** CSS custom-property name used by the web adapter for a token. */
export function cssVarName(token: PaletteToken): string {
  return `--pp-${token.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
}
