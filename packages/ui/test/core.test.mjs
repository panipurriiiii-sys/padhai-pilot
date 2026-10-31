// Fixtures in this file exist ONLY for unit tests - production screens never import them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { niceTicks, linear, extent, runs, linePath, arcPath, describeCartesian, describeDonut, formatValue, hasData } from '../src/charts/core.ts';
import { staggerDelay, stagger, duration, durationMs } from '../src/motion/tokens.ts';

const attendance = {
  unit: '%',
  series: [{ id: 'a', label: 'Present', points: [{ x: 'Mon', y: 80 }, { x: 'Tue', y: null }, { x: 'Wed', y: 92 }] }],
};

test('niceTicks covers the range with round steps', () => {
  assert.deepEqual(niceTicks(0, 100, 5), [0, 25, 50, 75, 100]);
  assert.deepEqual(niceTicks(3, 97, 5), [0, 25, 50, 75, 100]);
  assert.ok(niceTicks(5, 5).length >= 2);
});

test('linear scale maps domain to range', () => {
  const s = linear([0, 100], [200, 0]);
  assert.equal(s(0), 200);
  assert.equal(s(100), 0);
  assert.equal(s(50), 100);
});

test('null values become gaps, never zeros', () => {
  const r = runs(attendance.series[0].points);
  assert.equal(r.length, 2);
  assert.deepEqual(r.map((x) => x.map((p) => p.i)), [[0], [2]]);
  assert.equal(hasData({ series: [{ id: 'x', label: 'x', points: [{ x: 'a', y: null }] }] }), false);
  assert.equal(hasData(attendance), true);
});

test('bars include zero, lines may start above it', () => {
  const d = { series: [{ id: 's', label: 's', points: [{ x: 'a', y: 60 }, { x: 'b', y: 90 }] }] };
  assert.equal(extent(d, true).min, 0);
  assert.ok(extent(d, false).min >= 50);
  assert.equal(extent({ ...d, yMax: 100 }, true).max, 100);
});

test('paths are well formed', () => {
  assert.equal(linePath([[0, 1], [2, 3]]), 'M0.0 1.0L2.0 3.0');
  assert.match(arcPath(50, 50, 40, 0, 0.5), /^M[\d. ]+A40 40 0 0 1 [\d. ]+$/);
  assert.match(arcPath(50, 50, 40, 0, 0.75), /A40 40 0 1 1/);
});

test('text alternatives describe real values only', () => {
  const t = describeCartesian(attendance, 'days');
  assert.match(t, /2 days/);
  assert.match(t, /highest 92%/);
  assert.match(describeDonut([{ id: 'p', label: 'Paid', value: 3, tone: 'success' }, { id: 'd', label: 'Due', value: 1, tone: 'danger' }]), /Paid 3 \(75%\)/);
  assert.equal(describeDonut([]), 'No data.');
  assert.equal(formatValue(1234567), '12,34,567');
});

test('motion tokens: stagger is capped and durations agree across platforms', () => {
  assert.equal(staggerDelay(3), 3 * stagger.list);
  assert.equal(staggerDelay(500), stagger.maxItems * stagger.list);
  for (const k of Object.keys(duration)) assert.equal(Math.round(duration[k] * 1000), durationMs[k]);
  assert.ok(duration.standard <= 0.24, 'UI feedback must stay fast');
});
