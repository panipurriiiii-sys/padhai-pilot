'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { IndianRupee, Plus, Receipt, Bell, Ban } from 'lucide-react';
import type { BatchSummary, BatchFeeStructureItem, BatchFeeSummary, FeeLedgerItem, PaymentMode, FeeRecordStatus } from '@padhai-pilot/shared';
import { teacherApi } from '../lib/api';
import { LoadError } from './LoadError';
import { Modal, Field } from './InvitationsView';

const MODES: PaymentMode[] = ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'OTHER'];
const inr = (n: number) => `Rs ${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const today = () => new Date().toISOString().slice(0, 10);

const STATUS_STYLE: Record<FeeRecordStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
  PARTIAL: 'bg-sky-50 text-sky-800 border-sky-200',
  PAID: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  OVERDUE: 'bg-rose-50 text-rose-800 border-rose-200',
  VOID: 'bg-stone-100 text-stone-600 border-stone-200',
};

/** Batch fees: set the fee, see each student's status (PENDING until paid), record manual payments, issue receipts, send reminders. */
export function BatchFeesView({ batches }: { batches: BatchSummary[] }) {
  const [batchId, setBatchId] = useState(batches[0]?.id ?? '');
  const [fees, setFees] = useState<FeeLedgerItem[]>([]);
  const [summary, setSummary] = useState<BatchFeeSummary | null>(null);
  const [structures, setStructures] = useState<BatchFeeStructureItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);

  const [structForm, setStructForm] = useState<{ title: string; amount: string; dueDate: string } | null>(null);
  const [payFor, setPayFor] = useState<FeeLedgerItem | null>(null);
  const [pay, setPay] = useState({ amount: '', paidOn: today(), mode: 'CASH' as PaymentMode, reference: '', note: '' });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const flash = (text: string, error = false) => {
    setNotice({ text, error });
    setTimeout(() => setNotice(null), 5000);
  };

  const load = useCallback(async () => {
    if (!batchId) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const [f, s, st] = await Promise.all([teacherApi.listBatchFees(batchId), teacherApi.getBatchFeeSummary(batchId), teacherApi.listFeeStructures(batchId)]);
      setFees(f);
      setSummary(s);
      setStructures(st);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load fees.');
    } finally {
      setIsLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    load();
  }, [load]);

  const submitStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!structForm) return;
    setBusy(true);
    setFormError(null);
    try {
      await teacherApi.createFeeStructure(batchId, { title: structForm.title.trim(), amount: Number(structForm.amount), dueDate: structForm.dueDate });
      setStructForm(null);
      await load();
      flash('Fee set. Every enrolled student now has a PENDING fee.');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not set the fee.');
    } finally {
      setBusy(false);
    }
  };

  const openPay = (f: FeeLedgerItem) => {
    setFormError(null);
    setPay({ amount: String(f.balanceDue), paidOn: today(), mode: 'CASH', reference: '', note: '' });
    setPayFor(f);
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payFor) return;
    setBusy(true);
    setFormError(null);
    try {
      const p = await teacherApi.recordFeePayment(payFor.id, { amount: Number(pay.amount), paidOn: pay.paidOn, mode: pay.mode, reference: pay.reference.trim() || undefined, note: pay.note.trim() || undefined });
      setPayFor(null);
      await load();
      flash(`Payment recorded. Receipt ${p.receiptNumber} issued.`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not record the payment.');
    } finally {
      setBusy(false);
    }
  };

  const voidPayment = async (paymentId: string) => {
    const reason = window.prompt('Reason for voiding this payment (required):');
    if (!reason?.trim()) return;
    try {
      await teacherApi.voidFeePayment(paymentId, reason.trim());
      await load();
      flash('Payment voided.');
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Could not void the payment.', true);
    }
  };

  const openReceipt = async (paymentId: string) => {
    try {
      await teacherApi.openFeeReceipt(paymentId);
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Could not open the receipt.', true);
    }
  };

  const remind = async (feeRecordIds?: string[]) => {
    try {
      const r = await teacherApi.sendFeeReminders({ batchId, feeRecordIds, channels: ['IN_APP'] });
      flash(`${r.inAppCreated} reminder${r.inAppCreated === 1 ? '' : 's'} sent in the student app. ${r.skippedDuplicates} skipped as already reminded today.`);
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Could not send reminders.', true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-paper)]">
        <div>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[var(--ink-primary)] flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-[var(--brand-electric)]" /> Batch Fees
          </h1>
          <p className="font-['Raleway'] text-xs text-[var(--ink-muted)] mt-1">Set the fee for a batch, record payments by hand, and students see their balance and receipts.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select aria-label="Batch" className="input-paper text-xs" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button type="button" className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5" disabled={!batchId} onClick={() => { setFormError(null); setStructForm({ title: 'Tuition fee', amount: '', dueDate: today() }); }}>
            <Plus className="w-3.5 h-3.5" /> Set fee
          </button>
          <button type="button" className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5" disabled={!batchId || fees.length === 0} onClick={() => remind()}>
            <Bell className="w-3.5 h-3.5" /> Remind unpaid
          </button>
        </div>
      </div>

      {notice && <div role="status" className={`p-3 rounded-lg border text-xs ${notice.error ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>{notice.text}</div>}

      {batches.length === 0 ? (
        <div className="paper-card p-12 text-center text-xs text-[var(--ink-muted)]">Create a batch first to set fees.</div>
      ) : loadError ? (
        <LoadError message={loadError} onRetry={load} />
      ) : isLoading && !summary ? (
        <div className="paper-card p-12 text-center text-xs text-[var(--ink-muted)]">Loading fees...</div>
      ) : (
        <>
          {summary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                ['To collect', inr(summary.totalReceivable)],
                ['Collected', inr(summary.totalCollected)],
                ['Pending', inr(summary.totalPending)],
                ['Overdue', inr(summary.overdueAmount)],
              ].map(([k, v]) => (
                <div key={k} className="paper-card p-4">
                  <div className="text-[10px] uppercase font-bold text-[var(--ink-muted)]">{k}</div>
                  <div className="font-data text-lg font-bold text-[var(--ink-primary)]">{v}</div>
                </div>
              ))}
              <div className="paper-card p-4 col-span-2 lg:col-span-4 text-xs text-[var(--ink-secondary)]">
                {summary.studentCount} students: {summary.paidCount} paid, {summary.partialCount} partly paid, {summary.pendingCount} pending, {summary.overdueCount} overdue.
                {structures.length > 0 && ` Fee plan: ${structures.filter((s) => s.status === 'ACTIVE').map((s) => `${s.title} ${inr(s.totalPerStudent)}`).join(', ') || 'none active'}.`}
              </div>
            </div>
          )}

          {fees.length === 0 ? (
            <div className="paper-card p-12 text-center space-y-2">
              <p className="font-['Playfair_Display'] font-bold text-base text-[var(--ink-primary)]">No fees set for this batch</p>
              <p className="text-xs text-[var(--ink-muted)]">Use Set fee. Every enrolled student starts as PENDING.</p>
            </div>
          ) : (
            <div className="paper-card overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[var(--ink-muted)] border-b border-[var(--border-paper)]">
                    <th className="p-3">Student</th><th className="p-3">Fee</th><th className="p-3">Due</th><th className="p-3 text-right">Total</th><th className="p-3 text-right">Paid</th><th className="p-3 text-right">Balance</th><th className="p-3">Status</th><th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((f) => (
                    <React.Fragment key={f.id}>
                      <tr className="border-b border-[var(--border-paper)]">
                        <td className="p-3 font-bold text-[var(--ink-primary)]">{f.studentName}<div className="font-normal text-[var(--ink-muted)]">{f.rollNumber}</div></td>
                        <td className="p-3">{f.feeTitle}{f.instalmentNo > 1 ? ` #${f.instalmentNo}` : ''}</td>
                        <td className="p-3">{new Date(f.dueDate).toLocaleDateString()}</td>
                        <td className="p-3 text-right font-data">{inr(f.totalAmount)}</td>
                        <td className="p-3 text-right font-data">{inr(f.paidAmount)}</td>
                        <td className="p-3 text-right font-data font-bold">{inr(f.balanceDue)}</td>
                        <td className="p-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${STATUS_STYLE[f.status]}`}>{f.status}</span></td>
                        <td className="p-3">
                          <div className="flex gap-1.5 flex-wrap">
                            <button type="button" className="btn-secondary text-[11px] px-2 py-1" disabled={f.balanceDue <= 0 || f.status === 'VOID'} onClick={() => openPay(f)}>Record payment</button>
                            {f.balanceDue > 0 && f.status !== 'VOID' && <button type="button" className="text-[11px] px-2 py-1 rounded-lg border border-[var(--border-paper)]" onClick={() => remind([f.id])}>Remind</button>}
                          </div>
                        </td>
                      </tr>
                      {f.payments.map((p) => (
                        <tr key={p.id} className="bg-[var(--bg-paper-warm)] border-b border-[var(--border-paper)]">
                          <td className="p-2 pl-6 text-[var(--ink-muted)]" colSpan={3}>{new Date(p.paidOn).toLocaleDateString()} - {p.mode.replace('_', ' ')}{p.reference ? ` (${p.reference})` : ''} - receipt {p.receiptNumber}</td>
                          <td className="p-2 text-right font-data" colSpan={2}>{p.status === 'VOIDED' ? <s>{inr(p.amount)}</s> : inr(p.amount)}</td>
                          <td className="p-2" colSpan={3}>
                            {p.status === 'ISSUED' ? (
                              <div className="flex gap-3">
                                <button type="button" className="flex items-center gap-1 text-[11px] underline" onClick={() => openReceipt(p.id)}><Receipt className="w-3 h-3" /> Receipt PDF</button>
                                <button type="button" className="flex items-center gap-1 text-[11px] underline text-rose-700" onClick={() => voidPayment(p.id)}><Ban className="w-3 h-3" /> Void</button>
                              </div>
                            ) : <span className="text-[11px] text-rose-700">Voided{p.voidReason ? `: ${p.voidReason}` : ''}</span>}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {structForm && (
        <Modal title="Set batch fee" onClose={() => setStructForm(null)}>
          <form onSubmit={submitStructure} className="space-y-3">
            <Field label="Fee name"><input className="input-paper w-full" value={structForm.title} onChange={(e) => setStructForm({ ...structForm, title: e.target.value })} required /></Field>
            <Field label="Amount per student (Rs)"><input type="number" min={1} step="0.01" className="input-paper w-full" value={structForm.amount} onChange={(e) => setStructForm({ ...structForm, amount: e.target.value })} required /></Field>
            <Field label="Due date"><input type="date" className="input-paper w-full" value={structForm.dueDate} onChange={(e) => setStructForm({ ...structForm, dueDate: e.target.value })} required /></Field>
            {formError && <p role="alert" className="text-xs text-rose-700">{formError}</p>}
            <button className="btn-primary w-full py-2.5 text-xs font-bold" disabled={busy}>{busy ? 'Saving...' : 'Charge all students'}</button>
          </form>
        </Modal>
      )}

      {payFor && (
        <Modal title={`Record payment - ${payFor.studentName}`} onClose={() => setPayFor(null)}>
          <form onSubmit={submitPayment} className="space-y-3">
            <p className="text-xs text-[var(--ink-muted)]">Balance due {inr(payFor.balanceDue)}. Enter less for a part payment.</p>
            <Field label="Amount received (Rs)"><input type="number" min={0.01} max={payFor.balanceDue} step="0.01" className="input-paper w-full" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} required /></Field>
            <Field label="Date received"><input type="date" className="input-paper w-full" value={pay.paidOn} max={today()} onChange={(e) => setPay({ ...pay, paidOn: e.target.value })} required /></Field>
            <Field label="Mode">
              <select className="input-paper w-full" value={pay.mode} onChange={(e) => setPay({ ...pay, mode: e.target.value as PaymentMode })}>
                {MODES.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
              </select>
            </Field>
            <Field label="Reference (UPI id, cheque no.)"><input className="input-paper w-full" value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} /></Field>
            <Field label="Note"><input className="input-paper w-full" value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} /></Field>
            {formError && <p role="alert" className="text-xs text-rose-700">{formError}</p>}
            <button className="btn-primary w-full py-2.5 text-xs font-bold" disabled={busy}>{busy ? 'Saving...' : 'Save and issue receipt'}</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
