'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  Share2,
  Eye,
  Plus,
  Search,
  ExternalLink,
  Users,
  Building,
  Lock,
  ChevronRight,
  Bookmark,
  FileCheck2,
} from 'lucide-react';
import { teacherApi } from '../lib/api';
import type {
  DailyTeachingDiaryEntry,
  TeachingDiaryOverview,
  BatchSummary,
  TeachingDiaryAudience,
  CreateTeachingDiaryDto,
} from '@padhai-pilot/shared';

interface DailyTeachingDiaryViewProps {
  batches: BatchSummary[];
  teacherName?: string;
  instituteName?: string;
}

export function DailyTeachingDiaryView({
  batches,
  teacherName = 'Faculty Member',
  instituteName = 'PadhaiPilot Academy',
}: DailyTeachingDiaryViewProps) {
  const [diaries, setDiaries] = useState<DailyTeachingDiaryEntry[]>([]);
  const [overview, setOverview] = useState<TeachingDiaryOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'journal' | 'newEntry' | 'coverage'>('journal');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewEntry, setPreviewEntry] = useState<DailyTeachingDiaryEntry | null>(null);

  // New Entry Form State
  const [formData, setFormData] = useState<CreateTeachingDiaryDto>({
    batchId: batches[0]?.id || '',
    lessonDate: new Date().toISOString().split('T')[0],
    sessionTime: '09:00 - 10:00',
    subject: batches[0]?.subject || '',
    chapterTitle: '',
    conceptsTaught: '',
    learningObjectives: '',
    teachingMethods: 'LECTURE & PROBLEM_SOLVING',
    durationMinutes: 90,
    homeworkAssigned: '',
    referenceLinks: [''],
    followUpPlan: '',
    audience: 'BATCH',
    status: 'PUBLISHED',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedBatchFilter]);

  async function loadData() {
    setIsLoading(true);
    try {
      const batchParam = selectedBatchFilter === 'ALL' ? undefined : selectedBatchFilter;
      const [list, stats] = await Promise.all([
        teacherApi.getDiaries(batchParam),
        teacherApi.getDiariesOverview(),
      ]);
      setDiaries(list);
      setOverview(stats);
      if (list.length > 0 && !previewEntry) {
        setPreviewEntry(list[0]);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handlePrefillToday() {
    const todayBatch = batches[0];
    if (todayBatch) {
      setFormData((prev) => ({
        ...prev,
        batchId: todayBatch.id,
        lessonDate: new Date().toISOString().split('T')[0],
        sessionTime: '09:00 - 10:30',
        subject: todayBatch.subject,
        chapterTitle: 'Definite Integration & Leibniz Integral Rule',
        conceptsTaught: 'Properties of definite integrals, Leibniz differentiation under integral sign, and symmetric bounds.',
        learningObjectives: 'Students should master applying Leibniz theorem to multi-step JEE Advanced questions.',
        teachingMethods: 'Interactive derivation with 4 live problem models.',
        durationMinutes: 90,
        homeworkAssigned: 'Solve Advanced DPP #14: Questions 1 to 18; verify symmetric bounds.',
        referenceLinks: ['https://mathworld.wolfram.com/LeibnizIntegralRule.html'],
        followUpPlan: 'Evaluate double integrals & area under curves in next lecture.',
        audience: 'BATCH',
        status: 'PUBLISHED',
      }));
      setSuccessToast("Pre-filled lesson details from today's scheduled timetable slot!");
      setTimeout(() => setSuccessToast(null), 3500);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.chapterTitle.trim() || !formData.conceptsTaught.trim()) {
      alert('Please fill in the Chapter Title and Concepts Taught.');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanLinks = (formData.referenceLinks || []).filter((l) => l.trim().length > 0);
      const newDiary = await teacherApi.createDiary({
        ...formData,
        referenceLinks: cleanLinks,
      });

      setDiaries((prev) => [newDiary, ...prev]);
      setPreviewEntry(newDiary);
      setActiveTab('journal');
      setSuccessToast(`Lesson Journal entry published for ${newDiary.batchName}!`);
      setTimeout(() => setSuccessToast(null), 4000);

      // Reset form
      setFormData((prev) => ({
        ...prev,
        chapterTitle: '',
        conceptsTaught: '',
        learningObjectives: '',
        homeworkAssigned: '',
        followUpPlan: '',
      }));
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredDiaries = diaries.filter((d) => {
    if (selectedBatchFilter !== 'ALL' && d.batchId !== selectedBatchFilter) return false;
    if (
      searchQuery &&
      !d.chapterTitle.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !d.conceptsTaught.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !d.subject.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-['Raleway'] font-bold text-xs shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--border-paper)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-['Raleway'] font-bold uppercase tracking-widest text-[var(--brand-electric)]">
              Academic Operations & Curriculum Tracking
            </span>
            <span className="badge-code font-['Inter'] text-[10px]">VERIFIED LOG</span>
          </div>
          <h1 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold tracking-tight text-[var(--ink-primary)] mt-1">
            Daily Teaching Diary
          </h1>
          <p className="font-['Raleway'] text-xs text-[var(--ink-muted)] mt-1">
            Authoritative lesson journal for faculty, coaching owners, and enrolled student batches.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('journal')}
            className={`px-3.5 py-2 rounded-xl text-xs font-['Raleway'] font-bold transition-all ${
              activeTab === 'journal' ? 'btn-primary' : 'btn-subtle'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 inline mr-1.5" />
            Classroom Journal
          </button>
          <button
            onClick={() => setActiveTab('newEntry')}
            className={`px-3.5 py-2 rounded-xl text-xs font-['Raleway'] font-bold transition-all ${
              activeTab === 'newEntry' ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            <Plus className="w-3.5 h-3.5 inline mr-1.5" />
            New Lesson Entry
          </button>
          <button
            onClick={() => setActiveTab('coverage')}
            className={`px-3.5 py-2 rounded-xl text-xs font-['Raleway'] font-bold transition-all ${
              activeTab === 'coverage' ? 'btn-primary' : 'btn-subtle'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 inline mr-1.5" />
            Syllabus Coverage
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="kpi-card">
            <span className="text-[11px] font-['Raleway'] font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
              Lessons Logged This Month
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-['Inter'] text-2xl font-bold text-[var(--ink-primary)]">
                {overview.totalEntriesThisMonth}
              </span>
              <span className="text-[10px] font-['Raleway'] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                100% on schedule
              </span>
            </div>
          </div>

          <div className="kpi-card">
            <span className="text-[11px] font-['Raleway'] font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
              Active Batches Covered
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-['Inter'] text-2xl font-bold text-[var(--ink-primary)]">
                {overview.batchesCovered}
              </span>
              <span className="text-[10px] font-['Inter'] text-[var(--ink-muted)]">of {batches.length} assigned</span>
            </div>
          </div>

          <div className="kpi-card">
            <span className="text-[11px] font-['Raleway'] font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
              Reporting Faculty Members
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-['Inter'] text-2xl font-bold text-[var(--brand-electric)]">
                {overview.activeFacultyCount}
              </span>
              <span className="text-[10px] font-['Raleway'] text-[var(--ink-muted)]">Active today</span>
            </div>
          </div>

          <div className="kpi-card">
            <span className="text-[11px] font-['Raleway'] font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
              Batch Audience Visibility
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-['Inter'] text-2xl font-bold text-emerald-800">
                Live
              </span>
              <span className="text-[10px] font-['Raleway'] text-[var(--ink-muted)]">Synced to Student Portal</span>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 1: JOURNAL ROSTER & PREVIEW */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'journal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Filterable Journal Entries List (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Filters Bar */}
            <div className="paper-card p-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-[var(--ink-muted)] shrink-0 ml-1" />
                <input
                  type="text"
                  placeholder="Search chapters, concepts, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-0 text-xs font-['Raleway'] text-[var(--ink-primary)] focus:outline-none placeholder:text-[var(--ink-faint)]"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedBatchFilter}
                  onChange={(e) => setSelectedBatchFilter(e.target.value)}
                  className="select-paper text-xs py-1.5 px-2.5 font-['Raleway']"
                >
                  <option value="ALL">All Batches</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Entries Roster */}
            {isLoading ? (
              <div className="paper-card p-12 text-center text-xs font-['Raleway'] text-[var(--ink-muted)]">
                Loading lesson journal entries...
              </div>
            ) : filteredDiaries.length === 0 ? (
              <div className="paper-card p-12 text-center space-y-3">
                <BookOpen className="w-8 h-8 text-[var(--ink-faint)] mx-auto" />
                <p className="font-['Raleway'] font-bold text-sm text-[var(--ink-primary)]">
                  No lesson journal entries found
                </p>
                <p className="font-['Raleway'] text-xs text-[var(--ink-muted)] max-w-sm mx-auto">
                  Start logging your daily lectures to keep coaching owners informed and give students instant visibility.
                </p>
                <button
                  onClick={() => setActiveTab('newEntry')}
                  className="btn-primary text-xs font-['Raleway'] font-bold px-4 py-2 mt-2"
                >
                  Create First Entry
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDiaries.map((entry) => {
                  const isSelected = previewEntry?.id === entry.id;
                  const formattedDate = new Date(entry.lessonDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={entry.id}
                      onClick={() => setPreviewEntry(entry)}
                      className={`paper-card p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[var(--brand-electric)] shadow-[0_2px_12px_rgba(22,119,255,0.18)] bg-[var(--bg-paper)]'
                          : 'hover:border-stone-400 bg-[var(--bg-paper-warm)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="badge-code font-['Inter'] text-[10px]">
                              {entry.batchCode}
                            </span>
                            <span className="font-['Inter'] text-xs font-semibold text-[var(--ink-muted)]">
                              {formattedDate}
                            </span>
                            {entry.sessionTime && (
                              <span className="font-['Inter'] text-[11px] text-[var(--ink-muted)] flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[var(--brand-electric)]" />
                                {entry.sessionTime}
                              </span>
                            )}
                          </div>

                          <h3 className="font-['Playfair_Display'] font-bold text-sm text-[var(--ink-primary)] truncate">
                            {entry.chapterTitle}
                          </h3>
                          <p className="font-['Raleway'] text-xs text-[var(--ink-secondary)] line-clamp-2 mt-1 leading-relaxed">
                            {entry.conceptsTaught}
                          </p>

                          {entry.homeworkAssigned && (
                            <div className="mt-2.5 flex items-center gap-2 text-[11px] font-['Raleway'] text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                              <Bookmark className="w-3 h-3 text-amber-700 shrink-0" />
                              <span className="truncate">
                                <strong>HW:</strong> {entry.homeworkAssigned}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Audience Pill */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-['Raleway'] font-bold uppercase tracking-wider ${
                              entry.audience === 'BATCH'
                                ? 'bg-blue-50 text-[var(--brand-electric)] border border-blue-200'
                                : entry.audience === 'OWNER_ONLY'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-stone-100 text-stone-600 border border-stone-200'
                            }`}
                          >
                            {entry.audience === 'BATCH'
                              ? 'Batch Visible'
                              : entry.audience === 'OWNER_ONLY'
                              ? 'Owner Only'
                              : 'Draft'}
                          </span>
                          <span className="font-['Inter'] text-[10px] text-[var(--ink-faint)]">
                            {entry.durationMinutes} mins
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Branded Journal Inspector Card (5 cols) */}
          <div className="lg:col-span-5">
            {previewEntry ? (
              <div className="paper-card p-6 sticky top-6 space-y-5 bg-[var(--bg-paper)] shadow-md">
                {/* Tuition Header Stamp */}
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-paper)]">
                  <div>
                    <span className="font-['Playfair_Display'] font-bold text-base text-[var(--ink-primary)]">
                      {instituteName}
                    </span>
                    <p className="font-['Raleway'] text-[10px] text-[var(--ink-muted)]">
                      Official Academic Record • PadhaiPilot Lesson Journal
                    </p>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-[var(--brand-electric)] flex items-center justify-center text-white font-['Playfair_Display'] font-bold text-xs shadow-sm">
                    P
                  </div>
                </div>

                {/* Meta details */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-paper)] text-xs font-['Raleway']">
                  <div>
                    <span className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider block font-semibold">
                      Batch / Class
                    </span>
                    <span className="font-bold text-[var(--ink-primary)] truncate block mt-0.5">
                      {previewEntry.batchName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider block font-semibold">
                      Faculty In Charge
                    </span>
                    <span className="font-bold text-[var(--ink-primary)] truncate block mt-0.5">
                      {previewEntry.facultyName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider block font-semibold">
                      Date & Slot
                    </span>
                    <span className="font-['Inter'] font-semibold text-[var(--ink-primary)] block mt-0.5">
                      {new Date(previewEntry.lessonDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      • {previewEntry.sessionTime || 'Regular'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider block font-semibold">
                      Class Duration
                    </span>
                    <span className="font-['Inter'] font-semibold text-[var(--ink-primary)] block mt-0.5">
                      {previewEntry.durationMinutes} Minutes
                    </span>
                  </div>
                </div>

                {/* Chapter & Concepts */}
                <div>
                  <span className="text-[10px] font-['Raleway'] font-bold uppercase tracking-wider text-[var(--brand-electric)]">
                    Chapter & Subject
                  </span>
                  <h4 className="font-['Playfair_Display'] font-bold text-lg text-[var(--ink-primary)] mt-0.5">
                    {previewEntry.chapterTitle}
                  </h4>
                  <p className="font-['Raleway'] text-xs text-[var(--ink-muted)] font-medium">
                    {previewEntry.subject}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-['Raleway'] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                    Concepts & Topics Taught
                  </span>
                  <p className="font-['Raleway'] text-xs text-[var(--ink-secondary)] mt-1.5 leading-relaxed bg-[var(--bg-paper-warm)] p-3 rounded-xl border border-[var(--border-paper)] whitespace-pre-wrap">
                    {previewEntry.conceptsTaught}
                  </p>
                </div>

                {previewEntry.learningObjectives && (
                  <div>
                    <span className="text-[10px] font-['Raleway'] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                      Learning Objectives
                    </span>
                    <p className="font-['Raleway'] text-xs text-[var(--ink-secondary)] mt-1 leading-relaxed">
                      {previewEntry.learningObjectives}
                    </p>
                  </div>
                )}

                {previewEntry.homeworkAssigned && (
                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                    <span className="text-[10px] font-['Raleway'] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-amber-700" />
                      Assigned Homework & Practice
                    </span>
                    <p className="font-['Raleway'] text-xs text-amber-950 leading-relaxed">
                      {previewEntry.homeworkAssigned}
                    </p>
                  </div>
                )}

                {previewEntry.referenceLinks && previewEntry.referenceLinks.length > 0 && (
                  <div>
                    <span className="text-[10px] font-['Raleway'] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                      Study Material & Notes
                    </span>
                    <div className="mt-1.5 space-y-1">
                      {previewEntry.referenceLinks.map((link, idx) => (
                        <a
                          key={idx}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-['Raleway'] text-[var(--brand-electric)] hover:underline truncate"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span className="truncate">{link}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {previewEntry.followUpPlan && (
                  <div className="text-xs font-['Raleway'] text-[var(--ink-muted)] border-t border-[var(--border-paper)] pt-3">
                    <strong>Next Lecture Agenda:</strong> {previewEntry.followUpPlan}
                  </div>
                )}
              </div>
            ) : (
              <div className="paper-card p-12 text-center text-xs font-['Raleway'] text-[var(--ink-muted)]">
                Select an entry to view details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 2: NEW LESSON ENTRY FORM */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'newEntry' && (
        <div className="paper-card p-6 md:p-8 max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-paper)]">
            <div>
              <h2 className="font-['Playfair_Display'] text-xl font-bold text-[var(--ink-primary)]">
                Log Classroom Teaching Session
              </h2>
              <p className="font-['Raleway'] text-xs text-[var(--ink-muted)] mt-0.5">
                Record topics covered, student homework, and objectives for today's lecture.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePrefillToday}
              className="btn-secondary text-xs font-['Raleway'] font-bold px-3.5 py-2 flex items-center gap-2 self-start"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--brand-electric)]" />
              Pre-fill from Today's Timetable
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Row 1: Batch, Date, Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  Target Batch / Class *
                </label>
                <select
                  value={formData.batchId}
                  onChange={(e) => {
                    const selected = batches.find((b) => b.id === e.target.value);
                    setFormData((prev) => ({
                      ...prev,
                      batchId: e.target.value,
                      subject: selected ? selected.subject : prev.subject,
                    }));
                  }}
                  className="select-paper w-full text-xs font-['Raleway'] py-2"
                  required
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  Lesson Date *
                </label>
                <input
                  type="date"
                  value={formData.lessonDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lessonDate: e.target.value }))}
                  className="input-paper w-full text-xs font-['Inter'] py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  Session Slot & Duration
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="09:00 - 10:30"
                    value={formData.sessionTime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sessionTime: e.target.value }))}
                    className="input-paper flex-1 text-xs font-['Inter'] py-2"
                  />
                  <input
                    type="number"
                    placeholder="Mins"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, durationMinutes: parseInt(e.target.value) || 60 }))}
                    className="input-paper w-20 text-xs font-['Inter'] py-2 text-center"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Subject & Chapter Title */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                  className="input-paper w-full text-xs font-['Raleway'] py-2"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  Chapter / Unit Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Definite Integration & Leibniz Differentiation"
                  value={formData.chapterTitle}
                  onChange={(e) => setFormData((prev) => ({ ...prev, chapterTitle: e.target.value }))}
                  className="input-paper w-full text-xs font-['Raleway'] py-2 font-medium"
                  required
                />
              </div>
            </div>

            {/* Row 3: Concepts Taught (Mandatory) */}
            <div>
              <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                Concepts & Topics Taught (Detailed Lesson Journal) *
              </label>
              <textarea
                rows={4}
                placeholder="List topics, mathematical theorems, derivations, experiments, or cases demonstrated in class..."
                value={formData.conceptsTaught}
                onChange={(e) => setFormData((prev) => ({ ...prev, conceptsTaught: e.target.value }))}
                className="input-paper w-full text-xs font-['Raleway'] p-3 leading-relaxed"
                required
              />
            </div>

            {/* Row 4: Homework & Objectives */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  Homework / Practice Problem Set
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. DPP #14: Q1-18; HC Verma Chapter 10 problems..."
                  value={formData.homeworkAssigned}
                  onChange={(e) => setFormData((prev) => ({ ...prev, homeworkAssigned: e.target.value }))}
                  className="input-paper w-full text-xs font-['Raleway'] p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  Learning Objectives / Key Takeaways
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Mastery of Leibniz rule on periodic boundary integrations..."
                  value={formData.learningObjectives}
                  onChange={(e) => setFormData((prev) => ({ ...prev, learningObjectives: e.target.value }))}
                  className="input-paper w-full text-xs font-['Raleway'] p-2.5"
                />
              </div>
            </div>

            {/* Row 5: Reference Links & Follow Up Plan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  Reference Study Link (Notes or Video)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.referenceLinks?.[0] || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, referenceLinks: [e.target.value] }))}
                  className="input-paper w-full text-xs font-['Inter'] py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  Next Lecture Follow-up Plan
                </label>
                <input
                  type="text"
                  placeholder="e.g. Area Under Curve & Double Integrals"
                  value={formData.followUpPlan}
                  onChange={(e) => setFormData((prev) => ({ ...prev, followUpPlan: e.target.value }))}
                  className="input-paper w-full text-xs font-['Raleway'] py-2"
                />
              </div>
            </div>

            {/* Row 6: Audience Scope Selector */}
            <div className="p-4 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-paper)] space-y-2">
              <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-primary)]">
                Audience & Visibility Permissions
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, audience: 'BATCH' }))}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    formData.audience === 'BATCH'
                      ? 'bg-[var(--bg-paper)] border-[var(--brand-electric)] shadow-sm'
                      : 'border-[var(--border-paper)] bg-[var(--bg-paper-warm)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[var(--brand-electric)]" />
                    <span className="font-['Raleway'] font-bold text-xs text-[var(--ink-primary)]">
                      Batch Visible
                    </span>
                  </div>
                  <p className="font-['Raleway'] text-[10px] text-[var(--ink-muted)] mt-1">
                    Enrolled students & parents can view this diary entry in their portal.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, audience: 'OWNER_ONLY' }))}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    formData.audience === 'OWNER_ONLY'
                      ? 'bg-[var(--bg-paper)] border-[var(--brand-electric)] shadow-sm'
                      : 'border-[var(--border-paper)] bg-[var(--bg-paper-warm)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-purple-600" />
                    <span className="font-['Raleway'] font-bold text-xs text-[var(--ink-primary)]">
                      Tuition Owner Only
                    </span>
                  </div>
                  <p className="font-['Raleway'] text-[10px] text-[var(--ink-muted)] mt-1">
                    Private to Coaching Owner / Institute Admins for internal audit.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, audience: 'PRIVATE_DRAFT' }))}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    formData.audience === 'PRIVATE_DRAFT'
                      ? 'bg-[var(--bg-paper)] border-[var(--brand-electric)] shadow-sm'
                      : 'border-[var(--border-paper)] bg-[var(--bg-paper-warm)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-stone-500" />
                    <span className="font-['Raleway'] font-bold text-xs text-[var(--ink-primary)]">
                      Private Draft
                    </span>
                  </div>
                  <p className="font-['Raleway'] text-[10px] text-[var(--ink-muted)] mt-1">
                    Visible only to you while preparing your notes.
                  </p>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-paper)]">
              <button
                type="button"
                onClick={() => setActiveTab('journal')}
                className="btn-subtle text-xs font-['Raleway'] font-bold px-4 py-2.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary text-xs font-['Raleway'] font-bold px-6 py-2.5 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSubmitting ? 'Publishing Entry...' : 'Publish to Daily Diary'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 3: SYLLABUS COVERAGE & ANALYTICS */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'coverage' && overview && (
        <div className="space-y-6">
          <div className="paper-card p-6">
            <h3 className="font-['Playfair_Display'] text-lg font-bold text-[var(--ink-primary)] mb-1">
              Curriculum & Topic Delivery Breakdown
            </h3>
            <p className="font-['Raleway'] text-xs text-[var(--ink-muted)] mb-6">
              Aggregated distribution of lecture hours and topics delivered across subjects for academic session {new Date().getFullYear()}.
            </p>

            <div className="space-y-4">
              {Object.entries(overview.subjectCoverageMap).map(([subject, count]) => {
                const percentage = Math.min(100, Math.round((count / 24) * 100));
                return (
                  <div key={subject} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-['Raleway']">
                      <span className="font-bold text-[var(--ink-primary)]">{subject}</span>
                      <span className="font-['Inter'] font-semibold text-[var(--brand-electric)]">
                        {count} Lectures Logged ({percentage}% of target)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--brand-electric)] transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

