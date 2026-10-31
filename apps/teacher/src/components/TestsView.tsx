'use client';

import React, { useState } from 'react';
import {
  Award,
  Plus,
  Clock,
  Calendar,
  Eye,
  EyeOff,
  CheckCircle,
  HelpCircle,
  X,
  Trash2,
} from 'lucide-react';
import type { BatchSummary, TestQuiz, TestQuestion } from '@padhai-pilot/shared';
import { EmptyState } from '@padhai-pilot/ui';
import { TestAveragesCard } from './charts';

interface TestsViewProps {
  batches: BatchSummary[];
  tests: TestQuiz[];
  onCreateTest: (data: {
    batchId: string;
    title: string;
    subject: string;
    durationMinutes: number;
    scheduledDate: string;
    questions: any[];
  }) => Promise<void>;
  onToggleResults: (testId: string) => Promise<void>;
}

export function TestsView({
  batches,
  tests,
  onCreateTest,
  onToggleResults,
}: TestsViewProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [batchId, setBatchId] = useState(batches[0]?.id || '');
  const [duration, setDuration] = useState(45);
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
  );

  // Question builder state
  const [questions, setQuestions] = useState<TestQuestion[]>([
    {
      id: 'q1',
      text: 'What is the derivative of sin(2x)?',
      type: 'MCQ',
      options: ['2 cos(2x)', '-2 cos(2x)', 'cos(2x)', '2 sin(x)'],
      correctOptionIndex: 0,
      marks: 5,
    },
  ]);

  const addQuestion = (type: 'MCQ' | 'TEXT') => {
    const newQ: TestQuestion = {
      id: `q_${Date.now()}`,
      text: '',
      type,
      options: type === 'MCQ' ? ['', '', '', ''] : undefined,
      correctOptionIndex: type === 'MCQ' ? 0 : undefined,
      marks: type === 'MCQ' ? 5 : 10,
    };
    setQuestions([...questions, newQ]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subject || questions.length === 0) return;

    setIsSubmitting(true);
    try {
      await onCreateTest({
        batchId,
        title,
        subject,
        durationMinutes: Number(duration),
        scheduledDate: new Date(scheduledDate).toISOString(),
        questions,
      });
      setShowCreateModal(false);
      setTitle('');
      setSubject('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3DFD9]">
        <div>
          <h1 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-bold text-stone-900">
            Tests, Quizzes & Assessments
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 font-['Raleway']">
            Design timed quizzes, configure objective scoring rubrics, and govern results visibility.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1677FF] hover:bg-[#3395FF] text-white text-xs font-semibold tracking-wide transition shadow-[0_2px_12px_rgba(22,119,255,0.35)] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Assessment</span>
        </button>
      </div>

      {tests.length > 0 && <TestAveragesCard tests={tests} />}

      {/* Tests Grid */}
      {tests.length === 0 ? (
        <div className="paper-card">
          <EmptyState art="education/exam-results" title="No tests created yet" description="Create a timed quiz or assessment for a batch. Average scores appear here once students attempt it." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tests.map((t) => (
            <div
              key={t.id}
              className="p-5 rounded-xl bg-white border border-[#E3DFD9] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#F3EFE9] text-[#1677FF] border border-[#1677FF]/20">
                    {t.subject}
                  </span>
                  <span className="text-xs text-stone-500 flex items-center gap-1 font-['Inter']">
                    <Clock className="w-3.5 h-3.5 text-[#1677FF]" />
                    {t.durationMinutes} mins
                  </span>
                </div>

                <h3 className="font-semibold text-base text-stone-900 leading-snug">{t.title}</h3>
                <p className="text-xs text-stone-500 mt-1">Batch: {t.batchName}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#E3DFD9] flex items-center justify-between text-xs">
                <div className="font-['Inter']">
                  <span className="font-bold text-stone-900">{t.questions.length} questions</span>
                  <span className="text-stone-500"> • Total {t.totalMarks} pts</span>
                </div>

                <button
                  onClick={() => onToggleResults(t.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                    t.resultsReleased
                      ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30 hover:bg-[#10B981]/25'
                      : 'bg-[#F3EFE9] text-stone-500 border-[#E3DFD9] hover:text-white'
                  }`}
                >
                  {t.resultsReleased ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{t.resultsReleased ? 'Results Released' : 'Release Results'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Test Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white border border-[#E3DFD9] p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col text-xs">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 text-stone-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-['Playfair_Display'] text-xl font-bold text-stone-900 mb-1">
              Create Assessment Quiz
            </h3>
            <p className="text-stone-500 mb-4">
              Compose questions with automatic objective evaluation and timed release.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-stone-500 font-medium mb-1">Assessment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Calculus Mid-Term Assessment Quiz"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E3DFD9] text-stone-900 focus:outline-none focus:border-[#1677FF]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mathematics"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E3DFD9] text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Batch *</label>
                  <select
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E3DFD9] text-stone-900"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id} className="bg-white">
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    min={15}
                    max={180}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E3DFD9] text-stone-900"
                  />
                </div>
              </div>

              {/* Questions Section */}
              <div className="pt-2 border-t border-[#E3DFD9]">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-stone-900">Question Items ({questions.length})</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => addQuestion('MCQ')}
                      className="px-2.5 py-1 rounded bg-[#1677FF]/15 text-[#1677FF] border border-[#1677FF]/30 font-medium hover:bg-[#1677FF]/25"
                    >
                      + Add MCQ
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuestion('TEXT')}
                      className="px-2.5 py-1 rounded bg-[#F3EFE9] text-stone-700 border border-[#E3DFD9] font-medium hover:text-white"
                    >
                      + Add Subjective
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E3DFD9] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[#1677FF] font-bold">Q{idx + 1} ({q.type})</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={q.marks}
                            onChange={(e) => {
                              const marks = Number(e.target.value);
                              setQuestions(questions.map((item, i) => i === idx ? { ...item, marks } : item));
                            }}
                            className="w-16 px-2 py-0.5 rounded bg-white border border-[#E3DFD9] text-center font-mono"
                          />
                          <span className="text-stone-500">pts</span>
                          {questions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeQuestion(idx)}
                              className="text-[#F43F5E] p-1 hover:bg-[#F43F5E]/15 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <input
                        type="text"
                        required
                        placeholder="Enter question statement..."
                        value={q.text}
                        onChange={(e) => {
                          const text = e.target.value;
                          setQuestions(questions.map((item, i) => i === idx ? { ...item, text } : item));
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E3DFD9] text-stone-900"
                      />

                      {q.type === 'MCQ' && q.options && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct_${q.id}`}
                                checked={q.correctOptionIndex === optIdx}
                                onChange={() => {
                                  setQuestions(questions.map((item, i) => i === idx ? { ...item, correctOptionIndex: optIdx } : item));
                                }}
                              />
                              <input
                                type="text"
                                placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                value={opt}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const newOptions = [...q.options!];
                                  newOptions[optIdx] = val;
                                  setQuestions(questions.map((item, i) => i === idx ? { ...item, options: newOptions } : item));
                                }}
                                className="w-full px-2.5 py-1 rounded bg-white border border-[#E3DFD9] text-stone-900"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
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
                  className="px-5 py-2 rounded-lg bg-[#1677FF] hover:bg-[#3395FF] text-white font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

