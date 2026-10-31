'use client';

import React, { useState } from 'react';
import { BookOpen, Plus, CheckCircle, Circle, FileText, Link as LinkIcon, X } from 'lucide-react';
import type { BatchSummary, LessonPlan } from '@padhai-pilot/shared';
import { EmptyState } from '@padhai-pilot/ui';
import { SyllabusCoverageCard } from './charts';

interface LessonPlansViewProps {
  batches: BatchSummary[];
  lessonPlans: LessonPlan[];
  onCreatePlan: (data: {
    batchId: string;
    title: string;
    topic: string;
    subject: string;
    weekNumber: number;
    content: string;
  }) => Promise<void>;
  onToggleStatus: (planId: string) => Promise<void>;
}

export function LessonPlansView({
  batches,
  lessonPlans,
  onCreatePlan,
  onToggleStatus,
}: LessonPlansViewProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [batchId, setBatchId] = useState(batches[0]?.id || '');
  const [weekNumber, setWeekNumber] = useState(1);
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !topic || !subject) return;

    setIsSubmitting(true);
    try {
      await onCreatePlan({
        batchId,
        title,
        topic,
        subject,
        weekNumber: Number(weekNumber),
        content,
      });
      setShowCreateModal(false);
      setTitle('');
      setTopic('');
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-paper">
        <div>
          <h1 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-bold text-stone-900">
            Syllabus & Lesson Planning
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 font-['Raleway']">
            Organize weekly lecture modules, monitor syllabus milestone progress, and attach learning handouts.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-electric hover:bg-[#3395FF] text-white text-xs font-semibold tracking-wide transition shadow-[0_2px_12px_rgba(22,119,255,0.35)] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Lesson Plan</span>
        </button>
      </div>

      {lessonPlans.length > 0 && <SyllabusCoverageCard plans={lessonPlans} />}

      {/* Plans List */}
      {lessonPlans.length === 0 ? (
        <div className="paper-card">
          <EmptyState art="education/books" title="No lesson plans yet" description="Add weekly topics for a batch, then tick them off as you teach to see syllabus coverage." />
        </div>
      ) : (
        <div className="space-y-3">
          {lessonPlans.map((lp) => (
            <div
              key={lp.id}
              className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                lp.isCompleted
                  ? 'bg-[var(--bg-paper-warm)] border-[var(--border-paper)] opacity-85'
                  : 'paper-card-interactive border-[var(--border-paper)]'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <button
                  onClick={() => onToggleStatus(lp.id)}
                  title={lp.isCompleted ? 'Mark as incomplete' : 'Mark topic completed'}
                  className="mt-0.5 text-[var(--brand-electric)] hover:text-[var(--brand-hover)] shrink-0"
                >
                  {lp.isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-[var(--ink-faint)]" />
                  )}
                </button>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge-code">
                      Week {lp.weekNumber} • {lp.subject}
                    </span>
                    <span className="text-xs font-bold text-[var(--ink-primary)] font-['Raleway']">{lp.batchName}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[var(--ink-primary)] font-['Raleway']">{lp.title}</h3>
                  <p className="text-xs text-[var(--ink-muted)] mt-1 font-['Raleway']">{lp.topic}</p>
                  <p className="text-xs text-[var(--ink-secondary)] mt-1.5 leading-relaxed font-['Raleway']">{lp.content}</p>

                  {lp.resources && lp.resources.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-border-paper">
                      {lp.resources.map((res, i) => (
                        <a
                          key={i}
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-paper-warm hover:bg-electric/15 border border-border-paper hover:border-electric/40 text-[11px] text-stone-700 hover:text-electric transition"
                        >
                          {res.type === 'PDF' ? <FileText className="w-3 h-3" /> : <LinkIcon className="w-3 h-3" />}
                          <span>{res.title}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="shrink-0 self-end md:self-center">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    lp.isCompleted
                      ? 'bg-status-success/15 text-status-success'
                      : 'bg-status-warning/15 text-status-warning'
                  }`}
                >
                  {lp.isCompleted ? 'Topic Covered' : 'In Progress'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Lesson Plan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-border-paper p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 text-xs">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 text-stone-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-['Playfair_Display'] text-xl font-bold text-stone-900 mb-1">
              Add Weekly Lesson Plan
            </h3>
            <p className="text-stone-500 mb-4">
              Schedule syllabus topics and provide lecture milestones for your classes.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-stone-500 font-medium mb-1">Module Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Integral Calculus: Week 6"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-paper-warm border border-border-paper text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-500 font-medium mb-1">Topic Focus *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Definite Integrals and Properties"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-paper-warm border border-border-paper text-stone-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="Math"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-paper-warm border border-border-paper text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Batch *</label>
                  <select
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-paper-warm border border-border-paper text-stone-900"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id} className="bg-white">
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Week #</label>
                  <input
                    type="number"
                    min={1}
                    max={52}
                    value={weekNumber}
                    onChange={(e) => setWeekNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-paper-warm border border-border-paper text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-500 font-medium mb-1">Module Details / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Outline derivations, key formulas, and exam problems to be covered..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-paper-warm border border-border-paper text-stone-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-stone-500 hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-electric hover:bg-[#3395FF] text-white font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Lesson Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

