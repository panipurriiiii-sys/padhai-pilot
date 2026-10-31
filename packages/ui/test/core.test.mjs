// Fixtures in this file exist ONLY for unit tests - production screens never import them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { niceTicks, linear, extent, runs, linePath, arcPath, describeCartesian, describeDonut, formatValue, hasData } from '../src/charts/core.ts';
import { staggerDelay, stagger, duration, durationMs } from '../src/motion/tokens.ts';
import {
  studentMonthlyAttendance,
  studentResultsTrend,
  studentSubjectAverages,
  studentAssignmentStatus,
  studentFeeBreakdown,
  studentTaskProgress,
} from '../src/charts/mappers.ts';

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

test('studentMonthlyAttendance: groups by month and computes rate accurately', () => {
  assert.equal(studentMonthlyAttendance(null), null);
  assert.equal(studentMonthlyAttendance([]), null);

  const records = [
    { date: '2026-09-01', status: 'PRESENT' },
    { date: '2026-09-02', status: 'PRESENT' },
    { date: '2026-09-03', status: 'ABSENT' },
    { date: '2026-09-04', status: 'LATE' },
    { date: '2026-10-01', status: 'PRESENT' },
  ];
  const chart = studentMonthlyAttendance(records);
  assert.ok(chart);
  assert.equal(chart.series[0].points.length, 2);
  // Sep: (2 + 0.5) / 4 = 62.5%
  assert.equal(chart.series[0].points[0].y, 62.5);
  // Oct: 1 / 1 = 100%
  assert.equal(chart.series[0].points[1].y, 100);
});

test('studentResultsTrend: maps valid assessment percentages', () => {
  assert.equal(studentResultsTrend(null), null);
  assert.equal(studentResultsTrend([]), null);

  const results = [
    { testTitle: 'Unit Test 1', percentage: 88, resultStatus: 'SCORED' },
    { testTitle: 'Unit Test 2', percentage: null, obtainedMarks: 45, maxMarks: 50, resultStatus: 'SCORED' },
    { testTitle: 'Unscored Test', percentage: null, resultStatus: 'PENDING' },
  ];
  const chart = studentResultsTrend(results);
  assert.ok(chart);
  assert.equal(chart.series[0].points.length, 2);
  assert.equal(chart.series[0].points[0].y, 88);
  assert.equal(chart.series[0].points[1].y, 90);
});

test('studentSubjectAverages: aggregates subject scores', () => {
  assert.equal(studentSubjectAverages(null), null);
  const results = [
    { subject: 'Math', percentage: 90, resultStatus: 'SCORED' },
    { subject: 'Math', percentage: 80, resultStatus: 'SCORED' },
    { subject: 'Physics', percentage: 70, resultStatus: 'SCORED' },
  ];
  const rows = studentSubjectAverages(results);
  assert.ok(rows);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].id, 'Math');
  assert.equal(rows[0].value, 85);
  assert.equal(rows[1].id, 'Physics');
  assert.equal(rows[1].value, 70);
});

test('studentAssignmentStatus & fees & tasks: build donut slices', () => {
  assert.equal(studentAssignmentStatus([]), null);
  const asgSlices = studentAssignmentStatus([
    { status: 'SUBMITTED' },
    { status: 'GRADED' },
    { status: 'GRADED' },
  ]);
  assert.ok(asgSlices);
  assert.equal(asgSlices.length, 2);

  const feeSlices = studentFeeBreakdown({ totalFees: 50000, paidAmount: 35000, balanceDue: 15000 });
  assert.ok(feeSlices);
  assert.equal(feeSlices.length, 2);
  assert.equal(studentFeeBreakdown(null), null);

  const taskSlices = studentTaskProgress([
    { isCompleted: true },
    { isCompleted: false },
    { isCompleted: true },
  ]);
  assert.ok(taskSlices);
  assert.equal(taskSlices.length, 2);
  assert.equal(studentTaskProgress([]), null);
});
