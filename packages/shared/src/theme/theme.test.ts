import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  DEFAULT_THEME_CONFIG,
  APPROVED_FONT_FAMILIES,
  FONT_FAMILIES,
  resolveTheme,
  schemeVariables,
  fontVariables,
  staticVariables,
  diffVariables,
  validateThemeConfig,
  validateInstituteBranding,
  contrastRatio,
  lightPalette,
  darkPalette,
  toNativeTheme,
  toNativeColors,
  resolveMotion,
  staggerDelay,
  motion,
  renderRuntimeOverrides,
  pickScheme,
  shadowToCss,
  lightShadows,
  type PlatformThemeConfig,
} from './index.js';

const here = dirname(fileURLToPath(import.meta.url));
const reference = readFileSync(join(here, '__fixtures__', 'teacher-reference.css'), 'utf8');

/** Parse `--name: value;` pairs of the first rule whose selector starts with `selector`. */
function parseBlock(selector: string): Record<string, string> {
  const start = reference.indexOf(`${selector} {`);
  expect(start, `selector ${selector} in reference`).toBeGreaterThanOrEqual(0);
  const open = reference.indexOf('{', start);
  const body = reference.slice(open + 1, reference.indexOf('\n}', open));
  const out: Record<string, string> = {};
  for (const m of body.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

const resolvedDefault = resolveTheme(DEFAULT_THEME_CONFIG);
const light = { ...fontVariables(resolvedDefault.typography), ...staticVariables(), ...schemeVariables(resolvedDefault, 'light') };
const dark = { ...light, ...diffVariables(light, schemeVariables(resolvedDefault, 'dark')) };

describe('Teacher Portal extraction is exact', () => {
  const refLight = parseBlock(':root');
  const refDark = parseBlock('.dark, .admin-dark');

  it('reference fixture contains the expected token count', () => {
    expect(Object.keys(refLight).length).toBeGreaterThan(40);
    expect(Object.keys(refDark).length).toBeGreaterThan(15);
  });

  it.each(Object.entries(refLight))('light %s matches the Teacher stylesheet', (name, value) => {
    expect(light[name], name).toBe(value);
  });

  it.each(Object.entries(refDark))('dark %s matches the Teacher stylesheet', (name, value) => {
    expect(dark[name], name).toBe(value);
  });
});

describe('typography: exactly three families', () => {
  it('approved list is Playfair Display, Raleway, Inter', () => {
    expect([...APPROVED_FONT_FAMILIES].sort()).toEqual(['Inter', 'Playfair Display', 'Raleway']);
    expect(Object.values(FONT_FAMILIES).sort()).toEqual(['Inter', 'Playfair Display', 'Raleway']);
  });
  it('rejects any other family in a theme config', () => {
    const bad = { ...DEFAULT_THEME_CONFIG, typography: { ...DEFAULT_THEME_CONFIG.typography, data: 'Geist' } };
    const r = validateThemeConfig(bad);
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/approved families/);
  });
});

describe('default theme config', () => {
  it('validates and resolves to exactly the built-in palettes', () => {
    const r = validateThemeConfig(DEFAULT_THEME_CONFIG);
    expect(r.ok, r.errors.join('; ')).toBe(true);
    expect(resolvedDefault.palettes.light).toEqual(lightPalette);
    expect(resolvedDefault.palettes.dark).toEqual(darkPalette);
    expect(renderRuntimeOverrides(resolvedDefault, resolvedDefault)).toBe('');
  });

  it('defaults to the light paper-desk for everybody', () => {
    expect(DEFAULT_THEME_CONFIG.appearance.defaultScheme).toBe('light');
    expect(pickScheme('light', null, 'dark')).toBe('light');
    expect(pickScheme('light', 'dark', 'light')).toBe('dark');
    expect(pickScheme('light', 'dark', 'light', false)).toBe('light');
    expect(pickScheme('system', null, 'dark')).toBe('dark');
  });
});

describe('theme config validation', () => {
  const cfg = (patch: Partial<PlatformThemeConfig> & Record<string, unknown>): unknown => ({ ...DEFAULT_THEME_CONFIG, ...patch });

  it('accepts a legitimate brand change and normalises hex', () => {
    const r = validateThemeConfig(cfg({ brand: { primary: '#0a5bd6' } }));
    expect(r.ok, r.errors.join('; ')).toBe(true);
    expect(r.config?.brand.primary).toBe('#0A5BD6');
  });
  it('rejects non-hex colours (no CSS injection)', () => {
    for (const v of ['red', 'url(javascript:alert(1))', '#12', '#GGGGGG', 'rgb(0,0,0)', '#1677FF; background:red', 42]) {
      expect(validateThemeConfig(cfg({ brand: { primary: v } })).ok, String(v)).toBe(false);
    }
  });
  it('rejects unknown keys and wrong schema version', () => {
    expect(validateThemeConfig(cfg({ evil: true })).ok).toBe(false);
    expect(validateThemeConfig(cfg({ schemaVersion: 2 })).ok).toBe(false);
    expect(validateThemeConfig(cfg({ light: { inkPrimary: '#000000', apiKey: '#000000' } })).ok).toBe(false);
    expect(validateThemeConfig('nope').ok).toBe(false);
    expect(validateThemeConfig(null).ok).toBe(false);
  });
  it('rejects low-contrast text and brand colours', () => {
    const lowInk = validateThemeConfig(cfg({ light: { inkPrimary: '#EEEEEE' } }));
    expect(lowInk.ok).toBe(false);
    const paleBrand = validateThemeConfig(cfg({ brand: { primary: '#FFEE99' } }));
    expect(paleBrand.ok).toBe(false);
    expect(paleBrand.errors.join(' ')).toMatch(/contrast/);
  });
  it('keeps light light and dark dark', () => {
    expect(validateThemeConfig(cfg({ light: { paper: '#111111', desk: '#111111', paperWarm: '#111111', inkPrimary: '#FFFFFF', inkSecondary: '#FFFFFF', inkMuted: '#FFFFFF' } })).ok).toBe(false);
  });
  it('rejects bad appearance enums', () => {
    expect(validateThemeConfig(cfg({ appearance: { defaultScheme: 'neon', allowUserSchemeToggle: true, deskTexture: true } })).ok).toBe(false);
  });
});

describe('institute branding', () => {
  it('accepts a contrasting accent and an https logo', () => {
    const r = validateInstituteBranding({ accentColor: '#0B6E4F', logoUrl: 'https://cdn.example.com/logo.png' });
    expect(r.ok, r.errors.join('; ')).toBe(true);
    expect(r.branding?.accentColor).toBe('#0B6E4F');
  });
  it('rejects low contrast accents, javascript: and http logos, extra keys', () => {
    expect(validateInstituteBranding({ accentColor: '#FFFF00' }).ok).toBe(false);
    expect(validateInstituteBranding({ accentColor: '#000001' }).ok).toBe(false);
    expect(validateInstituteBranding({ logoUrl: 'javascript:alert(1)' }).ok).toBe(false);
    expect(validateInstituteBranding({ logoUrl: 'http://x.example/logo.png' }).ok).toBe(false);
    expect(validateInstituteBranding({ fontFamily: 'Comic Sans' }).ok).toBe(false);
  });
  it('only changes brand tokens, never typography or surfaces', () => {
    const themed = resolveTheme(DEFAULT_THEME_CONFIG, { accentColor: '#0B6E4F', logoUrl: 'https://cdn.example.com/l.png' });
    expect(themed.palettes.light.brand.electric).toBe('#0B6E4F');
    expect({ ...themed.palettes.light.bg, selected: '' }).toEqual({ ...lightPalette.bg, selected: '' }); // selected is a brand tint
    expect(themed.palettes.light.ink).toEqual(lightPalette.ink);
    expect(themed.typography).toEqual(resolvedDefault.typography);
    expect(themed.logoUrl).toBe('https://cdn.example.com/l.png');
    expect(themed.shadows.light.button[0].color.slice(0, 3)).toEqual([11, 110, 79]);
  });
});

describe('native output equals web tokens', () => {
  const native = toNativeTheme(resolvedDefault, 'light', 'android');
  it('colours map straight from the shared palette', () => {
    expect(native.colors.background).toBe(light['--bg-desk']);
    expect(native.colors.surface).toBe(light['--bg-paper']);
    expect(native.colors.textPrimary).toBe(light['--ink-primary']);
    expect(native.colors.primary).toBe(light['--brand-electric']);
    expect(native.colors.border).toBe(light['--border-paper']);
    expect(native.colors.successSubtle).toBe(light['--status-success-bg']);
    expect(toNativeColors(darkPalette).background).toBe(dark['--bg-desk']);
  });
  it('fonts are only the three families (android file names)', () => {
    expect(Object.values(native.typography.fonts).sort()).toEqual(['Inter', 'PlayfairDisplay', 'Raleway', 'Raleway']);
    expect(toNativeTheme(resolvedDefault, 'light', 'ios').typography.fonts.display).toBe('Playfair Display');
  });
  it('shadows convert to one RN shadow with the same colour/opacity as the dominant web layer', () => {
    expect(native.shadows.paper.shadowOpacity).toBe(0.1);
    expect(native.shadows.paper.shadowOffset.height).toBe(6);
  });
  it('web shadow strings serialise like the Teacher stylesheet', () => {
    expect(shadowToCss(lightShadows.paper)).toBe('0 1px 2px rgba(60, 52, 40, 0.06), 0 6px 16px -4px rgba(60, 52, 40, 0.1)');
  });
});

describe('chart tokens', () => {
  for (const scheme of ['light', 'dark'] as const) {
    const p = scheme === 'light' ? lightPalette : darkPalette;
    it(`${scheme}: eight distinct categorical series, each >= 3:1 against paper`, () => {
      expect(new Set(p.charts.categorical).size).toBe(8);
      for (const c of p.charts.categorical) {
        expect(contrastRatio(c, p.bg.paper), `${scheme} ${c}`).toBeGreaterThanOrEqual(3);
      }
    });
    it(`${scheme}: sequential/diverging have five steps and attendance matches the stamps`, () => {
      expect(p.charts.sequential).toHaveLength(5);
      expect(p.charts.diverging).toHaveLength(5);
      expect(p.charts.attendance).toEqual({ present: '#10B981', absent: '#F43F5E', late: '#F59E0B', excused: '#3B82F6' });
      expect(p.charts.attendance.present).toBe(p.status.success.solid);
      expect(p.charts.attendance.absent).toBe(p.status.danger.solid);
      expect(p.charts.attendance.late).toBe(p.status.warning.solid);
      expect(p.charts.attendance.excused).toBe(p.status.info.solid);
    });
    it(`${scheme}: status labels are readable on their tints (>= 4.5:1) and axis labels on paper (>= 3:1)`, () => {
      for (const k of ['success', 'warning', 'danger', 'info'] as const) {
        expect(contrastRatio(p.status[k].text, p.status[k].bg), `${scheme} ${k}`).toBeGreaterThanOrEqual(4.5);
      }
      expect(contrastRatio(p.charts.axisLabel, p.bg.paper)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(p.charts.tooltipText, p.charts.tooltipBg)).toBeGreaterThanOrEqual(4.5);
    });
  }
  it('exposes every chart token as a CSS variable', () => {
    for (const k of ['--chart-1', '--chart-8', '--chart-seq-5', '--chart-div-3', '--chart-present', '--chart-grid', '--chart-tooltip-bg']) {
      expect(light[k], k).toBeTruthy();
      expect(dark[k], k).toBeTruthy();
    }
  });
});

describe('motion tokens', () => {
  it('define durations, easings, springs, stagger and a reduced-motion flag in one place', () => {
    expect(motion.duration.fast).toBe(150);
    expect(motion.duration.base).toBe(200);
    expect(motion.spring.snappy.stiffness).toBeGreaterThan(motion.spring.gentle.stiffness);
    expect(motion.reducedMotion.respect).toBe(true);
    expect(light['--duration-slow']).toBe('320ms');
    expect(light['--ease-emphasized']).toBe('cubic-bezier(0.16, 1, 0.3, 1)');
  });
  it('stagger is capped and reduced motion collapses everything', () => {
    expect(staggerDelay(0)).toBe(0);
    expect(staggerDelay(100)).toBe(motion.stagger.maxItems * motion.stagger.step);
    const r = resolveMotion(true);
    expect(r.reduced).toBe(true);
    expect(r.duration.slow).toBe(0);
    expect(r.staggerStep).toBe(0);
    expect(resolveMotion(false).duration.base).toBe(200);
  });
});
