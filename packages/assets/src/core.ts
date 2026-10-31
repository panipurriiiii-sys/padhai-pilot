import { palette, type PaletteOverride, type PaletteToken } from './palette';

/** Resolve an authored colour (`none` | `currentColor` | `@token`) to a concrete CSS/RN colour. */
export function resolveColor(value: string, mode: 'css' | 'native', override?: PaletteOverride): string {
  if (!value.startsWith('@')) return value;
  const token = value.slice(1) as PaletteToken;
  const entry = palette[token];
  if (!entry) return value;
  const hex = override?.[token] ?? entry.light;
  if (mode === 'native') return hex;
  const name = `--pp-${token.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
  return `var(${name}, ${hex})`;
}

const COLOR_PROPS = new Set(['fill', 'stroke']);

/** Presentation attributes of a node with colours resolved. */
export function resolveAttrs(
  attrs: Record<string, string>,
  mode: 'css' | 'native',
  override?: PaletteOverride,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(attrs)) out[k] = COLOR_PROPS.has(k) ? resolveColor(v, mode, override) : v;
  return out;
}

/** Draw duration shared by both adapters so web and native timelines match. */
export const DRAW_MS = 620;
