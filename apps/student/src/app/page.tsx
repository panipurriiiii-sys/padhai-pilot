'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Search,
  TrendingUp,
  X,
  ShieldCheck,
  LogOut,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Sparkles,
  Download,
  FileText,
  FileCheck,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Globe,
} from 'lucide-react';
import {
  StudentAssessmentResult,
  InAppNotification,
  UserSession,
  StudyMaterialItem,
  StudyMaterialCategory,
} from '@padhai-pilot/shared';
import { studentApi, clearAuthToken } from '../lib/api';

type PortalTab = 'RESULTS' | 'MATERIALS';

const MATERIAL_CATEGORIES: { key: string; label: string }[] = [
  { key: 'ALL', label: 'All Resources' },
  { key: 'CHAPTER_NOTES', label: 'Chapter Notes' },
  { key: 'WORKSHEET', label: 'Daily Worksheets (DPP)' },
  { key: 'FORMULA_SHEET', label: 'Formula Sheets' },
  { key: 'HANDOUT', label: 'Lecture Handouts' },
  { key: 'REVISION_GUIDE', label: 'Revision Guides' },
  { key: 'PRACTICE_PAPER', label: 'Practice Papers' },
];

export default function StudentPortal() {
  const [student, setStudent] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<PortalTab>('RESULTS');
  const [results, setResults] = useState<StudentAssessmentResult[]>([]);
  const [materials, setMaterials] = useState<StudyMaterialItem[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [selectedResult, setSelectedResult] = useState<StudentAssessmentResult | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterialItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedMaterialId, setCopiedMaterialId] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const loadStudentData = async () => {
    setIsLoading(true);
    try {
      const [resList, notifList, matList] = await Promise.all([
        studentApi.getPublishedResults(),
        studentApi.getNotifications(),
        studentApi.getStudyMaterials(),
      ]);
      setResults(resList);
      setNotifications(notifList);
      setMaterials(matList);
    } catch (err) {
      console.error('Failed to load student portal data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const session = studentApi.getStudentSession();
    if (session) {
      setStudent(session);
      loadStudentData();
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) return;

    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await studentApi.login(loginEmail.trim(), loginPassword);
      setStudent(res.user);
      await loadStudentData();
    } catch (err: any) {
      setLoginError(err.message || 'Invalid email or password.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleDemoStudentLogin = async () => {
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await studentApi.loginDemoStudent();
      setStudent(res.user);
      await loadStudentData();
    } catch (err: any) {
      setLoginError(err.message || 'Demo access failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    setStudent(null);
    setResults([]);
    setMaterials([]);
    setNotifications([]);
  };

  const handleMarkNotificationRead = async (id: string) => {
    await studentApi.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  };

  function copyCdnUrl(id: string, url: string) {
    navigator.clipboard.writeText(url);
    setCopiedMaterialId(id);
    setTimeout(() => setCopiedMaterialId(null), 2500);
  }

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const subjects = useMemo(() => {
    const set = new Set<string>();
    results.forEach((r) => set.add(r.subject));
    materials.forEach((m) => set.add(m.subject));
    return ['ALL', ...Array.from(set)];
  }, [results, materials]);

  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const matchSubject = selectedSubject === 'ALL' || r.subject === selectedSubject;
      const matchSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.subject.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSubject && matchSearch;
    });
  }, [results, selectedSubject, searchQuery]);

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchSubject = selectedSubject === 'ALL' || m.subject === selectedSubject;
      const matchCategory =
        selectedCategory === 'ALL' || m.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.chapter && m.chapter.toLowerCase().includes(searchQuery.toLowerCase())) ||
        m.subject.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSubject && matchCategory && matchSearch;
    });
  }, [materials, selectedSubject, selectedCategory, searchQuery]);

  const kpis = useMemo(() => {
    const scoredList = results.filter(
      (r) => r.resultStatus === 'SCORED' && r.percentage !== null && r.percentage !== undefined,
    );
    const avgPercentage =
      scoredList.length > 0
        ? Math.round(
            scoredList.reduce((acc, curr) => acc + (curr.percentage || 0), 0) /
              scoredList.length,
          )
        : 0;

    let overallGrade = '—';
    if (avgPercentage >= 90) overallGrade = 'A+';
    else if (avgPercentage >= 80) overallGrade = 'A';
    else if (avgPercentage >= 70) overallGrade = 'B+';
    else if (avgPercentage >= 60) overallGrade = 'B';
    else if (avgPercentage > 0) overallGrade = 'C';

    return {
      totalTests: results.length,
      avgPercentage,
      overallGrade,
      totalMaterials: materials.length,
    };
  }, [results, materials]);

  // -----------------------------------------------------------------
  // 1. UNAUTHENTICATED STATE
  // -----------------------------------------------------------------
  if (!student) {
    return (
      <div className="min-h-screen bg-[#050608] text-[#F5F7FA] flex flex-col items-center justify-center p-4 selection:bg-[#1677FF]/30">
        <main className="w-full max-w-md bg-[#0A0D12] border border-[#ffffff12] rounded-3xl p-8 shadow-2xl relative overflow-hidden my-auto">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#1677FF]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="relative z-10 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#1677FF] flex items-center justify-center text-white font-bold text-xl mx-auto shadow-[0_0_20px_rgba(22,119,255,0.4)]">
                P
              </div>
              <h1 className="font-['Playfair_Display'] text-2xl font-bold tracking-tight text-[#F5F7FA]">
                Student Academic Portal
              </h1>
              <p className="text-xs text-[#929BAA] font-['Raleway']">
                Access official results, evaluations, and verified study material.
              </p>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#929BAA] mb-1.5 font-['Raleway']">
                  Student Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#929BAA]" />
                  <input
                    type="email"
                    required
                    placeholder="student@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-[#050608] border border-[#ffffff17] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F5F7FA] placeholder-[#929BAA] focus:outline-none focus:border-[#1677FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#929BAA] mb-1.5 font-['Raleway']">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#929BAA]" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-[#050608] border border-[#ffffff17] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F5F7FA] placeholder-[#929BAA] focus:outline-none focus:border-[#1677FF]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 rounded-xl bg-[#1677FF] hover:bg-[#0A6FE8] text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {loginLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-[#ffffff10] text-center">
              <button
                type="button"
                onClick={handleDemoStudentLogin}
                disabled={loginLoading}
                className="inline-flex items-center gap-1.5 text-xs text-[#1677FF] hover:underline font-semibold cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Try Demo Student Account</span>
              </button>
            </div>
          </div>
        </main>

        <footer className="w-full max-w-md pb-6 text-center text-xs text-[#929BAA]">
          PadhaiPilot • Academic Portal
        </footer>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // 2. AUTHENTICATED PORTAL VIEW
  // -----------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#050608] text-[#F5F7FA] font-['Raleway']">
      {/* TOP NAVIGATION BAR */}
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
                {student.instituteName || 'PadhaiPilot Academy'}
              </div>
            </div>
          </div>

          {/* Student Profile & Actions */}
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

              {/* Notification Drawer */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0A0D12] border border-[#ffffff17] rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-[#ffffff12] pb-2 mb-3">
                    <span className="font-['Playfair_Display'] font-bold text-sm text-[#F5F7FA]">
                      Notifications
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
                {student.fullName ? student.fullName.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-[#F5F7FA] leading-tight">
                  {student.fullName}
                </div>
                <div className="text-[10px] text-[#929BAA] font-mono">
                  {student.id.startsWith('usr_') ? 'Student ID' : student.id}
                </div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-[#ffffff0a] hover:bg-rose-950/40 border border-[#ffffff14] hover:border-rose-800/40 text-[#929BAA] hover:text-rose-400 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-6xl mx-auto p-6 md:p-10 space-y-6">
        {/* Banner with Verified Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0A0D12] via-[#0A0D12] to-[#1677FF]/10 p-6 md:p-8 rounded-3xl border border-[#ffffff14] shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1677FF] uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              Verified Student Portal
            </div>
            <h1 className="font-['Playfair_Display'] text-3xl font-bold text-[#F5F7FA] tracking-tight mb-2">
              {activeTab === 'RESULTS' ? 'Assessment Results & Marks' : 'Study Materials & Vault'}
            </h1>
            <p className="text-xs text-[#929BAA] max-w-xl leading-relaxed">
              {activeTab === 'RESULTS'
                ? 'Official classroom test scores, evaluation sheets, and teacher remarks.'
                : 'Verified chapter notes, DPP worksheets, and formula sheets served via high-speed media CDN.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#050608] border border-[#ffffff14] rounded-2xl text-center min-w-[90px]">
              <div className="text-[10px] font-bold text-[#929BAA] uppercase tracking-wider">Student ID</div>
              <div className="font-mono font-bold text-xs text-[#1677FF] mt-0.5 truncate max-w-[120px]">
                {student.id}
              </div>
            </div>
            <div className="p-3 bg-[#050608] border border-[#ffffff14] rounded-2xl text-center min-w-[90px]">
              <div className="text-[10px] font-bold text-[#929BAA] uppercase tracking-wider">Status</div>
              <div className="font-semibold text-xs text-emerald-400 mt-0.5">Enrolled</div>
            </div>
          </div>
        </div>

        {/* PRIMARY TAB SWITCHER */}
        <div className="flex items-center gap-2 border-b border-[#ffffff14] pb-3">
          <button
            onClick={() => setActiveTab('RESULTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'RESULTS'
                ? 'bg-[#1677FF] text-white shadow-md'
                : 'bg-[#ffffff08] text-[#929BAA] hover:text-[#F5F7FA] border border-[#ffffff10]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Test Results & Reports ({results.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('MATERIALS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'MATERIALS'
                ? 'bg-[#1677FF] text-white shadow-md'
                : 'bg-[#ffffff08] text-[#929BAA] hover:text-[#F5F7FA] border border-[#ffffff10]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Study Materials & Notes ({materials.length})</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: RESULTS VIEW                                            */}
        {/* ============================================================== */}
        {activeTab === 'RESULTS' && (
          <div className="space-y-6">
            {/* KPI METRIC CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#0A0D12] p-5 rounded-2xl border border-[#ffffff14] space-y-1">
                <div className="flex items-center justify-between text-[#929BAA]">
                  <span className="text-xs uppercase font-bold tracking-wider">Tests Taken</span>
                  <BookOpen className="w-4 h-4 text-[#1677FF]" />
                </div>
                <div className="font-['Playfair_Display'] text-2xl font-bold text-[#F5F7FA]">
                  {kpis.totalTests}
                </div>
                <div className="text-[11px] text-[#929BAA]">Published tests</div>
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
                <div className="text-[11px] text-[#929BAA]">Grading Scale</div>
              </div>

              <div className="bg-[#0A0D12] p-5 rounded-2xl border border-[#ffffff14] space-y-1">
                <div className="flex items-center justify-between text-[#929BAA]">
                  <span className="text-xs uppercase font-bold tracking-wider">Attendance</span>
                  <CheckCircle2 className="w-4 h-4 text-[#1677FF]" />
                </div>
                <div className="font-['Playfair_Display'] text-2xl font-bold text-[#F5F7FA]">
                  100%
                </div>
                <div className="text-[11px] text-[#929BAA]">Batch Presence</div>
              </div>
            </div>

            {/* FILTER & SEARCH BAR */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0A0D12] p-4 rounded-2xl border border-[#ffffff14]">
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

            {/* PUBLISHED RESULTS LIST */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="bg-[#0A0D12] p-12 rounded-3xl border border-[#ffffff12] text-center text-xs text-[#929BAA]">
                  Loading results...
                </div>
              ) : filteredResults.length === 0 ? (
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
                          <span className="text-xs text-[#929BAA]">• {item.subject}</span>
                        </div>

                        <h3 className="font-['Playfair_Display'] text-base font-bold text-[#F5F7FA] group-hover:text-[#1677FF] transition">
                          {item.title}
                        </h3>

                        {item.feedback && (
                          <p className="text-xs text-[#929BAA] italic line-clamp-1 max-w-xl">
                            &ldquo;{item.feedback}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 self-end md:self-auto">
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="font-mono text-xl font-bold text-[#F5F7FA]">
                              {isAbsent ? 'ABSENT' : item.obtainedMarks !== null ? item.obtainedMarks : '—'}
                            </span>
                            <span className="font-mono text-xs text-[#929BAA]">
                              / {item.maxMarks}
                            </span>
                          </div>

                          {!isAbsent && item.percentage !== null && (
                            <div className="text-xs text-emerald-400 font-mono mt-0.5 font-bold">
                              {item.percentage}% {item.grade ? `(${item.grade})` : ''}
                            </div>
                          )}
                        </div>

                        <ChevronRight className="w-4 h-4 text-[#929BAA] group-hover:text-[#F5F7FA] transition transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: STUDY MATERIALS & NOTES                                 */}
        {/* ============================================================== */}
        {activeTab === 'MATERIALS' && (
          <div className="space-y-6">
            {/* Category and Subject Filter Bar */}
            <div className="space-y-3 bg-[#0A0D12] p-4 rounded-2xl border border-[#ffffff14]">
              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-[#ffffff0a]">
                {MATERIAL_CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      selectedCategory === cat.key
                        ? 'bg-[#1677FF] text-white shadow-md'
                        : 'bg-[#050608] text-[#929BAA] hover:text-[#F5F7FA] border border-[#ffffff12]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Subject Filter & Search Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-[#929BAA] mr-1">Subject:</span>
                  {subjects.map((subj) => (
                    <button
                      key={subj}
                      onClick={() => setSelectedSubject(subj)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        selectedSubject === subj
                          ? 'bg-[#ffffff1a] text-[#F5F7FA] border border-[#1677FF]'
                          : 'bg-[#050608] text-[#929BAA] hover:text-[#F5F7FA] border border-[#ffffff10]'
                      }`}
                    >
                      {subj}
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[240px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#929BAA]" />
                  <input
                    type="text"
                    placeholder="Search chapter, topic, formulas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#050608] border border-[#ffffff17] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#F5F7FA] placeholder-[#929BAA] focus:outline-none focus:border-[#1677FF]"
                  />
                </div>
              </div>
            </div>

            {/* MATERIALS CARDS GRID */}
            {isLoading ? (
              <div className="bg-[#0A0D12] p-12 rounded-3xl border border-[#ffffff12] text-center text-xs text-[#929BAA]">
                Loading study materials...
              </div>
            ) : filteredMaterials.length === 0 ? (
              <div className="bg-[#0A0D12] p-12 rounded-3xl border border-[#ffffff12] text-center space-y-3">
                <FileText className="w-8 h-8 text-[#929BAA] mx-auto" />
                <div className="font-['Playfair_Display'] text-lg font-bold text-[#F5F7FA]">
                  No Study Materials Found
                </div>
                <p className="text-xs text-[#929BAA] max-w-md mx-auto">
                  No notes, DPP worksheets, or revision files found matching the selected filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMaterials.map((mat) => {
                  const formattedDate = new Date(mat.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={mat.id}
                      className="bg-[#0A0D12] hover:bg-[#0E1219] p-5 rounded-2xl border border-[#ffffff14] transition-all hover:border-[#1677FF]/40 flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1677FF]/15 text-[#1677FF] border border-[#1677FF]/30 font-mono">
                            {mat.category.replace(/_/g, ' ')}
                          </span>

                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                            {mat.fileSize || 'PDF'}
                          </span>
                        </div>

                        <h3 className="font-['Playfair_Display'] text-sm font-bold text-[#F5F7FA] leading-snug line-clamp-2">
                          {mat.title}
                        </h3>

                        <p className="text-[11px] text-[#929BAA]">
                          {mat.chapter ? `${mat.chapter} • ` : ''}
                          {mat.subject}
                        </p>

                        {mat.content && (
                          <p className="text-xs text-[#CAD0D9] bg-[#050608] p-2.5 rounded-xl border border-[#ffffff0a] line-clamp-2 leading-relaxed">
                            {mat.content}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-[#ffffff0f] space-y-3">
                        <div className="flex items-center justify-between text-[10px] text-[#929BAA]">
                          <span>{mat.facultyName || 'Faculty'}</span>
                          <span className="font-mono">{formattedDate}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {mat.fileUrl ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  window.open(mat.fileUrl, '_blank', 'noopener,noreferrer');
                                }}
                                className="flex-1 py-2 px-3 rounded-xl bg-[#1677FF] hover:bg-[#0A6FE8] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download / View</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => copyCdnUrl(mat.id, mat.fileUrl!)}
                                title="Copy direct Media CDN URL"
                                className="p-2 rounded-xl bg-[#ffffff0a] hover:bg-[#ffffff14] border border-[#ffffff14] text-[#929BAA] hover:text-[#F5F7FA] transition cursor-pointer"
                              >
                                {copiedMaterialId === mat.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </>
                          ) : (
                            <div className="text-[11px] text-[#929BAA] italic">
                              Text instructions only
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ----------------------------------------------------------------- */}
      {/* RESULT DETAIL MODAL                                               */}
      {/* ----------------------------------------------------------------- */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0A0D12] border border-[#ffffff17] rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedResult(null)}
              className="absolute top-6 right-6 p-1.5 rounded-xl bg-[#ffffff0a] hover:bg-[#ffffff14] text-[#929BAA] hover:text-[#F5F7FA] transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1677FF]/15 text-[#1677FF] border border-[#1677FF]/30 font-mono">
                {selectedResult.category.replace('_', ' ')}
              </span>
              <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#F5F7FA] mt-2">
                {selectedResult.title}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#050608] border border-[#ffffff0a]">
              <div>
                <div className="text-xs text-[#929BAA] uppercase font-bold">Obtained Score</div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono text-2xl font-bold text-[#F5F7FA]">
                    {selectedResult.obtainedMarks !== null ? selectedResult.obtainedMarks : '—'}
                  </span>
                  <span className="font-mono text-xs text-[#929BAA]">
                    / {selectedResult.maxMarks}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#929BAA] uppercase font-bold">Grade & Score</div>
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

            <div className="space-y-2 text-xs font-['Raleway']">
              <div className="flex justify-between py-1.5 border-b border-[#ffffff0a]">
                <span className="text-[#929BAA]">Subject:</span>
                <span className="font-semibold text-[#F5F7FA]">{selectedResult.subject}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#ffffff0a]">
                <span className="text-[#929BAA]">Date:</span>
                <span className="font-mono text-[#F5F7FA]">{selectedResult.assessmentDate}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#ffffff0a]">
                <span className="text-[#929BAA]">Attendance:</span>
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
                <span className="text-[#929BAA]">Status:</span>
                <span className="font-semibold text-[#1677FF]">{selectedResult.resultStatus}</span>
              </div>
            </div>

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
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[#ffffff0a] text-[#F5F7FA] hover:bg-[#ffffff14] border border-[#ffffff14] cursor-pointer"
            >
              Close Result
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
