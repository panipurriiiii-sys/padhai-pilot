'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  AlertTriangle,
  FileText,
  Plus,
  X,
  Search,
  Filter,
} from 'lucide-react';
import { teacherApi } from '../lib/api';
import { LoadError } from './LoadError';
import type {
  FacultyLeaveItem,
  ApplyFacultyLeaveDto,
  ReviewFacultyLeaveDto,
  FacultyMember,
  LeaveType,
} from '@padhai-pilot/shared';

interface FacultyLeaveViewProps {
  currentUserId?: string;
  isOwnerOrManager?: boolean;
}

export function FacultyLeaveView({
  currentUserId = '',
  isOwnerOrManager = true,
}: FacultyLeaveViewProps) {
  const [leaves, setLeaves] = useState<FacultyLeaveItem[]>([]);
  const [faculties, setFaculties] = useState<FacultyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'roster' | 'apply'>('roster');

  // Review Modal
  const [reviewTarget, setReviewTarget] = useState<FacultyLeaveItem | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [substituteFacultyId, setSubstituteFacultyId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Apply Form
  const [applyForm, setApplyForm] = useState<ApplyFacultyLeaveDto>({
    leaveType: 'CASUAL',
    startDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    totalDays: 2,
    reason: '',
    substituteFacultyId: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [leaveList, facList] = await Promise.all([
        teacherApi.getLeaves(),
        teacherApi.getFaculties(),
      ]);
      setLeaves(leaveList);
      setFaculties(facList);
      if (facList.length > 0) {
        setSubstituteFacultyId(facList[0].userId);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load this section.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApplyLeave(e: React.FormEvent) {
    e.preventDefault();
    if (!applyForm.reason.trim()) {
      alert('Please provide a reason for the leave application.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await teacherApi.applyLeave(applyForm);
      setLeaves((prev) => [created, ...prev]);
      setActiveTab('roster');
      setToastMessage('Leave application submitted for tuition owner review!');
      setTimeout(() => setToastMessage(null), 4000);

      // Reset
      setApplyForm({
        leaveType: 'CASUAL',
        startDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        totalDays: 2,
        reason: '',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReview(status: 'APPROVED' | 'REJECTED') {
    if (!reviewTarget) return;

    if (reviewTarget.facultyId === currentUserId) {
      alert('Security Policy: You cannot review or approve your own leave application.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await teacherApi.reviewLeave(reviewTarget.id, {
        status,
        reviewerRemarks: reviewRemarks || (status === 'APPROVED' ? 'Approved by director' : 'Declined due to lecture scheduling conflicts'),
        substituteFacultyId: substituteFacultyId || undefined,
      });

      setLeaves((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      setReviewTarget(null);
      setToastMessage(`Leave request marked as ${status}!`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  }

  const pendingCount = leaves.filter((l) => l.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-['Raleway'] font-bold text-xs shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--border-paper)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-['Raleway'] font-bold uppercase tracking-widest text-[var(--brand-electric)]">
              Faculty Lifecycle • Leaves & Substitute Arrangements
            </span>
            <span className="badge-code font-['Inter'] text-[10px]">LEAVE DISPATCH</span>
          </div>
          <h1 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold tracking-tight text-[var(--ink-primary)] mt-1">
            Faculty Leave Management
          </h1>
          <p className="font-['Raleway'] text-xs text-[var(--ink-muted)] mt-1">
            Apply for absence, assign substitute teachers, and conduct owner approval workflows.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-3.5 py-2 rounded-xl text-xs font-['Raleway'] font-bold transition-all ${
              activeTab === 'roster' ? 'btn-primary' : 'btn-subtle'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 inline mr-1.5" />
            Applications ({leaves.length})
          </button>
          <button
            onClick={() => setActiveTab('apply')}
            className={`px-3.5 py-2 rounded-xl text-xs font-['Raleway'] font-bold transition-all ${
              activeTab === 'apply' ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            <Plus className="w-3.5 h-3.5 inline mr-1.5" />
            Apply For Leave
          </button>
        </div>
      </div>

      {/* Pending Banner if owner */}
      {isOwnerOrManager && pendingCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-['Raleway'] font-bold text-xs text-amber-950">
                {pendingCount} Pending Leave Application{pendingCount > 1 ? 's' : ''} Require Review
              </p>
              <p className="font-['Raleway'] text-[11px] text-amber-800">
                Review absence dates and ensure a substitute teacher is assigned to prevent batch cancellations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 1: APPLICATIONS LIST */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'roster' && (
        <div className="paper-card overflow-hidden">
          {loadError ? (
            <LoadError message={loadError} onRetry={loadData} />
          ) : isLoading ? (
            <div className="p-12 text-center text-xs font-['Raleway'] text-[var(--ink-muted)]">
              Loading leave applications...
            </div>
          ) : leaves.length === 0 ? (
            <div className="p-12 text-center text-xs font-['Raleway'] text-[var(--ink-muted)]">
              No leave applications logged.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-paper)] bg-[var(--bg-surface-subtle)] text-[10px] font-['Raleway'] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                    <th className="py-3 px-4">Faculty Member</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Absence Duration</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                    <th className="py-3 px-4">Substitute Assigned</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-paper)] font-['Inter']">
                  {leaves.map((leave) => {
                    const startFormatted = new Date(leave.startDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    });
                    const endFormatted = new Date(leave.endDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    });
                    const isSelf = leave.facultyId === currentUserId;

                    return (
                      <tr key={leave.id} className="hover:bg-[var(--bg-paper-warm)] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-['Playfair_Display'] font-bold text-xs text-[var(--ink-primary)]">
                            {leave.facultyName}
                          </div>
                          <div className="font-['Inter'] text-[10px] text-[var(--ink-muted)]">
                            {leave.staffId} {isSelf && '(You)'}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-['Raleway'] font-semibold text-[var(--ink-primary)]">
                            {leave.leaveType.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-[var(--ink-primary)]">
                            {startFormatted} – {endFormatted}
                          </div>
                          <div className="font-['Raleway'] text-[10px] text-[var(--ink-muted)]">
                            {leave.totalDays} Day{leave.totalDays > 1 ? 's' : ''}
                          </div>
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          <p className="font-['Raleway'] text-xs text-[var(--ink-secondary)] truncate">
                            {leave.reason}
                          </p>
                          {leave.reviewerRemarks && (
                            <p className="font-['Raleway'] text-[10px] text-[var(--brand-electric)] truncate mt-0.5">
                              Reviewer: {leave.reviewerRemarks}
                            </p>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {leave.substituteFacultyName ? (
                            <div className="flex items-center gap-1.5 text-emerald-700 font-['Raleway'] font-semibold">
                              <UserCheck className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{leave.substituteFacultyName}</span>
                            </div>
                          ) : (
                            <span className="text-[var(--ink-muted)] font-['Raleway'] italic">
                              None assigned
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-['Raleway'] font-bold uppercase tracking-wider ${
                              leave.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : leave.status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {leave.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          {isOwnerOrManager && leave.status === 'PENDING' ? (
                            <button
                              disabled={isSelf}
                              onClick={() => {
                                setReviewTarget(leave);
                                setReviewRemarks('');
                                setSubstituteFacultyId(leave.substituteFacultyId || faculties[0]?.userId || '');
                              }}
                              title={isSelf ? 'Cannot review own application' : 'Review application'}
                              className={`btn-secondary text-[10px] font-['Raleway'] font-bold px-2.5 py-1.5 ${
                                isSelf ? 'opacity-40 cursor-not-allowed' : ''
                              }`}
                            >
                              Review
                            </button>
                          ) : (
                            <span className="text-[10px] font-['Raleway'] text-[var(--ink-muted)]">
                              {leave.status === 'PENDING' ? 'Under Review' : 'Completed'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 2: APPLY FOR LEAVE FORM */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'apply' && (
        <div className="paper-card p-6 md:p-8 max-w-xl mx-auto space-y-5">
          <div className="pb-3 border-b border-[var(--border-paper)]">
            <h2 className="font-['Playfair_Display'] text-xl font-bold text-[var(--ink-primary)]">
              Submit Leave Application
            </h2>
            <p className="font-['Raleway'] text-xs text-[var(--ink-muted)] mt-0.5">
              Notify tuition management in advance and suggest a substitute teacher.
            </p>
          </div>

          <form onSubmit={handleApplyLeave} className="space-y-4">
            <div>
              <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                Leave Category *
              </label>
              <select
                value={applyForm.leaveType}
                onChange={(e) => setApplyForm({ ...applyForm, leaveType: e.target.value as LeaveType })}
                className="select-paper w-full text-xs font-['Raleway'] py-2"
              >
                <option value="CASUAL">Casual Leave (CL)</option>
                <option value="SICK">Medical / Sick Leave (ML)</option>
                <option value="ACADEMIC_DUTY">Academic Duty / Seminar (OD)</option>
                <option value="EMERGENCY">Emergency / Compassionate</option>
                <option value="UNPAID">Leave Without Pay (LWP)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={applyForm.startDate}
                  onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
                  className="input-paper w-full text-xs font-['Inter'] py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  value={applyForm.endDate}
                  onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
                  className="input-paper w-full text-xs font-['Inter'] py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                Total Days Count *
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                required
                value={applyForm.totalDays}
                onChange={(e) => setApplyForm({ ...applyForm, totalDays: parseFloat(e.target.value) || 1 })}
                className="input-paper w-full text-xs font-['Inter'] py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                Suggested Substitute Faculty
              </label>
              <select
                value={applyForm.substituteFacultyId || ''}
                onChange={(e) => setApplyForm({ ...applyForm, substituteFacultyId: e.target.value })}
                className="select-paper w-full text-xs font-['Raleway'] py-2"
              >
                <option value="">None (To be assigned by Director)</option>
                {faculties
                  .filter((f) => f.userId !== currentUserId)
                  .map((f) => (
                    <option key={f.id} value={f.userId}>
                      {f.fullName} ({f.designation})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                Reason & Handover Details *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Explain reason for leave and any pending syllabus topics or batch handover details..."
                value={applyForm.reason}
                onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                className="input-paper w-full text-xs font-['Raleway'] p-2.5"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-paper)]">
              <button
                type="button"
                onClick={() => setActiveTab('roster')}
                className="btn-subtle text-xs font-['Raleway'] font-bold px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary text-xs font-['Raleway'] font-bold px-5 py-2"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* REVIEW LEAVE MODAL */}
      {/* ------------------------------------------------------------------- */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="paper-card p-6 max-w-md w-full bg-[var(--bg-paper)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-paper)]">
              <div>
                <h3 className="font-['Playfair_Display'] text-lg font-bold text-[var(--ink-primary)]">
                  Review Faculty Leave
                </h3>
                <p className="font-['Raleway'] text-xs text-[var(--ink-muted)]">
                  {reviewTarget.facultyName} • {reviewTarget.totalDays} Days ({reviewTarget.leaveType})
                </p>
              </div>
              <button
                onClick={() => setReviewTarget(null)}
                className="p-1 rounded-lg text-[var(--ink-muted)] hover:bg-[var(--bg-secondary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-paper)] text-xs font-['Raleway'] space-y-1">
              <span className="font-bold text-[var(--ink-primary)] block">Reason stated:</span>
              <p className="text-[var(--ink-secondary)] italic leading-relaxed">
                "{reviewTarget.reason}"
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  Assign Substitute Faculty
                </label>
                <select
                  value={substituteFacultyId}
                  onChange={(e) => setSubstituteFacultyId(e.target.value)}
                  className="select-paper w-full text-xs font-['Raleway'] py-2"
                >
                  <option value="">No substitute needed</option>
                  {faculties
                    .filter((f) => f.userId !== reviewTarget.facultyId)
                    .map((f) => (
                      <option key={f.id} value={f.userId}>
                        {f.fullName} ({f.designation})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  Reviewer Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Approved. Substitute teacher informed."
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  className="input-paper w-full text-xs font-['Raleway'] py-2"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-paper)]">
              <button
                type="button"
                onClick={() => handleReview('REJECTED')}
                disabled={isSubmitting}
                className="btn-subtle text-xs font-['Raleway'] font-bold px-4 py-2 text-rose-700 hover:bg-rose-50"
              >
                Reject Request
              </button>
              <button
                type="button"
                onClick={() => handleReview('APPROVED')}
                disabled={isSubmitting}
                className="btn-primary text-xs font-['Raleway'] font-bold px-5 py-2 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

