'use client';

/**
 * Lazy entry point for Teacher Portal charts. The chart layer and the animation library are
 * code-split: they are fetched only when a section that shows a chart is opened, so the static
 * portal shell stays small on the CDN.
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

export const AttendanceTrendCard = dynamic(() => import('./ReportCharts').then((m) => m.AttendanceTrendCard), { ssr: false, loading: ChartFallback });
export const BatchAttendanceCard = dynamic(() => import('./ReportCharts').then((m) => m.BatchAttendanceCard), { ssr: false, loading: ChartFallback });
export const SubmissionFunnelCard = dynamic(() => import('./ReportCharts').then((m) => m.SubmissionFunnelCard), { ssr: false, loading: ChartFallback });
export const AssignmentCompletionCard = dynamic(() => import('./ReportCharts').then((m) => m.AssignmentCompletionCard), { ssr: false, loading: ChartFallback });
export const TestAveragesCard = dynamic(() => import('./ReportCharts').then((m) => m.TestAveragesCard), { ssr: false, loading: ChartFallback });
export const SyllabusCoverageCard = dynamic(() => import('./ReportCharts').then((m) => m.SyllabusCoverageCard), { ssr: false, loading: ChartFallback });
export const RegisterBreakdownCard = dynamic(() => import('./ReportCharts').then((m) => m.RegisterBreakdownCard), { ssr: false, loading: ChartFallback });
