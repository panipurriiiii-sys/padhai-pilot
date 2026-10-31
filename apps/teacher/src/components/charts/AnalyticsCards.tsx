'use client';

/**
 * Cards backed by GET /analytics/teacher. Null values mean "no data": they are skipped and
 * the card shows an empty state, never a zero or a made-up number.
 */
import React from 'react';
import { ChartCard, DonutChart, HBarChart } from '@padhai-pilot/ui/charts';
import type { TeacherAnalyticsSummary } from '@padhai-pilot/shared';

interface AnalyticsProps {
  analytics: TeacherAnalyticsSummary | null | undefined;
  error?: string;
}

function stateOf(hasRows: boolean, a: AnalyticsProps): 'ready' | 'empty' | 'loading' | 'error' {
  if (a.error) return 'error';
  if (!a.analytics) return 'loading';
  return hasRows ? 'ready' : 'empty';
}

const GRADE_TONES = ['success', 'brand', 'deep', 'warning', 'danger', 'muted'] as const;

export function GradeDistributionCard(a: AnalyticsProps) {
  const slices = (a.analytics?.gradeDistribution ?? [])
    .filter((g) => g.studentCount > 0)
    .map((g, i) => ({ id: g.grade, label: `Grade ${g.grade}`, value: g.studentCount, tone: GRADE_TONES[i % GRADE_TONES.length] }));
  return (
    <ChartCard
      title="Grade distribution"
      subtitle="Students by grade across published assessments"
      state={stateOf(slices.length > 0, a)}
      errorMessage={a.error}
      emptyArt="education/exam-results"
      emptyTitle="No published results yet"
      emptyDescription="Publish an assessment and the grade spread appears here."
      height={150}
    >
      {slices.length > 0 && (
        <DonutChart slices={slices} label="Grade distribution" centerValue={String(slices.reduce((n, s) => n + s.value, 0))} centerLabel="students" />
      )}
    </ChartCard>
  );
}

export function SubjectComparisonCard(a: AnalyticsProps) {
  const rows = (a.analytics?.subjectComparison ?? [])
    .filter((s) => s.averageScorePercentage !== null)
    .map((s) => ({
      id: s.subject,
      label: s.subject,
      value: s.averageScorePercentage as number,
      tone: 'brand' as const,
      note: `${s.assessmentCount} assessments, ${s.totalStudents} students`,
    }));
  return (
    <ChartCard
      title="Average score by subject"
      subtitle="Mean published score, as a percentage"
      state={stateOf(rows.length > 0, a)}
      errorMessage={a.error}
      emptyArt="education/books"
      emptyTitle="No scores to compare"
      emptyDescription="Subjects appear once marks are published."
      height={150}
    >
      {rows.length > 0 && <HBarChart rows={rows} unit="%" max={100} label="Average score per subject" />}
    </ChartCard>
  );
}

export function BatchAttendanceTrendsCard(a: AnalyticsProps) {
  const rows = (a.analytics?.batchAttendanceTrends ?? [])
    .filter((b) => b.averageAttendancePercentage !== null)
    .map((b) => ({
      id: b.batchId,
      label: b.batchName,
      value: b.averageAttendancePercentage as number,
      tone: (b.averageAttendancePercentage as number) >= 75 ? ('success' as const) : ('warning' as const),
      note: `${b.sessionsCount} sessions`,
    }));
  return (
    <ChartCard
      title="Batch attendance"
      subtitle="Average attendance from saved registers"
      state={stateOf(rows.length > 0, a)}
      errorMessage={a.error}
      emptyArt="empty-states/attendance"
      emptyTitle="No registers saved yet"
      emptyDescription="Save an attendance register to compare batches."
      height={150}
    >
      {rows.length > 0 && <HBarChart rows={rows} unit="%" max={100} label="Average attendance per batch" />}
    </ChartCard>
  );
}

export function SubmissionRatesCard(a: AnalyticsProps) {
  const rows = (a.analytics?.assignmentSubmissions ?? []).slice(0, 8).map((s) => ({
    id: s.assignmentId,
    label: s.title,
    value: s.submissionRatePercentage,
    tone: s.submissionRatePercentage >= 70 ? ('success' as const) : ('warning' as const),
    note: `${s.submittedCount} of ${s.totalStudents}`,
  }));
  return (
    <ChartCard
      title="Assignment submissions"
      subtitle="Submitted as a share of the roster"
      state={stateOf(rows.length > 0, a)}
      errorMessage={a.error}
      emptyArt="education/homework"
      emptyTitle="No assignments yet"
      emptyDescription="Publish an assignment to track submissions."
      height={150}
    >
      {rows.length > 0 && <HBarChart rows={rows} unit="%" max={100} label="Submission rate per assignment" />}
    </ChartCard>
  );
}

export function SyllabusCoverageApiCard(a: AnalyticsProps) {
  const rows = (a.analytics?.syllabusCoverage ?? []).map((s) => ({
    id: s.batchId + s.subject,
    label: `${s.batchName} - ${s.subject}`,
    value: s.coveragePercentage,
    tone: 'brand' as const,
    note: `${s.completedTopics} of ${s.totalTopics} topics`,
  }));
  return (
    <ChartCard
      title="Syllabus coverage by batch"
      subtitle="Topics marked taught"
      state={stateOf(rows.length > 0, a)}
      errorMessage={a.error}
      emptyArt="education/books"
      emptyTitle="No lesson plans yet"
      emptyDescription="Add lesson plans and tick topics as you teach."
      height={150}
    >
      {rows.length > 0 && <HBarChart rows={rows} unit="%" max={100} label="Syllabus coverage" />}
    </ChartCard>
  );
}
