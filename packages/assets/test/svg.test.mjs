import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { compile, MAX_BYTES } from '../scripts/lib.mjs';
import { palette } from '../src/palette.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const svgDir = path.join(root, 'svg');
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.svg') ? [path.join(d, e.name)] : [],
  );
const files = walk(svgDir);
const nameOf = (f) => path.relative(svgDir, f).replace(/\\/g, '/').replace(/\.svg$/, '');

test('library covers the required subjects', () => {
  const names = files.map(nameOf);
  const need = [
    'brand/logo-mark', 'onboarding/welcome', 'education/teacher', 'education/student', 'education/classroom',
    'education/books', 'dashboard/attendance', 'education/exam-results', 'education/homework',
    'dashboard/fees-payments', 'dashboard/salary-leave', 'dashboard/notifications', 'education/timetable',
    'documents/pdf-preview', 'documents/document-generation', 'dashboard/analytics', 'education/progress',
    'status/success', 'status/error', 'status/spinner', 'status/loading-plane',
  ];
  for (const n of need) assert.ok(names.includes(n), `missing ${n}`);
  assert.ok(names.filter((n) => n.startsWith('empty-states/')).length >= 5, 'need empty-state artwork');
});

for (const file of files) {
  const name = nameOf(file);
  test(`${name}: clean, tokenised, small`, () => {
    const src = fs.readFileSync(file, 'utf8');
    assert.ok(Buffer.byteLength(src) <= MAX_BYTES, 'size budget');
    for (const bad of [/<text[\s>]/i, /font/i, /@font-face/i, /<image/i, /<script/i, /<style/i, /foreignObject/i, /xlink:href|\shref=/i, /https?:\/\/(?!www\.w3\.org\/2000\/svg)/i, /<metadata|<title|<desc|sodipodi|inkscape/i, /\sstyle=/i, /rgba?\(/i]) {
      assert.ok(!bad.test(src), `forbidden content ${bad}`);
    }
    // compile() throws on any colour outside the palette, unknown tag, external url(), etc.
    const { def } = compile(name, src);
    assert.match(def.viewBox, /^0 0 \d+ \d+$/);
    const walkNodes = (nodes) => nodes.forEach((n) => {
      if (n.anim === 'draw') assert.ok(n.len > 0, 'draw element needs a measurable length');
      n.c && walkNodes(n.c);
    });
    walkNodes(def.tree);
  });
}

test('palette hexes are unique and come from the Teacher Portal tokens', () => {
  const hexes = Object.values(palette).map((p) => p.light.toUpperCase());
  assert.equal(new Set(hexes).size, hexes.length, 'duplicate palette colour makes token lookup ambiguous');
  const teacherCss = fs
    .readFileSync(path.resolve(root, '../../apps/teacher/src/app/globals.css'), 'utf8')
    .toUpperCase();
  for (const [token, entry] of Object.entries(palette)) {
    assert.ok(teacherCss.includes(entry.light.toUpperCase()), `${token} ${entry.light} not found in Teacher Portal globals.css`);
  }
});

test('registry is generated from current sources and sources are optimised', () => {
  execFileSync(process.execPath, [path.join(root, 'scripts/build.mjs'), '--check'], { stdio: 'pipe' });
});
