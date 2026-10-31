'use client';

/**
 * Student Portal chart cards. Every card renders data the page ALREADY fetched (attendance, results,
 * assignments, fees, study tasks): no extra API calls, no mock fixtures, no invented numbers.
 * Empty inputs show an honest, premium empty state.
 * Loaded lazily through ./index.tsx.
 */
import React from 'react';
import {
  ChartCard,
  DonutChart,
  HBarChart,
  LineChart,
  studentMonthlyAttendance,
  studentResultsTrend,
  studentSubjectAverages,
  studentAssignmentStatus,
  studentFeeBreakdown,
  studentTaskProgress,
} from '@padhai-pilot/ui/charts';
import type { StudentAssessmentResult } from '@padhai-pilot/shared';

export interface StudentAttendanceRecord {
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
}

export interface StudentAttendanceTrendCardProps {
  records: ReadonlyArray<StudentAttendanceRecord> | undefined | null;
}

export function StudentAttendanceTrendCard({ records }: StudentAttendanceTrendCardProps) {
  const data = studentMonthlyAttendance(records);
  return (
    <ChartCard
      title="Attendance rate by month"
      subtitle="Monthly percentage of scheduled sessions attended"
      state={data ? 'ready' : 'empty'}
      emptyArt="empty-states/attendance"
      emptyTitle="No attendance recorded yet"
      emptyDescription="Verified classroom roll-calls will show up here by month once marked."
    >
      {data && <LineChart data={data} area label="Monthly attendance rate" noun="months" />}
    </ChartCard>
  );
}

export interface StudentResultsTrendCardProps {
  results: ReadonlyArray<StudentAssessmentResult> | undefined | null;
}

export function StudentResultsTrendCard({ results }: StudentResultsTrendCardProps) {
  const data = studentResultsTrend(results);
  return (
    <ChartCard
      title="Assessment score progression"
      subtitle="Score percentage across verified classroom tests"
      state={data ? 'ready' : 'empty'}
      emptyArt="education/exam-results"
      emptyTitle="No test scores published yet"
      emptyDescription="Verified marks will appear here as soon as faculty publishes exam results."
    >
      {data && <LineChart data={data} area label="Assessment scores" noun="tests" />}
    </ChartCard>
  );
}

export interface StudentSubjectAveragesCardProps {
  results: ReadonlyArray<StudentAssessmentResult> | undefined | null;
}

export function StudentSubjectAveragesCard({ results }: StudentSubjectAveragesCardProps) {
  const rows = studentSubjectAverages(results);
  return (
    <ChartCard
      title="Subject performance breakdown"
      subtitle="Average score achieved across published assessments"
      state={rows ? 'ready' : 'empty'}
      emptyArt="education/books"
      emptyTitle="No subject scores to compare"
      emptyDescription="Performance breakdown appears once tests are graded across subjects."
      height={160}
    >
      {rows && <HBarChart rows={rows} unit="%" max={100} label="Average percentage per subject" />}
    </ChartCard>
  );
}

export interface StudentAssignmentBreakdownCardProps {
  assignments: ReadonlyArray<{ status: string }> | undefined | null;
}

export function StudentAssignmentBreakdownCard({ assignments }: StudentAssignmentBreakdownCardProps) {
  const slices = studentAssignmentStatus(assignments);
  const total = assignments?.length || 0;
  return (
    <ChartCard
      title="Homework & assignment status"
      subtitle="Current progress across practice sets and DPP submissions"
      state={slices ? 'ready' : 'empty'}
      emptyArt="education/homework"
      emptyTitle="No assignments tracked"
      emptyDescription="Homework and problem sets given by your faculty will appear here."
      height={150}
    >
      {slices && (
        <DonutChart
          slices={slices}
          label="Assignment completion breakdown"
          centerValue={String(total)}
          centerLabel="total"
        />
      )}
    </ChartCard>
  );
}

export interface StudentFeeBreakdownCardProps {
  fee: { totalFees?: number; paidAmount?: number; balanceDue?: number } | undefined | null;
}

export function StudentFeeBreakdownCard({ fee }: StudentFeeBreakdownCardProps) {
  const slices = studentFeeBreakdown(fee);
  const paid = fee?.paidAmount || 0;
  return (
    <ChartCard
      title="Tuition fee breakdown"
      subtitle="Verified fee payments against outstanding balance"
      state={slices ? 'ready' : 'empty'}
      emptyArt="dashboard/fees-payments"
      emptyTitle="No fee records available"
      emptyDescription="Installment receipts and fee ledger details will appear here."
      height={150}
    >
      {slices && (
        <DonutChart
          slices={slices}
          label="Fee payment distribution"
          centerValue={`₹${paid.toLocaleString('en-IN')}`}
          centerLabel="paid"
        />
      )}
    </ChartCard>
  );
}

export interface StudentTaskProgressCardProps {
  tasks: ReadonlyArray<{ isCompleted: boolean }> | undefined | null;
}

export function StudentTaskProgressCard({ tasks }: StudentTaskProgressCardProps) {
  const slices = studentTaskProgress(tasks);
  const completed = (tasks ?? []).filter((t) => t.isCompleted).length;
  return (
    <ChartCard
      title="Study goal progress"
      subtitle="Completed vs pending tasks in your daily planner"
      state={slices ? 'ready' : 'empty'}
      emptyArt="education/progress"
      emptyTitle="No study tasks scheduled"
      emptyDescription="Add daily study tasks and DPP goals above to monitor your preparation."
      height={150}
    >
      {slices && (
        <DonutChart
          slices={slices}
          label="Study planner task completion"
          centerValue={String(completed)}
          centerLabel="done"
        />
      )}
    </ChartCard>
  );
}
