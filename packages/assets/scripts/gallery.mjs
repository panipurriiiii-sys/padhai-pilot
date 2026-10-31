#!/usr/bin/env node
// Renders every canonical SVG into one static HTML contact sheet for visual review.
//   node scripts/gallery.mjs <out.html> [dark]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from './lib.mjs';
import { palette } from '../src/palette.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const svgDir = path.join(root, 'svg');
const out = process.argv[2] ?? 'gallery.html';
const dark = process.argv[3] === 'dark';

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.svg') ? [path.join(d, e.name)] : [],
  );

const color = (v) => {
  if (v.startsWith('@')) {
    const p = palette[v.slice(1)];
    return dark && p.dark ? p.dark : p.light;
  }
  return v;
};
const attrs = (a) =>
  Object.entries(a)
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}="${['fill', 'stroke'].includes(k) ? color(v) : v}"`)
    .join(' ');
const render = (n) =>
  `<${n.t} ${attrs(n.a)}${n.anim === 'draw' ? ` stroke-dasharray="${n.len}"` : ''}>${(n.c ?? []).map(render).join('')}</${n.t}>`;

const cards = walk(svgDir).sort().map((f) => {
  const name = path.relative(svgDir, f).replace(/\\/g, '/').replace(/\.svg$/, '');
  const { def } = compile(name, fs.readFileSync(f, 'utf8'));
  const small = def.w <= 96;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${def.viewBox}" width="${small ? 96 : 240}" height="${small ? 96 * def.h / def.w : 180}" ${attrs(def.root)}>${def.tree.map(render).join('')}</svg>`;
  return `<figure><div class="art">${svg}</div><figcaption>${name} <i>${def.nodes}n</i></figcaption></figure>`;
});

const bg = dark ? '#050608' : '#F8F7F4';
const card = dark ? '#0A0D12' : '#FFFFFF';
const fg = dark ? '#F5F7FA' : '#1C1917';
fs.writeFileSync(
  out,
  `<!doctype html><meta charset="utf-8"><title>PadhaiPilot SVG gallery</title><style>body{margin:0;padding:20px;background:${bg};color:${fg};font:12px Inter,system-ui,sans-serif;color:${fg}}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}figure{margin:0;background:${card};border:1px solid #E3DFD9;border-radius:14px;padding:10px;text-align:center}.art{display:flex;justify-content:center;align-items:center;min-height:100px}figcaption{margin-top:6px;opacity:.7}</style><main>${cards.join('')}</main>`,
);
console.log(`gallery: ${cards.length} assets -> ${out}`);
