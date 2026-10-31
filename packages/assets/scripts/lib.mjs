// Shared helpers for the SVG pipeline (optimise -> validate -> compile to registry).
import { optimize } from 'svgo';
import { palette } from '../src/palette.ts';

export const MAX_BYTES = 7000;
export const MAX_NODES = 90;

const ALLOWED_TAGS = new Set([
  'svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon', 'defs', 'clipPath',
]);
const COLOR_ATTRS = new Set(['fill', 'stroke']);
const REVERSE = new Map(Object.entries(palette).map(([token, v]) => [v.light.toUpperCase(), token]));

/** svgo pass: strips metadata/comments/editor data, rounds numbers. Idempotent. */
export function optimizeSource(source) {
  let ast = null;
  const result = optimize(source, {
    multipass: true,
    js2svg: { pretty: false },
    plugins: [
      'removeDoctype',
      'removeXMLProcInst',
      'removeComments',
      'removeMetadata',
      'removeEditorsNSData',
      'cleanupAttrs',
      'removeEmptyAttrs',
      'removeEmptyContainers',
      'cleanupNumericValues',
      {
        name: 'capture-ast',
        fn: () => ({
          root: {
            exit(root) {
              ast = root;
            },
          },
        }),
      },
    ],
  });
  return { data: result.data, ast };
}

function normaliseHex(value) {
  let v = value.trim().toUpperCase();
  if (/^#[0-9A-F]{3}$/.test(v)) v = `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  return v;
}

/** Map an authored colour to `none` | `currentColor` | `@token`; throws on anything else. */
export function mapColor(value, where) {
  const v = value.trim();
  if (v === 'none' || v === 'currentColor') return v;
  if (/^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/.test(v)) {
    const token = REVERSE.get(normaliseHex(v));
    if (!token) throw new Error(`${where}: colour ${v} is not in the illustration palette`);
    return `@${token}`;
  }
  throw new Error(`${where}: unsupported colour value "${v}" (use palette hex, none or currentColor)`);
}

const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

// ---- path length (so draw animations are identical on web and native) -------
function cubic(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}
function quad(p0, p1, p2, t) {
  const u = 1 - t;
  return u * u * p0 + 2 * u * t * p1 + t * t * p2;
}

export function pathLength(d, where = 'path') {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
  let i = 0;
  let cmd = '';
  let x = 0, y = 0, sx = 0, sy = 0, total = 0;
  const num = () => parseFloat(tokens[i++]);
  const seg = (nx, ny) => {
    total += Math.hypot(nx - x, ny - y);
    x = nx; y = ny;
  };
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    const ox = rel ? x : 0, oy = rel ? y : 0;
    if (C === 'M') {
      x = ox + num(); y = oy + num(); sx = x; sy = y;
      cmd = rel ? 'l' : 'L';
    } else if (C === 'L') seg(ox + num(), oy + num());
    else if (C === 'H') seg(ox + num(), y);
    else if (C === 'V') seg(x, oy + num());
    else if (C === 'Z') { seg(sx, sy); }
    else if (C === 'C') {
      const [a, b, c2, d2, e, f] = [num(), num(), num(), num(), num(), num()];
      const p = [x, y, ox + a, oy + b, ox + c2, oy + d2, ox + e, oy + f];
      let px = x, py = y;
      for (let s = 1; s <= 24; s++) {
        const t = s / 24;
        const nx = cubic(p[0], p[2], p[4], p[6], t), ny = cubic(p[1], p[3], p[5], p[7], t);
        total += Math.hypot(nx - px, ny - py); px = nx; py = ny;
      }
      x = p[6]; y = p[7];
    } else if (C === 'Q') {
      const [a, b, e, f] = [num(), num(), num(), num()];
      const p = [x, y, ox + a, oy + b, ox + e, oy + f];
      let px = x, py = y;
      for (let s = 1; s <= 24; s++) {
        const t = s / 24;
        const nx = quad(p[0], p[2], p[4], t), ny = quad(p[1], p[3], p[5], t);
        total += Math.hypot(nx - px, ny - py); px = nx; py = ny;
      }
      x = p[4]; y = p[5];
    } else {
      throw new Error(`${where}: path command "${cmd}" not supported for draw animation (use M L H V C Q Z)`);
    }
  }
  return total;
}

