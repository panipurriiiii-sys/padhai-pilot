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

// -------------------------------------------------------------
// STUDENT PORTAL MAPPERS
// -------------------------------------------------------------

/** Student attendance records -> monthly attendance percentage trend. */
export function studentMonthlyAttendance(
  records: ReadonlyArray<{ date: string; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' }> | undefined | null,
): CartesianData | null {
  if (!records?.length) return null;
  const monthMap = new Map<string, { present: number; late: number; total: number; sortKey: string }>();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (const r of records) {
    if (!r.date) continue;
    const d = new Date(r.date);
    let label = r.date.slice(0, 7);
    let sortKey = r.date.slice(0, 7);
    if (!Number.isNaN(d.getTime())) {
      label = `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
      sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    const cur = monthMap.get(label) ?? { present: 0, late: 0, total: 0, sortKey };
    cur.total += 1;
    if (r.status === 'PRESENT') cur.present += 1;
    else if (r.status === 'LATE') cur.late += 1;
    monthMap.set(label, cur);
  }

  const entries = [...monthMap.entries()].sort((a, b) => a[1].sortKey.localeCompare(b[1].sortKey));
  if (!entries.length) return null;

  return {
    unit: '%',
    yMin: 0,
    yMax: 100,
    series: [
      {
        id: 'attendance-rate',
        label: 'Attendance rate',
        tone: 'brand',
        points: entries.map(([label, data]) => {
          const rate = data.total > 0 ? Math.round(((data.present + data.late * 0.5) / data.total) * 1000) / 10 : 0;
          return {
            x: label,
            y: rate,
            note: `${data.present} present of ${data.total}`,
          };
        }),
      },
    ],
  };
}

/** Assessment results -> score percentage trend per assessment. */
export function studentResultsTrend(
  results: ReadonlyArray<{
    testTitle?: string;
    title?: string;
    percentage?: number | null;
    obtainedMarks?: number | null;
    maxMarks?: number | null;
    resultStatus?: string;
  }> | undefined | null,
  limit = 8,
): CartesianData | null {
  const valid = (results ?? []).filter((r) => {
    if (r.resultStatus && r.resultStatus !== 'SCORED') return false;
    if (finite(r.percentage)) return true;
    return finite(r.obtainedMarks) && finite(r.maxMarks) && (r.maxMarks as number) > 0;
  });
  if (!valid.length) return null;

  const slice = valid.slice(0, limit);
  return {
    unit: '%',
    yMin: 0,
    yMax: 100,
    series: [
      {
        id: 'scores',
        label: 'Assessment score',
        tone: 'brand',
        points: slice.map((r) => {
          const score = finite(r.percentage)
            ? r.percentage
            : (pct(r.obtainedMarks as number, r.maxMarks as number) ?? 0);
          const label = r.testTitle || r.title || 'Assessment';
          return {
            x: label,
            y: score,
            note: finite(r.obtainedMarks) && finite(r.maxMarks) ? `${r.obtainedMarks}/${r.maxMarks}` : undefined,
          };
        }),
      },
    ],
  };
}

/** Assessment results -> subject-wise average score breakdown. */
export function studentSubjectAverages(
  results: ReadonlyArray<{
    subject?: string;
    percentage?: number | null;
    obtainedMarks?: number | null;
    maxMarks?: number | null;
    resultStatus?: string;
  }> | undefined | null,
): HBarRowData[] | null {
  const valid = (results ?? []).filter((r) => {
    if (r.resultStatus && r.resultStatus !== 'SCORED') return false;
    return finite(r.percentage) || (finite(r.obtainedMarks) && finite(r.maxMarks) && (r.maxMarks as number) > 0);
  });
  if (!valid.length) return null;

  const subjectMap = new Map<string, { totalPct: number; count: number }>();
  for (const r of valid) {
    const sub = r.subject || 'General';
    const score = finite(r.percentage)
      ? (r.percentage as number)
      : (pct(r.obtainedMarks as number, r.maxMarks as number) ?? 0);
    const cur = subjectMap.get(sub) ?? { totalPct: 0, count: 0 };
    cur.totalPct += score;
    cur.count += 1;
    subjectMap.set(sub, cur);
  }

  return [...subjectMap.entries()]
    .map(([subject, data]) => {
      const avg = Math.round((data.totalPct / data.count) * 10) / 10;
      return {
        id: subject,
        label: subject,
        value: avg,
        tone: avg >= 75 ? ('success' as const) : avg >= 60 ? ('brand' as const) : ('warning' as const),
        note: `${data.count} test${data.count === 1 ? '' : 's'}`,
      };
    })
    .sort((a, b) => b.value - a.value);
}

/** Assignment items -> status breakdown as Donut slices. */
export function studentAssignmentStatus(
  assignments: ReadonlyArray<{ status: string }> | undefined | null,
): DonutSlice[] | null {
  if (!assignments?.length) return null;

  const counts: Record<string, number> = {
    GRADED: 0,
    SUBMITTED: 0,
    PENDING: 0,
    LATE: 0,
    RESUBMIT: 0,
  };

  for (const a of assignments) {
    const key = (a.status || 'PENDING').toUpperCase();
    if (key in counts) counts[key] += 1;
    else counts.PENDING += 1;
  }

  const slices: DonutSlice[] = ([
    { id: 'graded', label: 'Graded', value: counts.GRADED, tone: 'success' },
    { id: 'submitted', label: 'Submitted', value: counts.SUBMITTED, tone: 'brand' },
    { id: 'pending', label: 'Pending', value: counts.PENDING, tone: 'warning' },
    { id: 'late', label: 'Late', value: counts.LATE, tone: 'danger' },
    { id: 'resubmit', label: 'Resubmit', value: counts.RESUBMIT, tone: 'deep' },
  ] as DonutSlice[]).filter((s) => s.value > 0);

  return slices.length ? slices : null;
}

/** Student fee summary -> paid vs due breakdown as Donut slices. */
export function studentFeeBreakdown(
  fee: { totalFees?: number; paidAmount?: number; balanceDue?: number } | undefined | null,
): DonutSlice[] | null {
  if (!fee) return null;
  const paid = finite(fee.paidAmount) && fee.paidAmount > 0 ? fee.paidAmount : 0;
  const due = finite(fee.balanceDue) && fee.balanceDue > 0 ? fee.balanceDue : 0;
  if (paid === 0 && due === 0) return null;

  const slices: DonutSlice[] = [];
  if (paid > 0) {
    slices.push({ id: 'paid', label: 'Paid', value: paid, tone: 'success' });
  }
  if (due > 0) {
    slices.push({ id: 'due', label: 'Balance Due', value: due, tone: 'warning' });
  }
  return slices.length ? slices : null;
}

/** Personal study tasks -> completion donut breakdown. */
export function studentTaskProgress(
  tasks: ReadonlyArray<{ isCompleted: boolean }> | undefined | null,
): DonutSlice[] | null {
  if (!tasks?.length) return null;
  let completed = 0;
  let pending = 0;
  for (const t of tasks) {
    if (t.isCompleted) completed += 1;
    else pending += 1;
  }
  if (completed === 0 && pending === 0) return null;
  const slices: DonutSlice[] = [];
  if (completed > 0) slices.push({ id: 'completed', label: 'Completed', value: completed, tone: 'success' });
  if (pending > 0) slices.push({ id: 'pending', label: 'Pending', value: pending, tone: 'brand' });
  return slices.length ? slices : null;
}
