'use client';

/**
 * Teacher Portal chart cards. Every card renders data the page ALREADY fetched (reports, assignments,
 * tests, lesson plans, the open attendance register): no extra API calls, no fixtures, no invented
 * numbers. Empty inputs show an honest empty state. Loaded lazily through ./index.tsx.
 */
import React from 'react';
import { ChartCard, BarChart, DonutChart, HBarChart, LineChart, attendanceTrend, assignmentCompletion, batchAttendance, statusBreakdown, submissionFunnel, syllabusCoverage, testAverages } from '@padhai-pilot/ui/charts';
import type { Assignment, LessonPlan, TeacherReports, TestQuiz } from '@padhai-pilot/shared';

export function AttendanceTrendCard({ trends }: { trends: TeacherReports['attendanceTrends'] | undefined }) {
  const data = attendanceTrend(trends);
  return (
    <ChartCard
      title="Attendance rate by week"
      subtitle="Share of marked student-days recorded as present"
      state={data ? 'ready' : 'empty'}
      emptyArt="empty-states/attendance"
      emptyTitle="No attendance recorded yet"
      emptyDescription="Mark a batch register and the weekly rate shows up here."
    >
      {data && <LineChart data={data} area label="Weekly attendance rate" noun="weeks" />}
    </ChartCard>
  );
}

export function BatchAttendanceCard({ rows }: { rows: TeacherReports['batchPerformance'] | undefined }) {
  const data = batchAttendance(rows);
  return (
    <ChartCard
      title="Attendance by batch"
      subtitle="Average attendance rate, highest first"
      state={data ? 'ready' : 'empty'}
      emptyArt="empty-states/roster"
      emptyTitle="No batch has attendance yet"
      emptyDescription="Batch comparison appears once at least one register is saved."
      height={160}
    >
      {data && <HBarChart rows={data} unit="%" max={100} label="Average attendance per batch" />}
    </ChartCard>
  );
}

export function SubmissionFunnelCard({ metrics }: { metrics: TeacherReports['submissionMetrics'] | undefined }) {
  const rows = submissionFunnel(metrics);
  return (
    <ChartCard
      title="Assignment pipeline"
      subtitle="From assigned to graded across your batches"
      state={rows ? 'ready' : 'empty'}
      emptyArt="education/homework"
      emptyTitle="No assignments published"
      emptyDescription="Publish an assignment to a batch to see submissions and grading progress."
      height={140}
    >
      {rows && <HBarChart rows={rows} label="Assignment submission and grading funnel" />}
    </ChartCard>
  );
}

export function AssignmentCompletionCard({ items }: { items: Assignment[] }) {
  const rows = assignmentCompletion(items);
  return (
    <ChartCard
      title="Submission rate per assignment"
      subtitle="Submitted as a share of the batch roster"
      state={rows ? 'ready' : 'empty'}
      emptyArt="education/homework"
      emptyTitle="Nothing to compare yet"
      emptyDescription="Published assignments with a roster appear here with their submission rate."
      height={140}
    >
      {rows && <HBarChart rows={rows} unit="%" max={100} label="Submission rate per assignment" />}
    </ChartCard>
  );
}

export function TestAveragesCard({ tests }: { tests: TestQuiz[] }) {
  const data = testAverages(tests);
  return (
    <ChartCard
      title="Average score per test"
      subtitle="Mean marks as a percentage of total marks"
      state={data ? 'ready' : 'empty'}
      emptyArt="education/exam-results"
      emptyTitle="No scored attempts yet"
      emptyDescription="Averages appear after students attempt a published test."
    >
      {data && <BarChart data={data} label="Average score per test" noun="tests" />}
    </ChartCard>
  );
}

export function SyllabusCoverageCard({ plans }: { plans: LessonPlan[] }) {
  const rows = syllabusCoverage(plans);
  return (
    <ChartCard
      title="Syllabus coverage"
      subtitle="Lesson-plan topics marked as taught, by subject"
      state={rows ? 'ready' : 'empty'}
      emptyArt="education/books"
      emptyTitle="No lesson plans yet"
      emptyDescription="Add weekly topics and tick them off as you teach to track coverage."
      height={140}
    >
      {rows && <HBarChart rows={rows} unit="%" max={100} label="Share of planned topics taught, by subject" />}
    </ChartCard>
  );
}

export function RegisterBreakdownCard({ counts, title = 'Today’s register' }: { counts: { present: number; absent: number; late: number; excused: number }; title?: string }) {
  const slices = statusBreakdown(counts);
  const total = counts.present + counts.absent + counts.late + counts.excused;
  return (
    <ChartCard
      title={title}
      subtitle="Status of the students marked so far"
      state={slices ? 'ready' : 'empty'}
      emptyArt="empty-states/attendance"
      emptyTitle="Nobody marked yet"
      emptyDescription="Tap P, A, L or E against a student to start the breakdown."
      height={150}
    >
      {slices && <DonutChart slices={slices} label="Attendance status of marked students" centerValue={String(total)} centerLabel="marked" />}
    </ChartCard>
  );
}
