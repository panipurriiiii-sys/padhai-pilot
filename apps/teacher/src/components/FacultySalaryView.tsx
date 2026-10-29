'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  IndianRupee,
  Receipt,
  Search,
  Building,
  User,
  X,
  FileSpreadsheet,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { teacherApi } from '../lib/api';
import type {
  SalaryStatementItem,
  FacultyMember,
  GenerateSalaryDto,
  RecordSalaryPaymentDto,
  TuitionBrandingProfile,
} from '@padhai-pilot/shared';

interface FacultySalaryViewProps {
  instituteName?: string;
}

export function FacultySalaryView({
  instituteName = 'Apex IIT-JEE & Medical Academy',
}: FacultySalaryViewProps) {
  const [salaries, setSalaries] = useState<SalaryStatementItem[]>([]);
  const [faculties, setFaculties] = useState<FacultyMember[]>([]);
  const [profile, setProfile] = useState<TuitionBrandingProfile | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-10');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<SalaryStatementItem | null>(null);
  const [salarySlipTarget, setSalarySlipTarget] = useState<SalaryStatementItem | null>(null);

  // Generate Salary Form
  const [generateForm, setGenerateForm] = useState<GenerateSalaryDto>({
    facultyId: '',
    payPeriod: '2026-10',
    compensationModel: 'FIXED_MONTHLY',
    classesConducted: 20,
    baseAmount: 65000,
    additions: 0,
    deductions: 0,
    advances: 0,
    remarks: '',
  });

  // Record Payment Form
  const [paymentForm, setPaymentForm] = useState<RecordSalaryPaymentDto>({
    paymentMethod: 'BANK_TRANSFER',
    paymentReference: '',
    paymentDate: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  async function loadData() {
    setIsLoading(true);
    try {
      const [salList, facList, prof] = await Promise.all([
        teacherApi.getSalaries(selectedPeriod),
        teacherApi.getFaculties(),
        teacherApi.getTuitionProfile(),
      ]);
      setSalaries(salList);
      setFaculties(facList);
      setProfile(prof);
      if (facList.length > 0 && !generateForm.facultyId) {
        setGenerateForm((prev) => ({
          ...prev,
          facultyId: facList[0].userId,
          baseAmount: facList[0].baseSalary,
          compensationModel: facList[0].compensationType,
        }));
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGenerateSalary(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await teacherApi.generateSalary(generateForm);
      setSalaries((prev) => {
        const filtered = prev.filter((s) => s.id !== result.id && s.facultyId !== result.facultyId);
        return [result, ...filtered];
      });
      setShowGenerateModal(false);
      setToastMessage(`Salary statement generated for ${result.facultyName}!`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentTarget) return;

    setIsSubmitting(true);
    try {
      const updated = await teacherApi.recordSalaryPayment(paymentTarget.id, paymentForm);
      setSalaries((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setPaymentTarget(null);
      setToastMessage(`Payment recorded successfully via ${updated.paymentMethod}!`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  }

  const totalPayroll = salaries.reduce((sum, s) => sum + s.netPayable, 0);
  const totalPaid = salaries.filter((s) => s.status === 'PAID').reduce((sum, s) => sum + s.netPayable, 0);
  const totalPending = totalPayroll - totalPaid;

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
              Tuition Owner • Financial Operations & Compensation
            </span>
            <span className="badge-code font-['Inter'] text-[10px]">PAYROLL LEDGER</span>
          </div>
          <h1 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold tracking-tight text-[var(--ink-primary)] mt-1">
            Faculty Salary & Remuneration
          </h1>
          <p className="font-['Raleway'] text-xs text-[var(--ink-muted)] mt-1">
            Review monthly compensation statements, calculate net payables, record payments, and print branded salary slips.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="select-paper text-xs py-2 px-3 font-['Inter'] font-semibold"
          >
            <option value="2026-10">October 2026</option>
            <option value="2026-09">September 2026</option>
            <option value="2026-08">August 2026</option>
          </select>

          <button
            onClick={() => setShowGenerateModal(true)}
            className="btn-primary text-xs font-['Raleway'] font-bold px-4 py-2.5 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Generate Statement
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="kpi-card">
          <span className="text-[11px] font-['Raleway'] font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
            Total Monthly Payroll ({selectedPeriod})
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-['Inter'] text-2xl font-bold text-[var(--ink-primary)]">
              ₹{totalPayroll.toLocaleString()}
            </span>
            <span className="font-['Inter'] text-[10px] text-[var(--ink-muted)]">
              across {salaries.length} staff
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <span className="text-[11px] font-['Raleway'] font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
            Disbursed & Cleared
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-['Inter'] text-2xl font-bold text-emerald-700">
              ₹{totalPaid.toLocaleString()}
            </span>
            <span className="text-[10px] font-['Raleway'] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
              Paid
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <span className="text-[11px] font-['Raleway'] font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
            Pending Approval & Clearance
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-['Inter'] text-2xl font-bold text-amber-700">
              ₹{totalPending.toLocaleString()}
            </span>
            <span className="font-['Raleway'] text-[10px] text-[var(--ink-muted)]">
              Requires payment UTR
            </span>
          </div>
        </div>
      </div>

      {/* Salary Records Table */}
      <div className="paper-card overflow-hidden">
        <div className="p-4 border-b border-[var(--border-paper)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[var(--brand-electric)]" />
            <h3 className="font-['Playfair_Display'] font-bold text-base text-[var(--ink-primary)]">
              Pay Period Ledger: {selectedPeriod}
            </h3>
          </div>
          <span className="font-['Inter'] text-xs text-[var(--ink-muted)]">
            {salaries.length} Records
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs font-['Raleway'] text-[var(--ink-muted)]">
            Loading salary records...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-paper)] bg-[var(--bg-surface-subtle)] text-[10px] font-['Raleway'] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Model & Base</th>
                  <th className="py-3 px-4">Additions</th>
                  <th className="py-3 px-4">Deductions</th>
                  <th className="py-3 px-4">Net Payable</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-paper)] font-['Inter']">
                {salaries.map((record) => (
                  <tr key={record.id} className="hover:bg-[var(--bg-paper-warm)] transition-colors">
                    {/* Faculty */}
                    <td className="py-3 px-4">
                      <div className="font-['Playfair_Display'] font-bold text-xs text-[var(--ink-primary)]">
                        {record.facultyName}
                      </div>
                      <div className="font-['Raleway'] text-[10px] text-[var(--ink-muted)]">
                        {record.designation} • {record.staffId}
                      </div>
                    </td>

                    {/* Base */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-[var(--ink-primary)]">
                        ₹{record.baseAmount.toLocaleString()}
                      </div>
                      <div className="font-['Raleway'] text-[10px] text-[var(--ink-muted)]">
                        {record.compensationModel === 'FIXED_MONTHLY' ? 'Fixed Monthly' : `${record.classesConducted} classes`}
                      </div>
                    </td>

                    {/* Additions */}
                    <td className="py-3 px-4 text-emerald-700">
                      +₹{record.additions.toLocaleString()}
                    </td>

                    {/* Deductions */}
                    <td className="py-3 px-4 text-rose-700">
                      -₹{(record.deductions + record.advances).toLocaleString()}
                    </td>

                    {/* Net */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-sm text-[var(--brand-electric)]">
                        ₹{record.netPayable.toLocaleString()}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-['Raleway'] font-bold uppercase tracking-wider ${
                          record.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : record.status === 'APPROVED'
                            ? 'bg-blue-50 text-[var(--brand-electric)] border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {record.status}
                      </span>
                      {record.paymentReference && (
                        <div className="text-[10px] text-[var(--ink-muted)] truncate max-w-[120px] mt-0.5 font-['Inter']">
                          Ref: {record.paymentReference}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {record.status !== 'PAID' && (
                          <button
                            onClick={() => {
                              setPaymentTarget(record);
                              setPaymentForm({
                                paymentMethod: 'BANK_TRANSFER',
                                paymentReference: `NEFT/HDFC/${Date.now().toString().slice(-7)}`,
                                paymentDate: new Date().toISOString().split('T')[0],
                                remarks: 'Batch salary clearance',
                              });
                            }}
                            className="btn-secondary text-[10px] font-['Raleway'] font-bold px-2.5 py-1.5"
                          >
                            <CreditCard className="w-3 h-3 inline mr-1" />
                            Record Pay
                          </button>
                        )}
                        <button
                          onClick={() => setSalarySlipTarget(record)}
                          className="btn-subtle text-[10px] font-['Raleway'] font-bold px-2.5 py-1.5"
                        >
                          <Receipt className="w-3 h-3 inline mr-1" />
                          Salary Slip
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* BRANDED SALARY SLIP MODAL */}
      {/* ------------------------------------------------------------------- */}
      {salarySlipTarget && profile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="paper-card p-8 max-w-2xl w-full bg-[var(--bg-paper)] shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto print:p-0">
            {/* Tuition Branding Letterhead */}
            <div className="flex items-start justify-between pb-4 border-b-2 border-stone-800">
              <div className="space-y-1">
                <h2 className="font-['Playfair_Display'] font-bold text-xl text-[var(--ink-primary)]">
                  {profile.name}
                </h2>
                <p className="font-['Raleway'] text-xs text-[var(--ink-secondary)] max-w-md leading-relaxed">
                  {profile.address || 'Knowledge Park, Silicon Corridor'}
                </p>
                <div className="font-['Inter'] text-[10px] text-[var(--ink-muted)]">
                  Phone: {profile.contactPhone || '+91 98230 45678'} • Email: {profile.contactEmail || 'office@apexacademy.edu.in'}
                </div>
              </div>

              <div className="text-right">
                <div className="w-10 h-10 rounded-xl bg-[var(--brand-electric)] text-white font-['Playfair_Display'] font-bold flex items-center justify-center text-lg ml-auto shadow-sm">
                  P
                </div>
                <span className="badge-code font-['Inter'] text-[10px] mt-2 inline-block">
                  ACADEMIC YEAR {profile.academicYear}
                </span>
              </div>
            </div>

            {/* Slip Title */}
            <div className="text-center py-2 bg-[var(--bg-surface-subtle)] rounded-lg border border-[var(--border-paper)]">
              <h3 className="font-['Raleway'] font-bold text-xs uppercase tracking-widest text-[var(--ink-primary)]">
                Faculty Salary & Remuneration Statement
              </h3>
              <p className="font-['Inter'] text-xs text-[var(--brand-electric)] font-bold mt-0.5">
                Pay Period: {salarySlipTarget.payPeriod}
              </p>
            </div>

            {/* Faculty Information Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] text-xs font-['Raleway']">
              <div>
                <span className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider block font-semibold">
                  Faculty Name
                </span>
                <span className="font-['Playfair_Display'] font-bold text-sm text-[var(--ink-primary)] block mt-0.5">
                  {salarySlipTarget.facultyName}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider block font-semibold">
                  Staff Identifier
                </span>
                <span className="font-['Inter'] font-bold text-xs text-[var(--ink-primary)] block mt-0.5">
                  {salarySlipTarget.staffId}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider block font-semibold">
                  Designation / Department
                </span>
                <span className="font-bold text-[var(--ink-secondary)] block mt-0.5">
                  {salarySlipTarget.designation}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider block font-semibold">
                  Payment Status
                </span>
                <span className="font-['Inter'] font-bold text-emerald-700 block mt-0.5">
                  {salarySlipTarget.status} • {salarySlipTarget.paymentMethod || 'BANK TRANSFER'}
                </span>
              </div>
            </div>

            {/* Earnings & Deductions Table */}
            <div className="space-y-3">
              <table className="w-full text-xs border border-[var(--border-paper)]">
                <thead>
                  <tr className="bg-[var(--bg-surface-subtle)] border-b border-[var(--border-paper)] font-['Raleway'] font-bold text-[10px] uppercase text-[var(--ink-muted)]">
                    <th className="p-2.5 text-left">Earnings Head</th>
                    <th className="p-2.5 text-right">Amount (₹)</th>
                    <th className="p-2.5 text-left border-l border-[var(--border-paper)]">Deductions Head</th>
                    <th className="p-2.5 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-paper)] font-['Inter']">
                  <tr>
                    <td className="p-2.5 font-['Raleway']">Basic Remuneration</td>
                    <td className="p-2.5 text-right font-semibold">
                      ₹{salarySlipTarget.baseAmount.toLocaleString()}
                    </td>
                    <td className="p-2.5 font-['Raleway'] border-l border-[var(--border-paper)]">TDS / Deductions</td>
                    <td className="p-2.5 text-right font-semibold text-rose-700">
                      ₹{salarySlipTarget.deductions.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-['Raleway']">Special Incentives / Bonus</td>
                    <td className="p-2.5 text-right font-semibold text-emerald-700">
                      ₹{salarySlipTarget.additions.toLocaleString()}
                    </td>
                    <td className="p-2.5 font-['Raleway'] border-l border-[var(--border-paper)]">Salary Advances</td>
                    <td className="p-2.5 text-right font-semibold text-rose-700">
                      ₹{salarySlipTarget.advances.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-[var(--bg-paper-warm)] font-bold">
                    <td className="p-2.5 font-['Raleway']">Gross Earnings</td>
                    <td className="p-2.5 text-right">
                      ₹{(salarySlipTarget.baseAmount + salarySlipTarget.additions).toLocaleString()}
                    </td>
                    <td className="p-2.5 font-['Raleway'] border-l border-[var(--border-paper)]">Total Deductions</td>
                    <td className="p-2.5 text-right text-rose-700">
                      ₹{(salarySlipTarget.deductions + salarySlipTarget.advances).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Net Remuneration Banner */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 border border-blue-200">
                <span className="font-['Raleway'] font-bold text-xs uppercase tracking-wider text-blue-900">
                  Net Remuneration Disbursed:
                </span>
                <span className="font-['Inter'] font-bold text-xl text-[var(--brand-electric)]">
                  ₹{salarySlipTarget.netPayable.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Signatory Footer */}
            <div className="flex items-end justify-between pt-8 border-t border-[var(--border-paper)] text-xs font-['Raleway']">
              <div>
                <p className="text-[10px] text-[var(--ink-muted)]">
                  System Generated via PadhaiPilot Coaching ERP
                </p>
                <p className="font-['Inter'] text-[10px] text-[var(--ink-faint)]">
                  Generated: {new Date().toLocaleDateString('en-IN')}
                </p>
              </div>

              <div className="text-right space-y-1">
                <div className="font-['Playfair_Display'] font-bold text-xs text-[var(--ink-primary)]">
                  {profile.signatoryName || 'Dr. Anand K. Kulkarni'}
                </div>
                <div className="text-[10px] text-[var(--ink-muted)]">
                  {profile.signatoryTitle || 'Founder & Academic Director'}
                </div>
                <div className="stamp-base font-['Inter'] text-[9px] uppercase px-2 py-0.5 inline-block text-[var(--brand-electric)] border-[var(--brand-electric)]">
                  VERIFIED SIGNATURE
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-paper)]">
              <button
                type="button"
                onClick={() => setSalarySlipTarget(null)}
                className="btn-subtle text-xs font-['Raleway'] font-bold px-4 py-2"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-primary text-xs font-['Raleway'] font-bold px-4 py-2 flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* RECORD PAYMENT MODAL */}
      {/* ------------------------------------------------------------------- */}
      {paymentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="paper-card p-6 max-w-md w-full bg-[var(--bg-paper)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-paper)]">
              <div>
                <h3 className="font-['Playfair_Display'] text-lg font-bold text-[var(--ink-primary)]">
                  Record Salary Payment
                </h3>
                <p className="font-['Raleway'] text-xs text-[var(--ink-muted)]">
                  {paymentTarget.facultyName} • Net: ₹{paymentTarget.netPayable.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setPaymentTarget(null)}
                className="p-1 rounded-lg text-[var(--ink-muted)] hover:bg-[var(--bg-secondary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="select-paper w-full text-xs font-['Raleway'] py-2"
                >
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
                  <option value="UPI">UPI Transfer</option>
                  <option value="CHEQUE">Cheque Clearance</option>
                  <option value="CASH">Cash Disbursement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  Transaction Reference / UTR / Cheque Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UTR-20261029-88123"
                  value={paymentForm.paymentReference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentReference: e.target.value })}
                  className="input-paper w-full text-xs font-['Inter'] py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  Payment Clearance Date *
                </label>
                <input
                  type="date"
                  required
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="input-paper w-full text-xs font-['Inter'] py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cleared via HDFC Corporate Account"
                  value={paymentForm.remarks || ''}
                  onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                  className="input-paper w-full text-xs font-['Raleway'] py-2"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-paper)]">
                <button
                  type="button"
                  onClick={() => setPaymentTarget(null)}
                  className="btn-subtle text-xs font-['Raleway'] font-bold px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary text-xs font-['Raleway'] font-bold px-5 py-2"
                >
                  {isSubmitting ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* GENERATE STATEMENT MODAL */}
      {/* ------------------------------------------------------------------- */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="paper-card p-6 md:p-8 max-w-lg w-full bg-[var(--bg-paper)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-paper)]">
              <div>
                <h3 className="font-['Playfair_Display'] text-xl font-bold text-[var(--ink-primary)]">
                  Generate Salary Statement
                </h3>
                <p className="font-['Raleway'] text-xs text-[var(--ink-muted)]">
                  Calculate compensation breakdown for pay period {selectedPeriod}.
                </p>
              </div>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-1 rounded-lg text-[var(--ink-muted)] hover:bg-[var(--bg-secondary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateSalary} className="space-y-3.5">
              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  Faculty Member *
                </label>
                <select
                  value={generateForm.facultyId}
                  onChange={(e) => {
                    const selected = faculties.find((f) => f.userId === e.target.value);
                    setGenerateForm({
                      ...generateForm,
                      facultyId: e.target.value,
                      baseAmount: selected ? selected.baseSalary : generateForm.baseAmount,
                      compensationModel: selected ? selected.compensationType : generateForm.compensationModel,
                    });
                  }}
                  className="select-paper w-full text-xs font-['Raleway'] py-2"
                  required
                >
                  {faculties.map((f) => (
                    <option key={f.id} value={f.userId}>
                      {f.fullName} ({f.staffId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                    Pay Period
                  </label>
                  <input
                    type="text"
                    value={generateForm.payPeriod}
                    onChange={(e) => setGenerateForm({ ...generateForm, payPeriod: e.target.value })}
                    className="input-paper w-full text-xs font-['Inter'] py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                    Base Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={generateForm.baseAmount}
                    onChange={(e) =>
                      setGenerateForm({ ...generateForm, baseAmount: parseFloat(e.target.value) || 0 })
                    }
                    className="input-paper w-full text-xs font-['Inter'] py-2"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                    Additions (+)
                  </label>
                  <input
                    type="number"
                    value={generateForm.additions || 0}
                    onChange={(e) =>
                      setGenerateForm({ ...generateForm, additions: parseFloat(e.target.value) || 0 })
                    }
                    className="input-paper w-full text-xs font-['Inter'] py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                    Deductions (-)
                  </label>
                  <input
                    type="number"
                    value={generateForm.deductions || 0}
                    onChange={(e) =>
                      setGenerateForm({ ...generateForm, deductions: parseFloat(e.target.value) || 0 })
                    }
                    className="input-paper w-full text-xs font-['Inter'] py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                    Advances (-)
                  </label>
                  <input
                    type="number"
                    value={generateForm.advances || 0}
                    onChange={(e) =>
                      setGenerateForm({ ...generateForm, advances: parseFloat(e.target.value) || 0 })
                    }
                    className="input-paper w-full text-xs font-['Inter'] py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-['Raleway'] font-bold text-[var(--ink-secondary)] mb-1">
                  Remarks / Special Allowances
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sunday problem solving bonus included"
                  value={generateForm.remarks || ''}
                  onChange={(e) => setGenerateForm({ ...generateForm, remarks: e.target.value })}
                  className="input-paper w-full text-xs font-['Raleway'] py-2"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-paper)]">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="btn-subtle text-xs font-['Raleway'] font-bold px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary text-xs font-['Raleway'] font-bold px-5 py-2"
                >
                  {isSubmitting ? 'Generating...' : 'Create Statement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

