'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { IndianRupee, Plus, Receipt, Bell, Ban, Calendar, Check } from 'lucide-react';
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

type BillingCycle = 'MONTHLY' | 'HALF_YEARLY' | 'YEARLY' | 'ONE_TIME';

interface StructFormState {
  title: string;
  amount: string;
  dueDate: string;
  cycle: BillingCycle;
  monthCount: number;
}

function addMonthsToDate(isoDate: string, monthsToAdd: number): string {
  const d = new Date(isoDate + 'T00:00:00');
  d.setMonth(d.getMonth() + monthsToAdd);
  return d.toISOString().slice(0, 10);
}

/** Batch fees: set the fee, see each student's status (PENDING until paid), record manual payments, issue receipts, send reminders. */
export function BatchFeesView({ batches }: { batches: BatchSummary[] }) {
  const [batchId, setBatchId] = useState(batches[0]?.id ?? '');

  // Synchronize batch selection when batches load asynchronously
  useEffect(() => {
    if (!batchId && batches.length > 0) {
      setBatchId(batches[0].id);
    }
  }, [batches, batchId]);

  const [fees, setFees] = useState<FeeLedgerItem[]>([]);
  const [summary, setSummary] = useState<BatchFeeSummary | null>(null);
  const [structures, setStructures] = useState<BatchFeeStructureItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);

  const [structForm, setStructForm] = useState<StructFormState | null>(null);
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
    let active = true;
    setIsLoading(true);
    setLoadError(null);
    try {
      const [f, s, st] = await Promise.all([teacherApi.listBatchFees(batchId), teacherApi.getBatchFeeSummary(batchId), teacherApi.listFeeStructures(batchId)]);
      if (!active) return;
      setFees(f);
      setSummary(s);
      setStructures(st);
    } catch (e) {
      if (active) setLoadError(e instanceof Error ? e.message : 'Could not load fees.');
    } finally {
      if (active) setIsLoading(false);
    }
    return () => {
      active = false;
    };
  }, [batchId]);

  useEffect(() => {
    load();
  }, [load]);

  const submitStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!structForm) return;
    const baseAmount = Number(structForm.amount);
    if (Number.isNaN(baseAmount) || baseAmount <= 0) {
      setFormError('Please enter a valid fee amount.');
      return;
    }

    setBusy(true);
    setFormError(null);

    try {
      if (structForm.cycle === 'MONTHLY' && structForm.monthCount > 1) {
        // Multi-month recurring installments
        const count = structForm.monthCount;
        const instalments = Array.from({ length: count }, (_, i) => ({
          label: `Month ${i + 1}`,
          amount: baseAmount,
          dueDate: addMonthsToDate(structForm.dueDate, i),
        }));
        await teacherApi.createFeeStructure(batchId, {
          title: `${structForm.title.trim()} (${count} Months Plan)`,
          amount: baseAmount * count,
          dueDate: structForm.dueDate,
          instalments,
        });
      } else if (structForm.cycle === 'HALF_YEARLY') {
        // 2 terms: 6 months apart
        const instalments = [
          { label: 'Term 1 (First Half)', amount: baseAmount, dueDate: structForm.dueDate },
          { label: 'Term 2 (Second Half)', amount: baseAmount, dueDate: addMonthsToDate(structForm.dueDate, 6) },
        ];
        await teacherApi.createFeeStructure(batchId, {
          title: `${structForm.title.trim()} (Half-Yearly / 2 Terms)`,
          amount: baseAmount * 2,
          dueDate: structForm.dueDate,
          instalments,
        });
      } else if (structForm.cycle === 'YEARLY') {
        // Annual fee
        await teacherApi.createFeeStructure(batchId, {
          title: `${structForm.title.trim()} (Annual Plan)`,
          amount: baseAmount,
          dueDate: structForm.dueDate,
        });
      } else {
        // Monthly (1 mo) or One-Time
        await teacherApi.createFeeStructure(batchId, {
          title: structForm.title.trim(),
          amount: baseAmount,
          dueDate: structForm.dueDate,
        });
      }

      setStructForm(null);
      await load();
      flash('Fee structure created. Enrolled students have been charged accordingly.');
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

    const numAmount = Number(pay.amount);
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid payment amount greater than zero.');
      return;
    }
    if (numAmount > payFor.balanceDue) {
      setFormError(`Payment amount cannot exceed the balance due of Rs ${payFor.balanceDue.toLocaleString('en-IN')}.`);
      return;
    }

    setBusy(true);
    setFormError(null);
    try {
      const p = await teacherApi.recordFeePayment(payFor.id, {
        amount: numAmount,
        paidOn: pay.paidOn,
        mode: pay.mode,
        reference: pay.reference.trim() || undefined,
        note: pay.note.trim() || undefined,
      });
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
          <p className="font-['Raleway'] text-xs text-[var(--ink-muted)] mt-1">
            Configure monthly, half-yearly, or annual tuition fee schedules. Record student payments and issue official receipts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select aria-label="Batch" className="input-paper text-xs" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button
            type="button"
            className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5"
            disabled={!batchId}
            onClick={() => {
              setFormError(null);
              setStructForm({ title: 'Tuition fee', amount: '', dueDate: today(), cycle: 'MONTHLY', monthCount: 1 });
            }}
          >
            <Plus className="w-3.5 h-3.5" /> Set Fee Schedule
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
                {structures.length > 0 && ` Fee plan: ${structures.filter((s) => s.status === 'ACTIVE').map((s) => `${s.title} (${inr(s.totalPerStudent)})`).join(', ') || 'none active'}.`}
              </div>
            </div>
          )}

          {fees.length === 0 ? (
            <div className="paper-card p-12 text-center space-y-2">
              <p className="font-['Playfair_Display'] font-bold text-base text-[var(--ink-primary)]">No fees set for this batch</p>
              <p className="text-xs text-[var(--ink-muted)]">Use Set fee schedule above to configure monthly, half-yearly, or annual tuition charges.</p>
            </div>
          ) : (
            <>
            {/* Phones: one card per fee record */}
            <ul className="md:hidden space-y-3">
              {fees.map((f) => (
                <li key={f.id} className="paper-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold font-['Raleway'] text-sm text-[var(--ink-primary)] truncate">{f.studentName || 'Student'}</p>
                      <p className="text-[11px] text-[var(--ink-secondary)]">{f.feeTitle} - due {new Date(f.dueDate).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${STATUS_STYLE[f.status]}`}>{f.status}</span>
                  </div>
                  <dl className="grid grid-cols-3 gap-2 text-center text-xs font-data">
                    <div><dt className="text-[10px] uppercase text-[var(--ink-muted)]">Total</dt><dd>{inr(f.totalAmount)}</dd></div>
                    <div><dt className="text-[10px] uppercase text-[var(--ink-muted)]">Paid</dt><dd className="text-emerald-800">{inr(f.paidAmount)}</dd></div>
                    <div><dt className="text-[10px] uppercase text-[var(--ink-muted)]">Balance</dt><dd className="font-bold">{inr(f.balanceDue)}</dd></div>
                  </dl>
                  {f.balanceDue > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="btn-primary flex-1 text-xs px-3" onClick={() => openPay(f)}>Record payment</button>
                      {f.status !== 'PAID' && (
                        <button type="button" className="btn-secondary text-xs px-3" onClick={() => remind([f.id])}>Remind</button>
                      )}
                    </div>
                  )}
                  {f.payments && f.payments.length > 0 && (
                    <div className="pt-2 border-t border-[var(--border-paper)] space-y-1 text-[11px] text-[var(--ink-secondary)]">
                      {f.payments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate">{p.receiptNumber} ({inr(p.amount)}, {p.mode}){p.status === 'VOIDED' ? ' - voided' : ''}</span>
                          <span className="flex gap-1 shrink-0">
                            <button type="button" aria-label="Open receipt" className="underline text-[var(--brand-electric)] px-2" onClick={() => openReceipt(p.id)}>PDF</button>
                            {p.status === 'ISSUED' && (
                              <button type="button" aria-label="Void payment" className="text-rose-700 px-2" onClick={() => voidPayment(p.id)}>Void</button>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <div className="hidden md:block paper-card overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[var(--ink-muted)] border-b border-[var(--border-paper)]">
                    <th className="p-3">Student</th><th className="p-3">Fee / Installment</th><th className="p-3">Due</th><th className="p-3 text-right">Total</th><th className="p-3 text-right">Paid</th><th className="p-3 text-right">Balance</th><th className="p-3">Status</th><th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((f) => (
                    <React.Fragment key={f.id}>
                      <tr className="border-b border-[var(--border-paper)]">
                        <td className="p-3 font-bold font-['Raleway'] text-[var(--ink-primary)]">{f.studentName || 'Student'}</td>
                        <td className="p-3">{f.feeTitle}</td>
                        <td className="p-3 font-data">{new Date(f.dueDate).toLocaleDateString()}</td>
                        <td className="p-3 text-right font-data">{inr(f.totalAmount)}</td>
                        <td className="p-3 text-right font-data text-emerald-800">{inr(f.paidAmount)}</td>
                        <td className="p-3 text-right font-data font-bold">{inr(f.balanceDue)}</td>
                        <td className="p-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${STATUS_STYLE[f.status]}`}>{f.status}</span></td>
                        <td className="p-3">
                          <div className="flex gap-1.5 flex-wrap">
                            {f.balanceDue > 0 && (
                              <button type="button" className="btn-primary text-[11px] px-2.5 py-1" onClick={() => openPay(f)}>Record payment</button>
                            )}
                            {f.balanceDue > 0 && f.status !== 'PAID' && (
                              <button type="button" className="text-[11px] px-2 py-1 rounded border border-[var(--border-paper)] hover:bg-[var(--bg-paper)]" onClick={() => remind([f.id])}>Remind</button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {f.payments && f.payments.length > 0 && (
                        <tr className="bg-[var(--bg-paper-warm)] border-b border-[var(--border-paper)] text-[11px] text-[var(--ink-secondary)]">
                          <td colSpan={8} className="p-2.5 pl-6">
                            <span className="font-bold">Receipts: </span>
                            {f.payments.map((p) => (
                              <span key={p.id} className="inline-flex items-center gap-1 mr-4">
                                {p.receiptNumber} ({inr(p.amount)}, {p.mode})
                                <button type="button" aria-label="Open receipt" className="underline text-[var(--brand-electric)] hover:text-blue-900" onClick={() => openReceipt(p.id)}>PDF</button>
                                {p.status === 'ISSUED' && (
                                  <button type="button" aria-label="Void payment" className="text-rose-700 hover:underline" onClick={() => voidPayment(p.id)}>(void)</button>
                                )}
                              </span>
                            ))}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </>
      )}

      {/* Set Fee Schedule Modal */}
      {structForm && (
        <Modal title="Set Batch Fee Schedule" onClose={() => setStructForm(null)}>
          <form onSubmit={submitStructure} className="space-y-4">
            {/* Billing Cycle Selector */}
            <div>
              <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1.5">
                Billing Cycle / Frequency
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'MONTHLY', label: 'Monthly' },
                  { key: 'HALF_YEARLY', label: 'Half-Yearly' },
                  { key: 'YEARLY', label: 'Yearly' },
                  { key: 'ONE_TIME', label: 'One-Time / Custom' },
                ].map((cycle) => (
                  <button
                    key={cycle.key}
                    type="button"
                    onClick={() => {
                      const newTitle =
                        cycle.key === 'MONTHLY'
                          ? 'Monthly Tuition Fee'
                          : cycle.key === 'HALF_YEARLY'
                          ? 'Semester Tuition Fee'
                          : cycle.key === 'YEARLY'
                          ? 'Annual Tuition Fee'
                          : 'Course Fee';
                      setStructForm({ ...structForm, cycle: cycle.key as BillingCycle, title: newTitle });
                    }}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition ${
                      structForm.cycle === cycle.key
                        ? 'bg-[var(--brand-electric)] text-white border-[var(--brand-electric)] shadow-sm'
                        : 'bg-[var(--bg-paper-warm)] text-[var(--ink-secondary)] border-[var(--border-paper)] hover:bg-[var(--bg-paper)]'
                    }`}
                  >
                    {cycle.label}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Fee Description / Title">
              <input
                className="input-paper w-full text-xs"
                value={structForm.title}
                onChange={(e) => setStructForm({ ...structForm, title: e.target.value })}
                required
              />
            </Field>

            {structForm.cycle === 'MONTHLY' && (
              <div className="space-y-3 p-3 rounded-xl bg-blue-50/60 border border-blue-200">
                <Field label="Monthly Fee per Student (Rs)">
                  <input
                    type="number"
                    min={1}
                    step="0.01"
                    placeholder="e.g. 2500"
                    className="input-paper w-full text-xs"
                    value={structForm.amount}
                    onChange={(e) => setStructForm({ ...structForm, amount: e.target.value })}
                    required
                  />
                </Field>

                <div>
                  <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                    Number of Months to Schedule
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 3, 6, 10, 12].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setStructForm({ ...structForm, monthCount: m })}
                        className={`px-3 py-1 text-xs rounded-lg font-bold border transition ${
                          structForm.monthCount === m
                            ? 'bg-[var(--brand-electric)] text-white border-[var(--brand-electric)]'
                            : 'bg-white text-[var(--ink-secondary)] border-stone-200'
                        }`}
                      >
                        {m} {m === 1 ? 'Month' : 'Months'}
                      </button>
                    ))}
                  </div>
                </div>

                {Number(structForm.amount) > 0 && (
                  <p className="text-xs text-blue-900 font-medium">
                    Calculated: {inr(Number(structForm.amount))} / month × {structForm.monthCount} = <strong>{inr(Number(structForm.amount) * structForm.monthCount)}</strong> total per student ({structForm.monthCount} monthly installments).
                  </p>
                )}
              </div>
            )}

            {structForm.cycle === 'HALF_YEARLY' && (
              <div className="space-y-3 p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                <Field label="Fee per Half-Year / Term (Rs)">
                  <input
                    type="number"
                    min={1}
                    step="0.01"
                    placeholder="e.g. 12000"
                    className="input-paper w-full text-xs"
                    value={structForm.amount}
                    onChange={(e) => setStructForm({ ...structForm, amount: e.target.value })}
                    required
                  />
                </Field>
                {Number(structForm.amount) > 0 && (
                  <p className="text-xs text-amber-900 font-medium">
                    Calculated: 2 Terms (Term 1 & Term 2, 6 months apart) × {inr(Number(structForm.amount))} = <strong>{inr(Number(structForm.amount) * 2)}</strong> annual total per student.
                  </p>
                )}
              </div>
            )}

            {structForm.cycle === 'YEARLY' && (
              <div className="space-y-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <Field label="Annual Fee per Student (Rs)">
                  <input
                    type="number"
                    min={1}
                    step="0.01"
                    placeholder="e.g. 25000"
                    className="input-paper w-full text-xs"
                    value={structForm.amount}
                    onChange={(e) => setStructForm({ ...structForm, amount: e.target.value })}
                    required
                  />
                </Field>
                {Number(structForm.amount) > 0 && (
                  <p className="text-xs text-emerald-900 font-medium">
                    One-time full annual charge of <strong>{inr(Number(structForm.amount))}</strong> per student.
                  </p>
                )}
              </div>
            )}

            {structForm.cycle === 'ONE_TIME' && (
              <Field label="Total Amount per Student (Rs)">
                <input
                  type="number"
                  min={1}
                  step="0.01"
                  className="input-paper w-full text-xs"
                  value={structForm.amount}
                  onChange={(e) => setStructForm({ ...structForm, amount: e.target.value })}
                  required
                />
              </Field>
            )}

            <Field label="Due Date (First Installment)">
              <input
                type="date"
                className="input-paper w-full text-xs"
                value={structForm.dueDate}
                onChange={(e) => setStructForm({ ...structForm, dueDate: e.target.value })}
                required
              />
            </Field>

            {formError && <p role="alert" className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">{formError}</p>}

            <button className="btn-primary w-full py-2.5 text-xs font-bold" disabled={busy}>
              {busy ? 'Creating Fee Structure...' : 'Confirm & Charge Enrolled Students'}
            </button>
          </form>
        </Modal>
      )}

      {/* Record Manual Payment Modal */}
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
