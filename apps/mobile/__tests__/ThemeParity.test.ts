// Node built-ins are declared locally so the app's React Native typings stay free of Node globals.
declare const require: (id: string) => any;
declare const __dirname: string;
import { lightColors, darkColors, typography } from '../src/theme/tokens';

const fs = require('fs');
const path = require('path');

/**
 * Guards the "one identity across web and mobile" rule: mobile tokens must equal the authoritative shared tokens
 * (packages/shared/src/theme, generated to dist/theme/tokens.json), which are themselves tested against the Teacher
 * Portal stylesheet. TODO(design-system): replace src/theme/tokens.ts with the shared toNativeTheme() output.
 */
const shared = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../packages/shared/dist/theme/tokens.json'), 'utf8'));
const rootBlock: Record<string, string> = shared.cssVariables.light;
const darkBlock: Record<string, string> = { ...shared.cssVariables.light, ...shared.cssVariables.dark };
const hex = (blockObj: Record<string, string>, name: string): string | undefined => {
  const v = blockObj['--' + name];
  return /^#[0-9A-Fa-f]{6}$/.test(v || '') ? v.toUpperCase() : undefined;
};

const MAP: Array<[string, keyof typeof lightColors]> = [
  ['bg-desk', 'background'],
  ['bg-paper', 'surface'],
  ['bg-paper-warm', 'surfaceSubtle'],
  ['bg-surface-subtle', 'surfaceElevated'],
  ['border-paper', 'border'],
  ['border-input', 'borderStrong'],
  ['ink-primary', 'textPrimary'],
  ['ink-secondary', 'textSecondary'],
  ['ink-muted', 'textMuted'],
  ['ink-faint', 'textFaint'],
  ['brand-electric', 'primary'],
  ['brand-hover', 'primaryHover'],
  ['sticky-yellow', 'stickyYellowBg'],
  ['sticky-yellow-border', 'stickyYellowBorder'],
  ['sticky-yellow-text', 'stickyYellowText'],
  ['sticky-pink', 'stickyPinkBg'],
  ['sticky-pink-border', 'stickyPinkBorder'],
  ['sticky-pink-text', 'stickyPinkText'],
  ['sticky-mint', 'stickyMintBg'],
  ['sticky-mint-border', 'stickyMintBorder'],
  ['sticky-mint-text', 'stickyMintText'],
  ['sticky-blue', 'stickyBlueBg'],
  ['sticky-blue-border', 'stickyBlueBorder'],
  ['sticky-blue-text', 'stickyBlueText'],
];

describe('mobile theme matches the web portals', () => {
  it.each(MAP)('light --%s equals mobile %s', (cssName, key) => {
    const web = hex(rootBlock, cssName);
    expect(web).toBeDefined();
    expect(String(lightColors[key]).toUpperCase()).toBe(web);
  });

  const DARK_MAP = MAP.filter(([name]) =>
    ['bg-desk', 'bg-paper', 'bg-paper-warm', 'bg-surface-subtle', 'ink-primary', 'ink-secondary', 'ink-muted', 'ink-faint'].includes(name),
  );
  it.each(DARK_MAP)('dark --%s equals mobile %s', (cssName, key) => {
    const web = hex(darkBlock, cssName);
    expect(web).toBeDefined();
    expect(String(darkColors[key]).toUpperCase()).toBe(web);
  });

  it('uses only the three permitted font families, with bundled font files', () => {
    expect(typography.fonts.ui).toBe('Raleway');
    expect(typography.fonts.data).toBe('Inter');
    expect(String(typography.fonts.display).replace(/\s/g, '')).toBe('PlayfairDisplay');
    for (const f of ['Raleway', 'Inter', 'PlayfairDisplay']) {
      for (const suffix of ['', '_bold']) {
        expect(fs.existsSync(path.join(__dirname, `../android/app/src/main/assets/fonts/${f}${suffix}.ttf`))).toBe(true);
      }
    }
  });
});
