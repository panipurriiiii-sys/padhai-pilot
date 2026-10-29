'use client';

import React from 'react';
import {
  Clock,
  Users,
  CalendarCheck,
  FileCheck,
  Megaphone,
  ArrowRight,
  BookOpen,
  AlertCircle,
  Plus,
} from 'lucide-react';
import type { TeacherDashboardMetrics } from '@padhai-pilot/shared';
import type { NavTab } from './Sidebar';
import { CountUp } from './ui/CountUp';

interface DashboardViewProps {
  metrics: TeacherDashboardMetrics;
  onNavigate: (tab: NavTab) => void;
  onQuickAttendance: (batchId: string) => void;
}

export function DashboardView({ metrics, onNavigate, onQuickAttendance }: DashboardViewProps) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[var(--border-paper)]">
        <div>
          <div className="text-xs uppercase tracking-wider font-bold mb-1.5 flex items-center gap-2">
            <span className="text-[var(--ink-muted)] font-['Raleway']">Faculty Operations</span>
            <span className="text-[var(--ink-faint)]">•</span>
            <span className="badge-session">Academic Session 2026–27</span>
          </div>
          <h1 className="font-['Playfair_Display'] text-3xl md:text-4xl font-bold text-[var(--ink-primary)] tracking-tight">
            Academic Overview & Schedule
          </h1>
          <p className="text-xs md:text-sm text-[var(--ink-secondary)] mt-1 font-['Raleway']">
            Today is <strong className="font-semibold text-[var(--ink-primary)]">{currentDate}</strong>. You have{' '}
            <span className="text-[var(--brand-electric)] font-bold">{metrics.todayClassesCount} lecture sessions</span> scheduled.
          </p>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => onNavigate('teachingDiary')}
            className="btn-primary"
          >
            <BookOpen className="w-4 h-4" />
            <span>Daily Diary</span>
          </button>
          <button
            onClick={() => onNavigate('attendance')}
            className="btn-secondary"
          >
            <CalendarCheck className="w-4 h-4 text-[var(--brand-electric)]" />
            <span>Mark Attendance</span>
          </button>
          <button
            onClick={() => onNavigate('assignments')}
            className="btn-subtle"
          >
            <Plus className="w-4 h-4 text-[var(--brand-electric)]" />
            <span>New Assignment</span>
          </button>
        </div>
      </div>

      {/* KPI Rail (Data Typography: Inter, Using Global .kpi-card Classes) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1: Today's Classes */}
        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] font-['Raleway']">
              Today&apos;s Classes
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[var(--brand-electric)]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-['Inter'] text-2xl md:text-3xl font-extrabold text-[var(--ink-primary)]">
            <CountUp to={metrics.todayClassesCount} duration={0.8} />
          </div>
          <span className="text-[11px] text-[var(--ink-muted)] mt-1 block font-['Raleway'] font-medium">
            Scheduled for today
          </span>
        </div>

        {/* KPI 2: Pending Attendance */}
        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] font-['Raleway']">
              Pending Attendance
            </span>
            <div
              className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                metrics.pendingAttendanceCount > 0
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="font-['Inter'] text-2xl md:text-3xl font-extrabold text-[var(--ink-primary)]">
            <CountUp to={metrics.pendingAttendanceCount} duration={0.8} />
          </div>
          <span
            className={`text-[11px] mt-1 block font-['Raleway'] font-semibold ${
              metrics.pendingAttendanceCount > 0 ? 'text-amber-700' : 'text-emerald-700'
            }`}
          >
            {metrics.pendingAttendanceCount > 0 ? 'Sessions require submission' : 'All recorded'}
          </span>
        </div>

        {/* KPI 3: Submissions to Grade */}
        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] font-['Raleway']">
              Submissions to Grade
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="font-['Inter'] text-2xl md:text-3xl font-extrabold text-[var(--ink-primary)]">
            <CountUp to={metrics.pendingReviewsCount} duration={0.8} />
          </div>
          <span className="text-[11px] text-[var(--ink-muted)] mt-1 block font-['Raleway'] font-medium">
            Awaiting teacher review
          </span>
        </div>

        {/* KPI 4: Total Students */}
        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] font-['Raleway']">
              Total Students
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-['Inter'] text-2xl md:text-3xl font-extrabold text-[var(--ink-primary)]">
            <CountUp to={metrics.totalStudentsCount} duration={0.8} />
          </div>
          <span className="text-[11px] text-[var(--ink-muted)] mt-1 block font-['Raleway'] font-medium">
            Across {metrics.assignedBatchesCount} batches
          </span>
        </div>
      </div>

      {/* Main Content Grid: Schedule & Noticeboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Today's Classes & Timetable (Span 2) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-['Raleway'] font-bold text-base text-[var(--ink-primary)] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--brand-electric)]" />
              <span>Today&apos;s Class Schedule</span>
            </h2>
            <button
              onClick={() => onNavigate('timetable')}
              className="text-xs text-[var(--brand-electric)] hover:underline font-bold flex items-center gap-1 font-['Raleway']"
            >
              Full Timetable <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {metrics.todaySchedule.length === 0 ? (
              <div className="paper-card p-8 text-center text-[var(--ink-muted)] font-['Raleway'] text-xs">
                No lectures scheduled for today. Check your full timetable for upcoming slots.
              </div>
            ) : (
              metrics.todaySchedule.map((slot) => (
                <div
                  key={slot.id}
                  className="paper-card-interactive p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="recessed-surface px-3 py-2 text-center shrink-0">
                      <span className="font-['Inter'] text-xs font-extrabold text-[var(--brand-electric)] block">
                        {slot.startTime}
                      </span>
                      <span className="font-['Inter'] text-[10px] text-[var(--ink-muted)] block">
                        to {slot.endTime}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-[var(--ink-primary)] font-['Raleway']">
                        {slot.batchName}
                      </h3>
                      <p className="text-xs text-[var(--ink-secondary)] mt-0.5 flex items-center gap-2 font-['Raleway']">
                        <span className="font-semibold text-[var(--ink-primary)]">{slot.subject}</span>
                        <span className="text-[var(--ink-faint)]">•</span>
                        <span>{slot.room}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onQuickAttendance(slot.batchId)}
                    className="btn-subtle"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>Take Attendance</span>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Assigned Batches Summary */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-['Raleway'] font-bold text-base text-[var(--ink-primary)] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[var(--brand-electric)]" />
                <span>Assigned Batches ({metrics.activeBatches.length})</span>
              </h2>
              <button
                onClick={() => onNavigate('batches')}
                className="text-xs text-[var(--brand-electric)] hover:underline font-bold flex items-center gap-1 font-['Raleway']"
              >
                Manage Rosters <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {metrics.activeBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="paper-card p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="badge-code">
                      {batch.code}
                    </span>
                    <span className="font-['Inter'] text-xs font-semibold text-[var(--ink-secondary)]">
                      {batch.studentCount} Students
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[var(--ink-primary)] truncate font-['Raleway']">
                    {batch.name}
                  </h4>
                  <p className="text-xs text-[var(--ink-muted)] mt-1 font-['Raleway']">{batch.subject}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Announcements & Operational Noticeboard */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-['Raleway'] font-bold text-base text-[var(--ink-primary)] flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[var(--brand-electric)]" />
              <span>Announcements</span>
            </h2>
            <button
              onClick={() => onNavigate('announcements')}
              className="text-xs text-[var(--brand-electric)] hover:underline font-bold flex items-center gap-1 font-['Raleway']"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {metrics.recentAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="paper-card-interactive p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={
                      ann.priority === 'URGENT'
                        ? 'badge-urgent'
                        : 'badge-code'
                    }
                  >
                    {ann.priority}
                  </span>
                  <span className="text-[11px] text-[var(--ink-muted)] font-mono">
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[var(--ink-primary)] leading-snug font-['Raleway']">
                  {ann.title}
                </h4>
                <p className="text-xs text-[var(--ink-secondary)] leading-relaxed line-clamp-3 font-['Raleway']">
                  {ann.content}
                </p>
                <div className="pt-1 text-[11px] text-[var(--ink-muted)] font-['Raleway']">
                  By <strong className="text-[var(--ink-secondary)]">{ann.authorName}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
