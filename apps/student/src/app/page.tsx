'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Filter,
  GraduationCap,
  Layers,
  Search,
  TrendingUp,
  X,
  FileText,
  User,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { StudentAssessmentResult, InAppNotification, UserSession } from '@padhai-pilot/shared';
import { studentApi } from '../lib/api';

export default function StudentPortal() {
  const [student, setStudent] = useState<UserSession>(studentApi.getStudentSession());
  const [results, setResults] = useState<StudentAssessmentResult[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [selectedResult, setSelectedResult] = useState<StudentAssessmentResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [resList, notifList] = await Promise.all([
          studentApi.getPublishedResults(),
          studentApi.getNotifications(),
        ]);
        setResults(resList);
        setNotifications(notifList);
      } catch (err) {
        console.error('Failed to load student portal data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const subjects = useMemo(() => {
    const set = new Set<string>();
    results.forEach((r) => set.add(r.subject));
    return ['ALL', ...Array.from(set)];
  }, [results]);

  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const matchSubject = selectedSubject === 'ALL' || r.subject === selectedSubject;
      const matchSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.subject.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSubject && matchSearch;
    });
  }, [results, selectedSubject, searchQuery]);

  const kpis = useMemo(() => {
    const scoredList = results.filter(
      (r) => r.resultStatus === 'SCORED' && r.percentage !== null && r.percentage !== undefined,
    );
    const avgPercentage =
      scoredList.length > 0
        ? Math.round(
            (scoredList.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / scoredList.length) * 10,
          ) / 10
        : 0;

    let overallGrade = '—';
    if (avgPercentage >= 90) overallGrade = 'A+';
    else if (avgPercentage >= 80) overallGrade = 'A';
    else if (avgPercentage >= 70) overallGrade = 'B+';
    else if (avgPercentage >= 60) overallGrade = 'B';
    else if (avgPercentage >= 50) overallGrade = 'C';
    else if (avgPercentage >= 40) overallGrade = 'D';

    return {
      totalTests: results.length,
      scoredCount: scoredList.length,
      avgPercentage,
      overallGrade,
    };
  }, [results]);

  const handleMarkNotificationRead = async (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n)),
    );
    await studentApi.markNotificationRead(notifId);
  };

  return (
    <div className="min-h-screen bg-[#050608] text-[#F5F7FA] font-['Raleway']">
      {/* ------------------------------------------------------------- */}
      {/* TOP NAVIGATION BAR                                            */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-[#0A0D12]/90 backdrop-blur-md border-b border-[#ffffff12] px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1677FF] flex items-center justify-center text-white font-bold text-sm shadow-[0_0_12px_rgba(22,119,255,0.4)]">
              P
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Playfair_Display'] font-bold text-lg text-[#F5F7FA]">
                  PadhaiPilot
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#1677FF]/15 text-[#1677FF] border border-[#1677FF]/30">
                  Student
                </span>
              </div>
              <div className="text-[11px] text-[#929BAA] font-['Raleway']">
                Apex IIT-JEE & Medical Academy
              </div>
            </div>
          </div>

          {/* Student Profile & Notifications Header Actions */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl bg-[#ffffff0a] hover:bg-[#ffffff14] border border-[#ffffff14] text-[#F5F7FA] transition-all cursor-pointer"
              >
                <Bell className="w-4 h-4 text-[#929BAA]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#1677FF] text-white text-[9px] font-bold flex items-center justify-center font-mono animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Drawer Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0A0D12] border border-[#ffffff17] rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-[#ffffff12] pb-2 mb-3">
                    <span className="font-['Playfair_Display'] font-bold text-sm text-[#F5F7FA]">
                      In-App Notifications
                    </span>
                    <span className="text-[11px] text-[#1677FF] font-semibold font-mono">
                      {unreadCount} unread
                    </span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-[#929BAA]">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleMarkNotificationRead(notif.id)}
                          className={`p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                            !notif.isRead
                              ? 'bg-[#1677FF]/10 border-[#1677FF]/30 text-[#F5F7FA]'
                              : 'bg-[#050608] border-[#ffffff0a] text-[#929BAA]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-[#F5F7FA]">{notif.title}</span>
                            {!notif.isRead && (
                              <span className="w-2 h-2 rounded-full bg-[#1677FF]"></span>
                            )}
                          </div>
                          <p className="text-[11px] leading-relaxed">{notif.message}</p>
                          <div className="text-[10px] text-[#929BAA] mt-1 font-mono">
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Student ID Card Tag */}
            <div className="flex items-center gap-2.5 bg-[#ffffff08] border border-[#ffffff12] px-3 py-1.5 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-[#1677FF]/20 flex items-center justify-center text-[#1677FF] font-bold text-xs">
                A
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-[#F5F7FA] leading-tight">
                  {student.fullName}
                </div>
                <div className="text-[10px] text-[#929BAA] font-mono">APX-2026-001</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTENT AREA                                             */}
      {/* ------------------------------------------------------------- */}
      <main className="max-w-6xl mx-auto p-6 md:p-10 space-y-8">
        {/* Banner with Verified Academic Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0A0D12] via-[#0A0D12] to-[#1677FF]/10 p-6 md:p-8 rounded-3xl border border-[#ffffff14] shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1677FF] uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              Verified Academic Portal
            </div>
            <h1 className="font-['Playfair_Display'] text-3xl font-bold text-[#F5F7FA] tracking-tight mb-2">
              My Assessment Results & Grades
            </h1>
            <p className="text-xs text-[#929BAA] max-w-xl leading-relaxed">
              Official classroom test marks, evaluation sheets, and teacher remarks. Real-time synchronisation with faculty evaluations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#050608] border border-[#ffffff14] rounded-2xl text-center min-w-[90px]">
              <div className="text-[10px] font-bold text-[#929BAA] uppercase tracking-wider">Roll No</div>
              <div className="font-mono font-bold text-sm text-[#1677FF] mt-0.5">APX-2026-001</div>
            </div>
            <div className="p-3 bg-[#050608] border border-[#ffffff14] rounded-2xl text-center min-w-[90px]">
              <div className="text-[10px] font-bold text-[#929BAA] uppercase tracking-wider">Class</div>
              <div className="font-semibold text-xs text-[#F5F7FA] mt-0.5">Class 12 JEE</div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* KPI METRIC CARDS                                              */}
        {/* ------------------------------------------------------------- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0A0D12] p-5 rounded-2xl border border-[#ffffff14] space-y-1">
            <div className="flex items-center justify-between text-[#929BAA]">
              <span className="text-xs uppercase font-bold tracking-wider">Tests Taken</span>
              <BookOpen className="w-4 h-4 text-[#1677FF]" />
            </div>
            <div className="font-['Playfair_Display'] text-2xl font-bold text-[#F5F7FA]">
              {kpis.totalTests}
            </div>
            <div className="text-[11px] text-[#929BAA]">Published Assessments</div>
          </div>

          <div className="bg-[#0A0D12] p-5 rounded-2xl border border-[#ffffff14] space-y-1">
            <div className="flex items-center justify-between text-[#929BAA]">
              <span className="text-xs uppercase font-bold tracking-wider">Average Score</span>
              <TrendingUp className="w-4 h-4 text-[#10B981]" />
            </div>
            <div className="font-['Playfair_Display'] text-2xl font-bold text-[#10B981]">
              {kpis.avgPercentage}%
            </div>
            <div className="text-[11px] text-[#929BAA]">Across evaluated tests</div>
          </div>

          <div className="bg-[#0A0D12] p-5 rounded-2xl border border-[#ffffff14] space-y-1">
            <div className="flex items-center justify-between text-[#929BAA]">
              <span className="text-xs uppercase font-bold tracking-wider">Overall Grade</span>
              <Award className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <div className="font-['Playfair_Display'] text-2xl font-bold text-[#F59E0B]">
              {kpis.overallGrade}
            </div>
            <div className="text-[11px] text-[#929BAA]">Standard Grading Scale</div>
          </div>

          <div className="bg-[#0A0D12] p-5 rounded-2xl border border-[#ffffff14] space-y-1">
            <div className="flex items-center justify-between text-[#929BAA]">
              <span className="text-xs uppercase font-bold tracking-wider">Attendance</span>
              <CheckCircle2 className="w-4 h-4 text-[#1677FF]" />
            </div>
            <div className="font-['Playfair_Display'] text-2xl font-bold text-[#F5F7FA]">
              100%
            </div>
            <div className="text-[11px] text-[#929BAA]">Session presence rate</div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* FILTER & SEARCH BAR                                           */}
        {/* ------------------------------------------------------------- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0A0D12] p-4 rounded-2xl border border-[#ffffff14]">
          {/* Subject Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {subjects.map((subj) => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedSubject === subj
                    ? 'bg-[#1677FF] text-white shadow-md'
                    : 'bg-[#050608] text-[#929BAA] hover:text-[#F5F7FA] border border-[#ffffff12]'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#929BAA]" />
            <input
              type="text"
              placeholder="Search assessment name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#050608] border border-[#ffffff17] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#F5F7FA] placeholder-[#929BAA] focus:outline-none focus:border-[#1677FF]"
            />
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* PUBLISHED RESULTS LIST                                        */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-4">
          {filteredResults.length === 0 ? (
            <div className="bg-[#0A0D12] p-12 rounded-3xl border border-[#ffffff12] text-center space-y-3">
              <BookOpen className="w-8 h-8 text-[#929BAA] mx-auto" />
              <div className="font-['Playfair_Display'] text-lg font-bold text-[#F5F7FA]">
                No Results Published Yet
              </div>
              <p className="text-xs text-[#929BAA] max-w-md mx-auto">
                Your teachers have not published any marks under this filter yet. When tests are evaluated and released, they will appear here automatically.
              </p>
            </div>
          ) : (
            filteredResults.map((item) => {
              const isAbsent = item.resultStatus === 'ABSENT';

              return (
                <div
                  key={item.markId}
                  onClick={() => setSelectedResult(item)}
                  className="bg-[#0A0D12] hover:bg-[#0E1219] p-5 rounded-2xl border border-[#ffffff14] transition-all hover:border-[#1677FF]/40 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1677FF]/15 text-[#1677FF] border border-[#1677FF]/30 font-mono">
                        {item.category.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-[#929BAA] flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.assessmentDate}
                      </span>
                    </div>

                    <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#F5F7FA] group-hover:text-[#1677FF] transition-colors">
                      {item.title}
                    </h3>
                    <div className="text-xs text-[#929BAA] flex items-center gap-3">
                      <span>Subject: <strong className="text-[#F5F7FA] font-medium">{item.subject}</strong></span>
                      {item.feedback && (
                        <span className="hidden sm:inline italic text-[#C3CAD6]">
                          &ldquo;{item.feedback.slice(0, 50)}...&rdquo;
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Marks & Grade Display */}
                  <div className="flex items-center gap-6">
                    {isAbsent ? (
                      <div className="text-right">
                        <div className="text-sm font-bold text-[#EF4444]">Absent</div>
                        <div className="text-[10px] text-[#929BAA]">Makeup Required</div>
                      </div>
                    ) : (
                      <div className="text-right">
                        <div className="font-mono text-xl font-bold text-[#F5F7FA]">
                          {item.obtainedMarks}{' '}
                          <span className="text-xs text-[#929BAA] font-normal">/ {item.maxMarks}</span>
                        </div>
                        <div className="text-xs font-mono font-semibold text-[#10B981]">
                          {item.percentage}%
                        </div>
                      </div>
                    )}

                    {/* Grade Pill */}
                    <div className="w-12 text-center">
                      {item.grade ? (
                        <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                          {item.grade}
                        </span>
                      ) : (
                        <span className="text-xs text-[#929BAA]">—</span>
                      )}
                    </div>

                    <ChevronRight className="w-5 h-5 text-[#929BAA] group-hover:text-[#1677FF] group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* RESULT DETAIL MODAL                                           */}
      {/* ------------------------------------------------------------- */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A0D12] border border-[#ffffff1a] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#ffffff14] pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#1677FF] font-mono tracking-wider">
                  Verified Result Card
                </span>
                <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#F5F7FA]">
                  {selectedResult.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedResult(null)}
                className="text-[#929BAA] hover:text-[#F5F7FA] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Showcase */}
            <div className="bg-[#050608] p-5 rounded-2xl border border-[#ffffff12] flex items-center justify-between">
              <div>
                <div className="text-xs text-[#929BAA] uppercase font-bold">Obtained Marks</div>
                <div className="font-mono text-3xl font-bold text-[#F5F7FA] mt-0.5">
                  {selectedResult.obtainedMarks ?? 'N/A'}{' '}
                  <span className="text-sm font-normal text-[#929BAA]">/ {selectedResult.maxMarks}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#929BAA] uppercase font-bold">Grade & Percentage</div>
                <div className="flex items-center gap-2 mt-1 justify-end">
                  <span className="font-mono text-lg font-bold text-[#10B981]">
                    {selectedResult.percentage !== null ? `${selectedResult.percentage}%` : '—'}
                  </span>
                  {selectedResult.grade && (
                    <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                      {selectedResult.grade}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Assessment Meta List */}
            <div className="space-y-2 text-xs font-['Raleway']">
              <div className="flex justify-between py-1.5 border-b border-[#ffffff0a]">
                <span className="text-[#929BAA]">Subject:</span>
                <span className="font-semibold text-[#F5F7FA]">{selectedResult.subject}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#ffffff0a]">
                <span className="text-[#929BAA]">Assessment Date:</span>
                <span className="font-mono text-[#F5F7FA]">{selectedResult.assessmentDate}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#ffffff0a]">
                <span className="text-[#929BAA]">Attendance Record:</span>
                <span
                  className={`font-bold ${
                    selectedResult.attendanceStatus === 'PRESENT'
                      ? 'text-[#10B981]'
                      : 'text-[#EF4444]'
                  }`}
                >
                  {selectedResult.attendanceStatus}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#ffffff0a]">
                <span className="text-[#929BAA]">Result Status:</span>
                <span className="font-semibold text-[#1677FF]">{selectedResult.resultStatus}</span>
              </div>
            </div>

            {/* Teacher Feedback / Remarks */}
            {selectedResult.feedback && (
              <div className="p-4 rounded-xl bg-[#1677FF]/10 border border-[#1677FF]/25 text-xs">
                <div className="font-semibold text-[#1677FF] mb-1">Teacher Remarks:</div>
                <p className="text-[#F5F7FA] italic leading-relaxed">
                  &ldquo;{selectedResult.feedback}&rdquo;
                </p>
              </div>
            )}

            <button
              onClick={() => setSelectedResult(null)}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[#ffffff0a] text-[#F5F7FA] hover:bg-[#ffffff14] border border-[#ffffff14]"
            >
              Close Result
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
