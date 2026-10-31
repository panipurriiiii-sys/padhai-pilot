'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CalendarOff } from 'lucide-react';
import type { StudentLeaveItem } from '@padhai-pilot/shared';
import { teacherApi } from '../lib/api';
import { LoadError } from './LoadError';

const STYLE: Record<StudentLeaveItem['status'], string> = {
  PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-800 border-rose-200',
  CANCELLED: 'bg-stone-100 text-stone-600 border-stone-200',
};

/** Student leave applications: students apply from their portal, staff approve or reject here. */
export function StudentLeavesView() {
  const [items, setItems] = useState<StudentLeaveItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setItems(await teacherApi.listStudentLeaves());
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load leave applications.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (l: StudentLeaveItem, status: 'APPROVED' | 'REJECTED') => {
    const remarks = status === 'REJECTED' ? window.prompt('Reason for rejecting (shown to the student):') ?? undefined : undefined;
    if (status === 'REJECTED' && remarks === undefined) return;
    setBusy(l.id);
    try {
      await teacherApi.reviewStudentLeave(l.id, { status, remarks: remarks?.trim() || undefined });
      await load();
      setNotice({ text: `Leave ${status.toLowerCase()}.` });
    } catch (e) {
      setNotice({ text: e instanceof Error ? e.message : 'Could not update the leave.', error: true });
    } finally {
      setBusy(null);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[var(--border-paper)]">
        <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[var(--ink-primary)] flex items-center gap-2">
          <CalendarOff className="w-5 h-5 text-[var(--brand-electric)]" /> Student Leave Requests
        </h1>
        <p className="font-['Raleway'] text-xs text-[var(--ink-muted)] mt-1">Approve or reject leave applications from the students in your batches.</p>
      </div>
      {notice && <div role="status" className={`p-3 rounded-lg border text-xs ${notice.error ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>{notice.text}</div>}
      {loadError ? (
        <LoadError message={loadError} onRetry={load} />
      ) : isLoading ? (
        <div className="paper-card p-12 text-center text-xs text-[var(--ink-muted)]">Loading leave requests...</div>
      ) : items.length === 0 ? (
        <div className="paper-card p-12 text-center text-xs text-[var(--ink-muted)]">No leave applications yet.</div>
      ) : (
        <ul className="space-y-3">
          {items.map((l) => (
            <li key={l.id} className="paper-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-['Raleway'] font-bold text-sm text-[var(--ink-primary)]">{l.studentName} <span className="font-normal text-[var(--ink-muted)]">{l.batchName ? `- ${l.batchName}` : ''}</span></div>
                <div className="text-xs text-[var(--ink-secondary)]">{new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()} ({l.totalDays} day{l.totalDays === 1 ? '' : 's'})</div>
                <p className="text-xs text-[var(--ink-muted)] mt-1">{l.reason}</p>
                {l.reviewerRemarks && <p className="text-xs text-[var(--ink-muted)] mt-1">Remarks: {l.reviewerRemarks}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${STYLE[l.status]}`}>{l.status}</span>
                {l.status === 'PENDING' && (
                  <>
                    <button type="button" disabled={busy === l.id} className="btn-primary text-xs px-3 py-1.5" onClick={() => review(l, 'APPROVED')}>Approve</button>
                    <button type="button" disabled={busy === l.id} className="text-xs px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => review(l, 'REJECTED')}>Reject</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
