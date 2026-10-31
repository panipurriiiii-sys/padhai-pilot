'use client';

import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  X,
  Award,
  ArrowRight,
} from 'lucide-react';
import type { BatchSummary, Assignment, AssignmentSubmission } from '@padhai-pilot/shared';

interface AssignmentsViewProps {
  batches: BatchSummary[];
  assignments: Assignment[];
  onCreateAssignment: (data: {
    batchId: string;
    title: string;
    instructions: string;
    subject: string;
    dueDate: string;
    maxMarks?: number;
  }) => Promise<void>;
  loadSubmissions: (assignmentId: string) => Promise<{ assignment: Assignment; submissions: AssignmentSubmission[] }>;
  onGradeSubmission: (
    submissionId: string,
    data: { marksObtained: number; feedback?: string; resubmit?: boolean },
  ) => Promise<void>;
}

export function AssignmentsView({
  batches,
  assignments,
  onCreateAssignment,
  loadSubmissions,
  onGradeSubmission,
}: AssignmentsViewProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [subject, setSubject] = useState('');
  const [batchId, setBatchId] = useState(batches[0]?.id || '');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
  );
  const [maxMarks, setMaxMarks] = useState(50);

  // Submissions drawer state
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  // Grade Modal State
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmission | null>(null);
  const [marks, setMarks] = useState<number>(45);
  const [feedback, setFeedback] = useState<string>('');
  const [requestResubmit, setRequestResubmit] = useState<boolean>(false);
  const [isSavingGrade, setIsSavingGrade] = useState<boolean>(false);

  const handleOpenSubmissions = async (asg: Assignment) => {
    setActiveAssignment(asg);
    setIsLoadingSubmissions(true);
    try {
      const res = await loadSubmissions(asg.id);
      setSubmissions(res.submissions);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subject || !batchId) return;

    setIsSubmitting(true);
    try {
      await onCreateAssignment({
        title,
        instructions,
        subject,
        batchId,
        dueDate: new Date(dueDate).toISOString(),
        maxMarks: Number(maxMarks),
      });
      setShowCreateModal(false);
      setTitle('');
      setInstructions('');
      setSubject('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    setIsSavingGrade(true);
    try {
      await onGradeSubmission(gradingSubmission.id, {
        marksObtained: Number(marks),
        feedback,
        resubmit: requestResubmit,
      });

      // Update local state
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === gradingSubmission.id
            ? {
                ...s,
                status: requestResubmit ? 'RESUBMIT' : 'GRADED',
                marksObtained: Number(marks),
                feedback,
              }
            : s,
        ),
      );
      setGradingSubmission(null);
    } finally {
      setIsSavingGrade(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-paper">
        <div>
          <h1 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-bold text-stone-900">
            Assignments & Academic Evaluations
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 font-['Raleway']">
            Publish problem sets, review student submissions, enter grades, and provide constructive academic feedback.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-electric hover:bg-[#3395FF] text-white text-xs font-semibold tracking-wide transition shadow-[0_2px_12px_rgba(22,119,255,0.35)] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Assignment</span>
        </button>
      </div>

      {/* Assignments List */}
      {assignments.length === 0 ? (
        <div className="paper-card p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-[var(--ink-muted)] mx-auto opacity-50" />
          <h3 className="font-['Playfair_Display'] font-bold text-lg text-[var(--ink-primary)]">
            No Assignments Published
          </h3>
          <p className="font-['Raleway'] text-xs text-[var(--ink-muted)] max-w-md mx-auto">
            Click &quot;Create Assignment&quot; above to compose and assign problem sets to your batches.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((asg) => (
            <div
              key={asg.id}
              className="p-5 rounded-xl bg-white border border-border-paper hover:border-border-paper transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-surface-subtle text-electric border border-electric/20">
                    {asg.subject}
                  </span>
                  <span className="text-xs text-stone-500 flex items-center gap-1 font-['Inter']">
                    <Calendar className="w-3.5 h-3.5 text-electric" />
                    Due {new Date(asg.dueDate).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-semibold text-base text-stone-900 leading-snug">{asg.title}</h3>
                <p className="text-xs text-stone-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {asg.instructions}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-border-paper flex items-center justify-between">
                <div className="font-['Inter'] text-xs">
                  <span className="text-stone-900 font-bold">{asg.submissionCount}</span>
                  <span className="text-stone-500"> / {asg.totalStudents} submitted</span>
                  <span className="ml-2 text-[10px] text-stone-500">(Max: {asg.maxMarks} pts)</span>
                </div>

                <button
                  onClick={() => handleOpenSubmissions(asg)}
                  className="px-3 py-1.5 rounded-lg bg-surface-subtle hover:bg-electric text-stone-700 hover:text-white border border-border-paper hover:border-electric text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Review Work</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submissions Review Modal */}
      {activeAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white border border-border-paper p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <button
              onClick={() => setActiveAssignment(null)}
              className="absolute right-4 top-4 text-stone-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <span className="text-[10px] uppercase font-mono tracking-wider text-electric">
                Submission Review
              </span>
              <h3 className="font-['Playfair_Display'] text-xl font-bold text-stone-900">
                {activeAssignment.title}
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Max Marks: {activeAssignment.maxMarks} points • Batch: {activeAssignment.batchName}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {isLoadingSubmissions ? (
                <div className="py-12 text-center text-xs text-stone-500">
                  Loading student submissions...
                </div>
              ) : submissions.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-500">
                  No student submissions received yet for this assignment.
                </div>
              ) : (
                submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-xl bg-paper-warm border border-border-paper flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-['Inter'] font-semibold text-xs text-electric">
                          {sub.rollNumber}
                        </span>
                        <span className="text-xs font-bold text-stone-900">{sub.studentName}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            sub.status === 'GRADED'
                              ? 'bg-status-success/15 text-status-success'
                              : sub.status === 'RESUBMIT'
                              ? 'bg-status-warning/15 text-status-warning'
                              : 'bg-electric/15 text-electric'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 line-clamp-1">{sub.content}</p>
                      {sub.feedback && (
                        <p className="text-[11px] text-stone-700 mt-1 italic">
                          Feedback: &ldquo;{sub.feedback}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {sub.marksObtained !== undefined && (
                        <div className="font-['Inter'] text-sm font-bold text-status-success">
                          {sub.marksObtained} / {activeAssignment.maxMarks}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setGradingSubmission(sub);
                          setMarks(sub.marksObtained || 45);
                          setFeedback(sub.feedback || '');
                          setRequestResubmit(sub.status === 'RESUBMIT');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-electric hover:bg-[#3395FF] text-white text-xs font-semibold transition flex items-center gap-1"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>{sub.status === 'GRADED' ? 'Edit Grade' : 'Grade'}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grade Dialog */}
      {gradingSubmission && activeAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-border-paper p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setGradingSubmission(null)}
              className="absolute right-4 top-4 text-stone-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-['Playfair_Display'] text-lg font-bold text-stone-900 mb-1">
              Grade Submission
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Student: <span className="text-stone-900 font-medium">{gradingSubmission.studentName}</span> ({gradingSubmission.rollNumber})
            </p>

            <form onSubmit={handleSaveGrade} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-500 font-medium mb-1">
                  Marks Obtained (Max: {activeAssignment.maxMarks}) *
                </label>
                <input
                  type="number"
                  min={0}
                  max={activeAssignment.maxMarks}
                  required
                  value={marks}
                  onChange={(e) => setMarks(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-paper-warm border border-border-paper text-stone-900 font-['Inter'] text-sm focus:outline-none focus:border-electric"
                />
              </div>

              <div>
                <label className="block text-stone-500 font-medium mb-1">
                  Constructive Feedback
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Excellent conceptual clarity on limits. Ensure step proofs are numbered."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-paper-warm border border-border-paper text-stone-900 focus:outline-none focus:border-electric"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="resubmit"
                  checked={requestResubmit}
                  onChange={(e) => setRequestResubmit(e.target.checked)}
                  className="rounded bg-paper-warm border-border-paper text-electric focus:ring-0"
                />
                <label htmlFor="resubmit" className="text-stone-700 cursor-pointer">
                  Request student to resubmit corrections
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="px-3 py-1.5 rounded-lg text-stone-500 hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingGrade}
                  className="px-5 py-2 rounded-lg bg-electric hover:bg-[#3395FF] text-white font-semibold disabled:opacity-50"
                >
                  {isSavingGrade ? 'Saving Grade...' : 'Save Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-border-paper p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 text-stone-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-['Playfair_Display'] text-xl font-bold text-stone-900 mb-1">
              Create New Assignment
            </h3>
            <p className="text-xs text-stone-500 mb-5">
              Assign problem sheets or homework to your batch students.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-500 mb-1 font-medium">Assignment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Problem Set 5: Integral Calculus"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-paper-warm border border-border-paper text-stone-900 focus:outline-none focus:border-electric"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-500 mb-1 font-medium">Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mathematics"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-paper-warm border border-border-paper text-stone-900 focus:outline-none focus:border-electric"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 mb-1 font-medium">Batch *</label>
                  <select
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-paper-warm border border-border-paper text-stone-900 focus:outline-none focus:border-electric"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id} className="bg-white">
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-500 mb-1 font-medium">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-paper-warm border border-border-paper text-stone-900 focus:outline-none focus:border-electric"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 mb-1 font-medium">Max Marks</label>
                  <input
                    type="number"
                    min={10}
                    max={200}
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-paper-warm border border-border-paper text-stone-900 focus:outline-none focus:border-electric"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-500 mb-1 font-medium">Instructions & Details</label>
                <textarea
                  rows={3}
                  placeholder="Detail what students should solve, proofs required, and submission format..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-paper-warm border border-border-paper text-stone-900 focus:outline-none focus:border-electric"
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
                  className="px-5 py-2 rounded-lg bg-electric hover:bg-[#3395FF] text-white font-semibold shadow-[0_2px_12px_rgba(22,119,255,0.35)] disabled:opacity-50"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
