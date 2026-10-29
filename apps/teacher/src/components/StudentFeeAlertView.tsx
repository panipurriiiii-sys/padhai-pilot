'use client';

import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  Bell,
  Send,
  MessageSquare,
  Mail,
  Smartphone,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  X,
  CreditCard,
  Building,
} from 'lucide-react';
import { teacherApi } from '../lib/api';
import type {
  StudentFeeItem,
  FeeSummaryOverview,
  DispatchFeeReminderDto,
  ReminderChannel,
} from '@padhai-pilot/shared';

export function StudentFeeAlertView() {
  const [fees, setFees] = useState<StudentFeeItem[]>([]);
  const [summary, setSummary] = useState<FeeSummaryOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Reminder Modal
  const [reminderTarget, setReminderTarget] = useState<StudentFeeItem | null>(null);
  const [channel, setChannel] = useState<ReminderChannel>('IN_APP');
  const [customMessage, setCustomMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [list, sum] = await Promise.all([
        teacherApi.getFeeRecords(),
        teacherApi.getFeeSummary(),
      ]);
      setFees(list);
      setSummary(sum);
    } finally {
      setIsLoading(false);
    }
  }

  function openReminderModal(fee: StudentFeeItem) {
    setReminderTarget(fee);
    setChannel('IN_APP');
    setCustomMessage(
      `Dear ${fee.studentName}, your tuition installment for "${fee.feeTitle}" (Balance: ₹${fee.balanceDue.toLocaleString()}) was due on ${new Date(fee.dueDate).toLocaleDateString('en-IN')}. Kindly clear at earliest convenience.`,
    );
  }

  async function handleSendReminder(e: React.FormEvent) {
    e.preventDefault();
    if (!reminderTarget) return;

    setIsSubmitting(true);
    try {
      const res = await teacherApi.dispatchFeeReminder({
        feeRecordId: reminderTarget.id,
        channel,
        customMessage,
      });

      setFees((prev) =>
        prev.map((f) =>
          f.id === reminderTarget.id
            ? {
                ...f,
                reminderCount: f.reminderCount + 1,
                lastReminderSentAt: new Date().toISOString(),
              }
            : f,
        ),
      );

      setReminderTarget(null);
      setToastMessage(res.message);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredFees = fees.filter((f) => {
    if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
    if (
      searchQuery &&
      !f.studentName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !f.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !f.feeTitle.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

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
              Tuition Owner • Fee Accounts & Dues Notification
            </span>
            <span className="badge-code font-['Inter'] text-[10px]">FEE LEDGER</span>
          </div>
          <h1 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold tracking-tight text-[var(--ink-primary)] mt-1">
            Student Fees & Balance Alerts
          </h1>
          <p className="font-['Raleway'] text-xs text-[var(--ink-muted)] mt-1">
            Track student payment dues, view upcoming installments, and dispatch automated alerts across channels.
          </p>
        </div>
      </div>

      {/* KPI Overview Strip */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="kpi-card">
            <span className="text-[11px] font-['Raleway'] font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
              Total Receivable Fees
            </span>
            <div className="font-['Inter'] text-2xl font-bold text-[var(--ink-primary)] mt-1">
              ₹{summary.totalReceivable.toLocaleString()}
            </div>
          </div>

          <div className="kpi-card">
            <span className="text-[11px] font-['Raleway'] font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
              Total Collected
            </span>
            <div className="font-['Inter'] text-2xl font-bold text-emerald-700 mt-1">
              ₹{summary.totalCollected.toLocaleString()}
            </div>
          </div>

          <div className="kpi-card">
            <span className="text-[11px] font-['Raleway'] font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
              Outstanding Dues
            </span>
            <div className="font-['Inter'] text-2xl font-bold text-amber-700 mt-1">
              ₹{summary.totalPending.toLocaleString()}
            </div>
          </div>

          <div className="kpi-card">
            <span className="text-[11px] font-['Raleway'] font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
              Overdue Students
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-['Inter'] text-2xl font-bold text-rose-700">
                {summary.overdueCount}
              </span>
              <span className="text-[10px] font-['Raleway'] text-[var(--ink-muted)]">
                {summary.remindersSentThisMonth} Reminders sent
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Table & Filters */}
      <div className="paper-card overflow-hidden">
        {/* Filter bar */}
        <div className="p-3 border-b border-[var(--border-paper)] flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-paper-warm)]">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-[var(--ink-muted)] shrink-0 ml-1" />
            <input
              type="text"
              placeholder="Search student by name, roll no, or fee head..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-0 text-xs font-['Raleway'] text-[var(--ink-primary)] focus:outline-none placeholder:text-[var(--ink-faint)]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select-paper text-xs py-1.5 px-2.5 font-['Raleway']"
            >
              <option value="ALL">All Statuses</option>
              <option value="OVERDUE">Overdue Only</option>
              <option value="PARTIAL">Partially Paid</option>
              <option value="PAID">Fully Paid</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs font-['Raleway'] text-[var(--ink-muted)]">
            Loading fee records...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-paper)] bg-[var(--bg-surface-subtle)] text-[10px] font-['Raleway'] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                  <th className="py-3 px-4">Student Name & Roll No</th>
                  <th className="py-3 px-4">Fee Head / Installment</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Paid / Balance Due</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Fee Reminder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-paper)] font-['Inter']">
                {filteredFees.map((fee) => {
                  const dueDateFormatted = new Date(fee.dueDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  const isOverdue = fee.status === 'OVERDUE' || (fee.balanceDue > 0 && new Date(fee.dueDate) < new Date());

                  return (
                    <tr key={fee.id} className="hover:bg-[var(--bg-paper-warm)] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-['Playfair_Display'] font-bold text-xs text-[var(--ink-primary)]">
                          {fee.studentName}
                        </div>
                        <div className="font-['Inter'] text-[10px] text-[var(--ink-muted)]">
                          Roll: {fee.rollNumber} {fee.batchName && `• ${fee.batchName}`}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-['Raleway'] font-semibold text-[var(--ink-primary)]">
                        {fee.feeTitle}
                      </td>

                      <td className="py-3 px-4 font-bold text-[var(--ink-primary)]">
                        ₹{fee.totalAmount.toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-emerald-700 font-semibold">
                          ₹{fee.paidAmount.toLocaleString()} paid
                        </div>
                        {fee.balanceDue > 0 ? (
                          <div className="text-rose-700 font-bold text-[11px]">
                            ₹{fee.balanceDue.toLocaleString()} due
                          </div>
                        ) : (
                          <div className="text-[10px] font-['Raleway'] text-[var(--ink-muted)]">
                            Fully Settled
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`font-semibold ${isOverdue ? 'text-rose-700' : 'text-[var(--ink-secondary)]'}`}>
                          {dueDateFormatted}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-['Raleway'] font-bold uppercase tracking-wider ${
                            fee.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : fee.status === 'OVERDUE'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {fee.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {fee.balanceDue > 0 ? (
                          <button
                            onClick={() => openReminderModal(fee)}
                            className="btn-primary text-[10px] font-['Raleway'] font-bold px-2.5 py-1.5 flex items-center gap-1.5 ml-auto"
                          >
                            <Send className="w-3 h-3" />
                            Send Alert {fee.reminderCount > 0 && `(${fee.reminderCount})`}
                          </button>
                        ) : (
                          <span className="text-[10px] font-['Raleway'] text-emerald-700 font-bold">
                            Paid In Full
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

      {/* ------------------------------------------------------------------- */}
      {/* DISPATCH REMINDER MODAL */}
      {/* ------------------------------------------------------------------- */}
      {reminderTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="paper-card p-6 md:p-8 max-w-lg w-full bg-[var(--bg-paper)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-paper)]">
              <div>
                <h3 className="font-['Playfair_Display'] text-xl font-bold text-[var(--ink-primary)]">
                  Dispatch Fee Balance Alert
                </h3>
                <p className="font-['Raleway'] text-xs text-[var(--ink-muted)]">
                  {reminderTarget.studentName} ({reminderTarget.rollNumber}) • Balance: ₹
                  {reminderTarget.balanceDue.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setReminderTarget(null)}
                className="p-1 rounded-lg text-[var(--ink-muted)] hover:bg-[var(--bg-secondary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendReminder} className="space-y-4">
              {/* Channel Selector */}
              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  Dispatch Channel *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'IN_APP', label: 'In-App Student Alert', icon: Bell },
                    { id: 'SMS', label: 'SMS Notification', icon: Smartphone },
                    { id: 'WHATSAPP', label: 'WhatsApp Message', icon: MessageSquare },
                    { id: 'EMAIL', label: 'Email Statement', icon: Mail },
                  ].map((ch) => {
                    const Icon = ch.icon;
                    const isSelected = channel === ch.id;
                    return (
                      <button
                        type="button"
                        key={ch.id}
                        onClick={() => setChannel(ch.id as ReminderChannel)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-[var(--bg-paper)] border-[var(--brand-electric)] shadow-sm'
                            : 'border-[var(--border-paper)] bg-[var(--bg-paper-warm)]'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-[var(--brand-electric)]' : 'text-[var(--ink-muted)]'}`} />
                        <span className="font-['Raleway'] font-bold text-xs text-[var(--ink-primary)]">
                          {ch.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message Template */}
              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  Message Content (Editable)
                </label>
                <textarea
                  rows={4}
                  required
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="input-paper w-full text-xs font-['Raleway'] p-3 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-paper)]">
                <button
                  type="button"
                  onClick={() => setReminderTarget(null)}
                  className="btn-subtle text-xs font-['Raleway'] font-bold px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary text-xs font-['Raleway'] font-bold px-5 py-2 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Sending...' : 'Dispatch Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

