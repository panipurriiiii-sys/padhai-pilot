'use client';

/**
 * Lazy entry point for Student Portal charts. The chart layer and the animation library are
 * code-split: they are fetched only when a section that shows a chart is opened, so the static
 * portal shell stays lightweight and loads instantly.
 */
import React from 'react';
import dynamic from 'next/dynamic';

function ChartFallback() {
  return (
    <div className="pp-card pp-chart-card" aria-hidden="true">
      <div className="pp-skeleton" style={{ width: '40%', height: 14, marginBottom: 14 }} />
      <div className="pp-skeleton" style={{ width: '100%', height: 170 }} />
    </div>
  );
}

export const StudentAttendanceTrendCard = dynamic(
  () => import('./StudentCharts').then((m) => m.StudentAttendanceTrendCard),
  { ssr: false, loading: ChartFallback },
);

export const StudentResultsTrendCard = dynamic(
  () => import('./StudentCharts').then((m) => m.StudentResultsTrendCard),
  { ssr: false, loading: ChartFallback },
);

export const StudentSubjectAveragesCard = dynamic(
  () => import('./StudentCharts').then((m) => m.StudentSubjectAveragesCard),
  { ssr: false, loading: ChartFallback },
);

export const StudentAssignmentBreakdownCard = dynamic(
  () => import('./StudentCharts').then((m) => m.StudentAssignmentBreakdownCard),
  { ssr: false, loading: ChartFallback },
);

export const StudentFeeBreakdownCard = dynamic(
  () => import('./StudentCharts').then((m) => m.StudentFeeBreakdownCard),
  { ssr: false, loading: ChartFallback },
);

export const StudentTaskProgressCard = dynamic(
  () => import('./StudentCharts').then((m) => m.StudentTaskProgressCard),
  { ssr: false, loading: ChartFallback },
);
