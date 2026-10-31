/**
 * Pure mappers: real API payloads -> chart data contracts.
 * Shared by web and native screens so both draw identical numbers. No fetching, no invented values:
 * missing numbers stay `null` (gap) and empty inputs return `null` so the caller shows an empty state.
 * Structural input types are declared locally so this module has no dependency on @padhai-pilot/shared.
 */
import type { CartesianData, DonutSlice } from './core';

export interface HBarRowData {
  id: string;
  label: string;
  value: number;
  of?: number;
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'deep' | 'muted';
  note?: string;
}

const pct = (n: number, d: number): number | null => (d > 0 ? Math.round((n / d) * 1000) / 10 : null);
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** GET /teacher/reports -> attendanceTrends */
export function attendanceTrend(trends: ReadonlyArray<{ label: string; rate: number }> | undefined | null, label = 'Attendance rate'): CartesianData | null {
  if (!trends?.length) return null;
  return {
    unit: '%',
    yMin: 0,
    yMax: 100,
    series: [{ id: 'rate', label, tone: 'brand', points: trends.map((t) => ({ x: t.label, y: finite(t.rate) ? t.rate : null })) }],
  };
}

/** GET /teacher/reports -> submissionMetrics as a funnel (assigned -> submitted -> graded). */
export function submissionFunnel(m: { totalAssigned: number; submittedCount: number; gradedCount: number; pendingReviewCount: number } | undefined | null): HBarRowData[] | null {
  if (!m || !m.totalAssigned) return null;
  return [
    { id: 'assigned', label: 'Assigned', value: m.totalAssigned, tone: 'muted' },
    { id: 'submitted', label: 'Submitted', value: m.submittedCount, of: m.totalAssigned, tone: 'brand', note: `${pct(m.submittedCount, m.totalAssigned) ?? 0}% of assigned` },
    { id: 'graded', label: 'Graded', value: m.gradedCount, of: m.submittedCount, tone: 'success', note: `${pct(m.gradedCount, m.submittedCount) ?? 0}% of submitted` },
    { id: 'pending', label: 'Awaiting review', value: m.pendingReviewCount, tone: 'warning' },
  ];
}

/** GET /teacher/reports -> batchPerformance (average attendance per batch). */
export function batchAttendance(rows: ReadonlyArray<{ batchName: string; code: string; averageAttendance: number; studentCount: number }> | undefined | null): HBarRowData[] | null {
  const valid = (rows ?? []).filter((r) => finite(r.averageAttendance));
  if (!valid.length) return null;
  return valid
    .slice()
    .sort((a, b) => b.averageAttendance - a.averageAttendance)
    .map((r) => ({
      id: r.code,
      label: r.batchName,
      value: r.averageAttendance,
      tone: r.averageAttendance >= 75 ? ('success' as const) : r.averageAttendance >= 60 ? ('warning' as const) : ('danger' as const),
      note: `${r.studentCount} students`,
    }));
}

/** Assignments list -> submission completion per assignment. */
export function assignmentCompletion(items: ReadonlyArray<{ id: string; title: string; submissionCount: number; totalStudents: number; status?: string }> | undefined | null, limit = 8): HBarRowData[] | null {
  const rows = (items ?? []).filter((a) => a.status !== 'DRAFT' && a.totalStudents > 0).slice(0, limit);
  if (!rows.length) return null;
  return rows.map((a) => {
    const p = pct(a.submissionCount, a.totalStudents) ?? 0;
    return { id: a.id, label: a.title, value: p, tone: p >= 80 ? 'success' : p >= 50 ? 'brand' : 'warning', note: `${a.submissionCount} of ${a.totalStudents} submitted` };
  });
}

/** Tests list -> average score (% of total marks) per test; tests without attempts are skipped, not zeroed. */
export function testAverages(items: ReadonlyArray<{ title: string; totalMarks: number; averageScore?: number | null; attemptCount?: number | null }> | undefined | null, limit = 10): CartesianData | null {
  const rows = (items ?? []).filter((t) => finite(t.averageScore) && t.totalMarks > 0 && (t.attemptCount ?? 1) > 0).slice(0, limit);
  if (!rows.length) return null;
  return {
    unit: '%',
    yMin: 0,
    yMax: 100,
    series: [{ id: 'avg', label: 'Average score', tone: 'brand', points: rows.map((t) => ({ x: t.title, y: pct(t.averageScore as number, t.totalMarks), note: `${t.attemptCount ?? '?'} attempts` })) }],
  };
}

/** Lesson plans -> syllabus coverage per subject (completed / planned). */
export function syllabusCoverage(plans: ReadonlyArray<{ subject: string; isCompleted: boolean }> | undefined | null): HBarRowData[] | null {
  if (!plans?.length) return null;
  const by = new Map<string, { done: number; total: number }>();
  for (const p of plans) {
    const e = by.get(p.subject) ?? { done: 0, total: 0 };
    e.total += 1;
    if (p.isCompleted) e.done += 1;
    by.set(p.subject, e);
  }
  return [...by.entries()].map(([subject, e]) => ({ id: subject, label: subject, value: pct(e.done, e.total) ?? 0, tone: 'brand' as const, note: `${e.done} of ${e.total} topics taught` }));
}

/** Attendance statuses counted from real records -> donut slices. Zero-count statuses are dropped. */
export function statusBreakdown(counts: { present: number; absent: number; late: number; excused: number }): DonutSlice[] | null {
  const slices: DonutSlice[] = ([
    { id: 'p', label: 'Present', value: counts.present, tone: 'success' },
    { id: 'a', label: 'Absent', value: counts.absent, tone: 'danger' },
    { id: 'l', label: 'Late', value: counts.late, tone: 'warning' },
    { id: 'e', label: 'Excused', value: counts.excused, tone: 'brand' },
  ] as DonutSlice[]).filter((s) => s.value > 0);
  return slices.length ? slices : null;
}

/** Marks distribution: bins scores (as % of max) into 10-point buckets. Returns null if there are no scores. */
export function scoreDistribution(percentages: ReadonlyArray<number>): CartesianData | null {
  const vals = percentages.filter(finite);
  if (!vals.length) return null;
  const bins = Array.from({ length: 10 }, (_, i) => ({ lo: i * 10, hi: i === 9 ? 100 : i * 10 + 9.99, n: 0 }));
  for (const v of vals) bins[Math.min(9, Math.max(0, Math.floor(v / 10)))].n += 1;
  return {
    series: [{ id: 'students', label: 'Students', tone: 'brand', points: bins.map((b) => ({ x: `${b.lo}-${b.lo + (b.lo === 90 ? 10 : 9)}`, y: b.n })) }],
  };
}

/** Per-subject marks for a student: percentage = obtained / max. Subjects without a max are skipped. */
export function subjectMarks(rows: ReadonlyArray<{ subject: string; marks: number | null | undefined; maxMarks: number | null | undefined }> | undefined | null): HBarRowData[] | null {
  const out: HBarRowData[] = [];
  for (const r of rows ?? []) {
    if (!finite(r.marks) || !finite(r.maxMarks) || r.maxMarks <= 0) continue;
    const p = pct(r.marks, r.maxMarks) ?? 0;
    out.push({ id: r.subject, label: r.subject, value: p, tone: p >= 75 ? 'success' : p >= 50 ? 'brand' : 'warning', note: `${r.marks} / ${r.maxMarks}` });
  }
  return out.length ? out : null;
}
