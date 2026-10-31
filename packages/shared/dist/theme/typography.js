/**
 * Typography tokens. PadhaiPilot uses EXACTLY three font families everywhere (web and native). A fourth family is a
 * build-time failure (see scripts/check-design-consistency.mjs).
 *
 *  - Playfair Display : premium titles / selected display headings
 *  - Raleway          : primary UI — navigation, labels, headings, body
 *  - Inter            : tables, analytics, numbers, marks, dense data
 */
export const FONT_FAMILIES = {
    display: 'Playfair Display',
    primary: 'Raleway',
    data: 'Inter',
};
/** The only family names a theme configuration may reference. */
export const APPROVED_FONT_FAMILIES = ['Playfair Display', 'Raleway', 'Inter'];
export const isApprovedFontFamily = (value) => typeof value === 'string' && APPROVED_FONT_FAMILIES.includes(value);
const GENERIC_SERIF = 'Georgia, serif';
const GENERIC_SANS = '-apple-system, BlinkMacSystemFont, sans-serif';
/** Generic fallback appended after the chosen family (web). */
export const fontStackFor = (family) => family === 'Playfair Display' ? `'${family}', ${GENERIC_SERIF}` : `'${family}', ${GENERIC_SANS}`;
/** Default role -> family assignment (what the Teacher Portal ships). */
export const DEFAULT_FONT_ASSIGNMENT = {
    display: 'Playfair Display',
    primary: 'Raleway',
    data: 'Inter',
};
export const FONT_ROLE_USAGE = {
    display: 'Page titles, welcome headings, hero numbers — used sparingly for a premium editorial feel.',
    primary: 'Navigation, labels, buttons, form fields, headings and body copy.',
    data: 'Tables, analytics, KPI figures, marks, codes, timestamps and other dense data.',
};
/** Weights used by the Teacher Portal (font-medium .. font-extrabold). */
export const fontWeights = {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
};
/**
 * Web type scale (px). Mirrors the Tailwind sizes the Teacher Portal uses: text-[10px] .. text-4xl.
 * `lineHeight` is the unit-less ratio used with the size.
 */
export const typeScale = {
    micro: { size: 10, lineHeight: 1.4 },
    caption: { size: 11, lineHeight: 1.4 },
    xs: { size: 12, lineHeight: 1.333 },
    sm: { size: 14, lineHeight: 1.428 },
    base: { size: 16, lineHeight: 1.5 },
    lg: { size: 18, lineHeight: 1.555 },
    xl: { size: 20, lineHeight: 1.4 },
    '2xl': { size: 24, lineHeight: 1.333 },
    '3xl': { size: 30, lineHeight: 1.2 },
    '4xl': { size: 36, lineHeight: 1.111 },
};
/** Native (React Native) type scale — same roles, phone-density sizes in dp/pt. */
export const nativeTypeScale = {
    xs: { size: 11, lineHeight: 15 },
    sm: { size: 13, lineHeight: 18 },
    base: { size: 15, lineHeight: 22 },
    lg: { size: 17, lineHeight: 24 },
    xl: { size: 20, lineHeight: 28 },
    xxl: { size: 24, lineHeight: 32 },
    title: { size: 30, lineHeight: 38 },
};
export const letterSpacing = {
    tight: -0.025, // em — tracking-tight
    normal: 0,
    wide: 0.05, // em — badges / uppercase labels
};
/**
 * React Native font family resolution for the bundled TTFs (apps/mobile/assets/fonts).
 * Android resolves `<Family>.ttf` for regular and `<Family>_bold.ttf` for fontWeight 700; iOS uses the registered
 * family name.
 */
export const nativeFontFamily = (family, platform) => platform === 'ios' ? family : family.replace(/\s+/g, '');
