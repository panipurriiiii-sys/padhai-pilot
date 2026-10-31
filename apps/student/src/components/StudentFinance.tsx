'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Receipt, CalendarOff } from 'lucide-react';
import { ErrorState, EmptyState } from '@padhai-pilot/ui';
import type { StudentFeeLedger, StudentLeaveItem } from '@padhai-pilot/shared';
import { studentApi } from '../lib/api';
import { StudentFeeBreakdownCard } from './charts';

const inr = (n: number) => `Rs ${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const BADGE: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
  PARTIAL: 'bg-sky-50 text-sky-800 border-sky-200',
  PAID: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  OVERDUE: 'bg-rose-50 text-rose-800 border-rose-200',
  VOID: 'bg-stone-100 text-stone-600 border-stone-200',
  APPROVED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-800 border-rose-200',
  CANCELLED: 'bg-stone-100 text-stone-600 border-stone-200',
};

/** Fees, balance and receipts. Every fee starts PENDING and changes only when the teacher records a payment. */
export function StudentFeesPanel() {
  const [ledger, setLedger] = useState<StudentFeeLedger | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [docError, setDocError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setLedger(await studentApi.getFeeLedger());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your fees.');
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const openReceipt = async (id: string) => {
    setDocError(null);
    try {
      await studentApi.openReceipt(id);
    } catch (e) {
      setDocError(e instanceof Error ? e.message : 'Could not open the receipt.');
    }
  };

  if (isLoading) return <div className="paper-card p-12 text-center text-xs text-[var(--ink-muted)]">Loading your fees...</div>;
  if (error) return <div className="py-10 flex justify-center" role="alert"><ErrorState title="Could not load your fees" description={error} onRetry={load} /></div>;
  if (!ledger || ledger.fees.length === 0) {
    return <EmptyState art="empty-states/inbox" title="No fees yet" description="When your institute sets a fee for your batch it will appear here with its status." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-[var(--ink-primary)]">Fees and Receipts</h2>
        <p className="text-xs text-[var(--ink-muted)] mt-1">Payments are recorded by your institute. A receipt appears here as soon as one is entered.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['Total fees', inr(ledger.totalFees)],
          ['Paid', inr(ledger.paidAmount)],
          ['Balance due', inr(ledger.balanceDue)],
          ['Overdue', inr(ledger.overdueAmount)],
        ].map(([k, v]) => (
          <div key={k} className="paper-card p-4">
            <div className="text-[10px] uppercase font-bold text-[var(--ink-muted)]">{k}</div>
            <div className="font-data text-lg font-bold text-[var(--ink-primary)]">{v}</div>
          </div>
        ))}
      </div>

      <StudentFeeBreakdownCard fee={{ totalFees: ledger.totalFees, paidAmount: ledger.paidAmount, balanceDue: ledger.balanceDue }} />

      {docError && <p role="alert" className="text-xs text-rose-700">{docError}</p>}

      <div className="paper-card overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[var(--ink-muted)] border-b border-[var(--border-paper)]">
              <th className="p-3">Fee</th><th className="p-3">Due</th><th className="p-3 text-right">Amount</th><th className="p-3 text-right">Paid</th><th className="p-3 text-right">Balance</th><th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {ledger.fees.map((f) => (
              <tr key={f.id} className="border-b border-[var(--border-paper)]">
                <td className="p-3 font-bold text-[var(--ink-primary)]">{f.feeTitle}{f.instalmentNo > 1 ? ` #${f.instalmentNo}` : ''}</td>
                <td className="p-3">{new Date(f.dueDate).toLocaleDateString()}</td>
                <td className="p-3 text-right font-data">{inr(f.totalAmount)}</td>
                <td className="p-3 text-right font-data">{inr(f.paidAmount)}</td>
                <td className="p-3 text-right font-data font-bold">{inr(f.balanceDue)}</td>
                <td className="p-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${BADGE[f.status]}`}>{f.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3">
        <h3 className="font-display text-lg font-bold text-[var(--ink-primary)]">Receipts</h3>
        {ledger.receipts.length === 0 ? (
          <p className="text-xs text-[var(--ink-muted)]">No payments recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {ledger.receipts.map((r) => (
              <li key={r.id} className="paper-card p-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-[var(--ink-primary)]">{r.receiptNumber} - {inr(r.amount)}</div>
                  <div className="text-[var(--ink-muted)]">{new Date(r.paidOn).toLocaleDateString()} via {r.mode.replace('_', ' ')}{r.status === 'VOIDED' ? ' (voided)' : ''}</div>
                </div>
                {r.status === 'ISSUED' && (
                  <button type="button" className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5" onClick={() => openReceipt(r.id)}>
                    <Receipt className="w-3.5 h-3.5" /> Receipt PDF
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Leave applications: apply, see the decision, cancel while pending. */
export function StudentLeavesPanel() {
  const [items, setItems] = useState<StudentLeaveItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ startDate: today, endDate: today, reason: '' });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setItems(await studentApi.getLeaves());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your leave applications.');
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.endDate < form.startDate) {
      setFormError('The last day cannot be before the first day.');
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await studentApi.applyLeave({ startDate: form.startDate, endDate: form.endDate, reason: form.reason.trim() });
      setForm({ startDate: today, endDate: today, reason: '' });
      setSent(true);
      setTimeout(() => setSent(false), 4000);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not submit the application.');
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (id: string) => {
    try {
      await studentApi.cancelLeave(id);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not cancel the application.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-[var(--ink-primary)] flex items-center gap-2"><CalendarOff className="w-5 h-5 text-[var(--brand-electric)]" /> Leave Applications</h2>
        <p className="text-xs text-[var(--ink-muted)] mt-1">Apply for leave and track the decision from your teacher.</p>
      </div>

      <form onSubmit={submit} className="paper-card p-5 space-y-3 max-w-xl">
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-[11px] font-bold">From<input type="date" required min={today} className="input-paper w-full font-normal" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></label>
          <label className="space-y-1 text-[11px] font-bold">To<input type="date" required min={form.startDate} className="input-paper w-full font-normal" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></label>
        </div>
        <label className="block space-y-1 text-[11px] font-bold">Reason<textarea required minLength={5} rows={3} className="input-paper w-full font-normal" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></label>
        {formError && <p role="alert" className="text-xs text-rose-700">{formError}</p>}
        {sent && <p role="status" className="text-xs text-emerald-700">Application sent to your teacher.</p>}
        <button className="btn-primary px-4 py-2.5 text-xs font-bold" disabled={busy}>{busy ? 'Sending...' : 'Apply for leave'}</button>
      </form>

      {isLoading ? (
        <div className="text-xs text-[var(--ink-muted)]">Loading...</div>
      ) : error ? (
        <div className="py-6 flex justify-center" role="alert"><ErrorState title="Could not load leave applications" description={error} onRetry={load} /></div>
      ) : items.length === 0 ? (
        <p className="text-xs text-[var(--ink-muted)]">You have not applied for leave yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((l) => (
            <li key={l.id} className="paper-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <div className="font-bold text-[var(--ink-primary)]">{new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()} ({l.totalDays} day{l.totalDays === 1 ? '' : 's'})</div>
                <div className="text-[var(--ink-muted)]">{l.reason}</div>
                {l.reviewerRemarks && <div className="text-[var(--ink-secondary)] mt-1">Teacher&apos;s remarks: {l.reviewerRemarks}</div>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${BADGE[l.status] ?? BADGE.PENDING}`}>{l.status}</span>
                {l.status === 'PENDING' && <button type="button" className="btn-secondary text-xs px-3 py-1" onClick={() => cancel(l.id)}>Cancel</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
