'use client';

import React from 'react';
import { BarChart3, TrendingUp, Users, CheckCircle, Clock } from 'lucide-react';
import type { TeacherReports } from '@padhai-pilot/shared';

interface ReportsViewProps {
  reports: TeacherReports;
}

export function ReportsView({ reports }: ReportsViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-4 border-b border-[#E3DFD9]">
        <h1 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-bold text-stone-900">
          Academic Performance & Analytics
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1 font-['Raleway']">
          Track multi-batch attendance trajectories, assignment submission turnaround, and evaluation backlog.
        </p>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#E3DFD9]">
          <div className="flex items-center justify-between text-stone-500 mb-1.5 text-xs">
            <span className="font-semibold uppercase tracking-wider">Avg Attendance</span>
            <TrendingUp className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="font-['Inter'] text-2xl font-bold text-[#10B981]">
            {reports.summary.averageClassAttendance}
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">Consistent over last 4 weeks</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E3DFD9]">
          <div className="flex items-center justify-between text-stone-500 mb-1.5 text-xs">
            <span className="font-semibold uppercase tracking-wider">Total Evaluated</span>
            <CheckCircle className="w-4 h-4 text-[#1677FF]" />
          </div>
          <div className="font-['Inter'] text-2xl font-bold text-stone-900">
            {reports.submissionMetrics.gradedCount}
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">
            {reports.submissionMetrics.submittedCount} submissions received
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E3DFD9]">
          <div className="flex items-center justify-between text-stone-500 mb-1.5 text-xs">
            <span className="font-semibold uppercase tracking-wider">Grading Backlog</span>
            <Clock className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="font-['Inter'] text-2xl font-bold text-[#F59E0B]">
            {reports.submissionMetrics.pendingReviewCount}
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">Requiring review</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E3DFD9]">
          <div className="flex items-center justify-between text-stone-500 mb-1.5 text-xs">
            <span className="font-semibold uppercase tracking-wider">Tests Administered</span>
            <BarChart3 className="w-4 h-4 text-[#00B7D7]" />
          </div>
          <div className="font-['Inter'] text-2xl font-bold text-stone-900">
            {reports.summary.totalTestsConducted}
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">Objective & subjective quizzes</span>
        </div>
      </div>

      {/* Attendance Trends Bar Visualization */}
      <div className="p-5 rounded-xl bg-white border border-[#E3DFD9] space-y-4">
        <h3 className="font-['Raleway'] font-bold text-sm text-stone-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#1677FF]" />
          <span>Attendance Rate Trajectory (Last 4 Weeks)</span>
        </h3>

        <div className="grid grid-cols-4 gap-3 pt-2">
          {reports.attendanceTrends.map((trend, idx) => (
            <div key={idx} className="space-y-2">
              <div className="h-28 rounded-lg bg-[#FAF8F5] border border-[#E3DFD9] flex flex-col justify-end p-2 relative overflow-hidden">
                <div
                  className="w-full rounded bg-[#1677FF] transition-all duration-500 shadow-[0_0_12px_rgba(22,119,255,0.3)]"
                  style={{ height: `${trend.rate}%` }}
                />
              </div>
              <div className="text-center font-['Inter']">
                <span className="text-xs font-bold text-stone-900 block">{trend.rate}%</span>
                <span className="text-[10px] text-stone-500 block">{trend.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparative Batch Performance Table */}
      <div className="rounded-xl bg-white border border-[#E3DFD9] overflow-hidden text-xs">
        <div className="p-4 border-b border-[#E3DFD9] bg-[#FAF8F5] flex items-center justify-between">
          <span className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
            Batch-Level Academic Performance
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E3DFD9] text-stone-500 text-[10px] uppercase font-semibold bg-[#FAF8F5]">
                <th className="py-3 px-4">Batch Name</th>
                <th className="py-3 px-4">Batch Code</th>
                <th className="py-3 px-4 text-center">Enrollment</th>
                <th className="py-3 px-4 text-center">Average Attendance</th>
                <th className="py-3 px-4 text-right">Assignment Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ffffff08] font-['Raleway']">
              {reports.batchPerformance.map((b, i) => (
                <tr key={i} className="hover:bg-[#F3EFE9]/60 transition">
                  <td className="py-3 px-4 font-semibold text-stone-900">{b.batchName}</td>
                  <td className="py-3 px-4 font-['Inter'] font-mono text-[#1677FF]">{b.code}</td>
                  <td className="py-3 px-4 text-center font-['Inter']">{b.studentCount} Students</td>
                  <td className="py-3 px-4 text-center font-['Inter'] font-bold text-[#10B981]">
                    {b.averageAttendance}%
                  </td>
                  <td className="py-3 px-4 text-right font-['Inter'] font-bold text-stone-900">
                    {b.assignmentTurnaround}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