function elementLength(tag, a, where) {
  if (tag === 'path') return pathLength(a.d, where);
  if (tag === 'circle') return 2 * Math.PI * parseFloat(a.r);
  if (tag === 'line') return Math.hypot(a.x2 - a.x1, a.y2 - a.y1);
  if (tag === 'polyline') {
    const pts = a.points.trim().split(/[\s,]+/).map(Number);
    let t = 0;
    for (let i = 2; i < pts.length; i += 2) t += Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]);
    return t;
  }
  throw new Error(`${where}: <${tag}> cannot use data-anim="draw"`);
}

let nodeCount = 0;

function convert(node, where) {
  if (node.type !== 'element') {
    if (node.type === 'text' && !node.value.trim()) return null;
    throw new Error(`${where}: unexpected ${node.type} node (text, CDATA and comments are not allowed)`);
  }
  if (!ALLOWED_TAGS.has(node.name)) throw new Error(`${where}: <${node.name}> is not allowed in canonical SVGs`);
  nodeCount++;
  const attrs = {};
  const out = { t: node.name };
  for (const [rawName, rawValue] of Object.entries(node.attributes)) {
    const value = String(rawValue);
    if (rawName === 'xmlns' || rawName === 'width' && node.name === 'svg' || rawName === 'height' && node.name === 'svg') continue;
    if (rawName === 'style' || rawName === 'class') throw new Error(`${where}: "${rawName}" attribute is not allowed (use presentation attributes)`);
    if (/^(href|xlink:href)$/.test(rawName)) throw new Error(`${where}: external references are not allowed`);
    if (/^on/i.test(rawName)) throw new Error(`${where}: event attributes are not allowed`);
    if (/url\(/i.test(value) && !/^url\(#/.test(value)) throw new Error(`${where}: external url() reference`);
    if (rawName === 'data-anim') { out.anim = value; continue; }
    if (rawName === 'data-delay') { out.delay = Number(value); continue; }
    if (rawName === 'data-origin') { out.origin = value; continue; }
    if (rawName.startsWith('data-')) throw new Error(`${where}: unknown data attribute ${rawName}`);
    if (rawName === 'font-family' || rawName.startsWith('font')) throw new Error(`${where}: fonts are not allowed`);
    attrs[camel(rawName)] = COLOR_ATTRS.has(rawName) ? mapColor(value, where) : value;
  }
  if (out.anim === 'draw') out.len = Math.round(elementLength(node.name, attrs, where) * 100) / 100;
  out.a = attrs;
  const kids = node.children.map((c) => convert(c, where)).filter(Boolean);
  if (kids.length) out.c = kids;
  return out;
}

export function compile(name, source) {
  const bytes = Buffer.byteLength(source);
  if (bytes > MAX_BYTES) throw new Error(`${name}: ${bytes} bytes exceeds ${MAX_BYTES}`);
  const { data, ast } = optimizeSource(source);
  const svg = ast.children.find((n) => n.type === 'element' && n.name === 'svg');
  if (!svg) throw new Error(`${name}: no <svg> root`);
  const viewBox = svg.attributes.viewBox;
  if (!viewBox || !/^0 0 \d+ \d+$/.test(viewBox)) throw new Error(`${name}: viewBox must be "0 0 W H"`);
  nodeCount = 0;
  const root = convert(svg, name);
  const { viewBox: _vb, ...rootAttrs } = root.a;
  if (nodeCount > MAX_NODES) throw new Error(`${name}: ${nodeCount} nodes exceeds ${MAX_NODES}`);
  const [, , w, h] = viewBox.split(' ').map(Number);
  return { optimized: data, def: { viewBox, w, h, nodes: nodeCount, root: rootAttrs, tree: root.c ?? [] } };
}
