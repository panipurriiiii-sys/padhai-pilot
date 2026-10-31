'use client';

/**
 * Student charts backed by GET /analytics/student. Null values mean "no data": they become gaps or
 * empty states, never zeros.
 */
import React from 'react';
import { ChartCard, LineChart, HBarChart, DonutChart } from '@padhai-pilot/ui/charts';
import type { StudentAnalyticsSummary } from '@padhai-pilot/shared';

interface Props {
  analytics: StudentAnalyticsSummary | null | undefined;
  error?: string;
}

function stateOf(has: boolean, p: Props): 'ready' | 'empty' | 'loading' | 'error' {
  if (p.error) return 'error';
  if (!p.analytics) return 'loading';
  return has ? 'ready' : 'empty';
}

export function ExamVsClassCard(p: Props) {
  const trend = p.analytics?.examScoreTrend ?? [];
  const data = trend.length
    ? {
        unit: '%',
        yMin: 0,
        yMax: 100,
        series: [
          { id: 'me', label: 'You', tone: 'brand' as const, points: trend.map((t) => ({ x: t.title, y: t.percentage })) },
          { id: 'class', label: 'Class average', tone: 'muted' as const, points: trend.map((t) => ({ x: t.title, y: t.classAveragePercentage })) },
        ],
      }
    : null;
  return (
    <ChartCard
      title="Your scores vs class average"
      subtitle="Published assessments, oldest to newest"
      state={stateOf(!!data, p)}
      errorMessage={p.error}
      emptyArt="education/exam-results"
      emptyTitle="No published results yet"
      emptyDescription="Scores appear here as soon as faculty publishes them."
    >
      {data && <LineChart data={data} label="Your score and the class average per assessment" noun="assessments" />}
    </ChartCard>
  );
}

export function SubjectPerformanceCard(p: Props) {
  const rows = (p.analytics?.subjectPerformance ?? []).map((s) => ({
    id: s.subject,
    label: s.subject,
    value: s.percentage,
    tone: s.percentage >= 75 ? ('success' as const) : s.percentage >= 50 ? ('brand' as const) : ('warning' as const),
    note: `Grade ${s.grade} - ${s.marksObtained}/${s.maxMarks}`,
  }));
  return (
    <ChartCard
      title="Subject performance"
      subtitle="Total marks obtained per subject"
      state={stateOf(rows.length > 0, p)}
      errorMessage={p.error}
      emptyArt="education/books"
      emptyTitle="No subject marks yet"
      emptyDescription="Subjects appear once marks are published."
      height={150}
    >
      {rows.length > 0 && <HBarChart rows={rows} unit="%" max={100} label="Percentage per subject" />}
    </ChartCard>
  );
}

export function HomeworkCompletionCard(p: Props) {
  const h = p.analytics?.homeworkSummary;
  const slices = h
    ? [
        { id: 'graded', label: 'Graded', value: h.graded, tone: 'success' as const },
        { id: 'submitted', label: 'Submitted, awaiting grade', value: Math.max(0, h.submitted - h.graded), tone: 'brand' as const },
        { id: 'pending', label: 'Pending', value: h.pending, tone: 'warning' as const },
      ].filter((s) => s.value > 0)
    : [];
  return (
    <ChartCard
      title="Homework completion"
      subtitle={h && h.completionRatePercentage !== null ? `${h.completionRatePercentage}% submitted` : 'Assignments from your faculty'}
      state={stateOf(slices.length > 0, p)}
      errorMessage={p.error}
      emptyArt="education/homework"
      emptyTitle="No homework assigned yet"
      emptyDescription="Assigned work and your progress show up here."
      height={150}
    >
      {slices.length > 0 && <DonutChart slices={slices} label="Homework status" centerValue={String(h?.totalAssigned ?? '')} centerLabel="assigned" />}
    </ChartCard>
  );
}
