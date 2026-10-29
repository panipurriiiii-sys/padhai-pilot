'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Check,
  X,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  Users,
  RotateCcw,
  Save,
  Lock,
  ChevronRight,
  Sparkles,
  FileText,
  UserCheck,
  UserX,
  HelpCircle,
  History,
  Info,
} from 'lucide-react';
import type { BatchSummary, AttendanceStatus } from '@padhai-pilot/shared';
import {
  CountUp,
  ShinyText,
  BlurText,
  MagnetButton,
  PushPin,
  StickyNote,
  Corkboard,
  CoffeeCup,
  YellowPencil,
  PolaroidCard,
} from './ui';

interface AttendanceRecordState {
  studentId: string;
  studentName: string;
  rollNumber: string;
  status: AttendanceStatus;
  note?: string;
  recentRate?: number;
}

interface AttendanceViewProps {
  batches: BatchSummary[];
  selectedBatchId?: string;
  onSaveAttendance: (data: {
    batchId: string;
    date: string;
    records: { studentId: string; status: AttendanceStatus; note?: string }[];
  }) => Promise<void>;
  loadSession: (batchId: string, date: string) => Promise<any>;
}

export function AttendanceView({
  batches,
  selectedBatchId,
  onSaveAttendance,
  loadSession,
}: AttendanceViewProps) {
  const [currentBatchId, setCurrentBatchId] = useState(
    selectedBatchId || batches[0]?.id || '',
  );
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().split('T')[0],
  );
  const [records, setRecords] = useState<AttendanceRecordState[]>([]);
  const [isRecorded, setIsRecorded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AttendanceStatus>('ALL');
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);

  // Finalize confirmation modal
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);

  // Correction audit reason modal
  const [correctionTarget, setCorrectionTarget] = useState<{
    studentId: string;
    studentName: string;
    newStatus: AttendanceStatus;
  } | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');

  // Row input references for keyboard accessibility
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  // Load session data
  useEffect(() => {
    if (!currentBatchId) return;

    let mounted = true;
    setIsLoading(true);
    setSaveSuccessMsg('');

    loadSession(currentBatchId, selectedDate)
      .then((res) => {
        if (!mounted) return;
        setIsRecorded(res.isRecorded || false);
        setRecords(
          res.records.map((r: any) => ({
            studentId: r.studentId,
            studentName: r.studentName,
            rollNumber: r.rollNumber || '-',
            status: r.status,
            note: r.note,
            recentRate: r.recentRate ?? 0,
          })),
        );
      })
      .catch((err) => {
        console.error('Failed to load attendance session:', err);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [currentBatchId, selectedDate, loadSession]);

  // Selected batch meta
  const currentBatch = useMemo(
    () => batches.find((b) => b.id === currentBatchId) || batches[0],
    [batches, currentBatchId],
  );

  // Computed summary metrics for the sticky notes
  const metrics = useMemo(() => {
    const total = records.length;
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const excused = records.filter((r) => r.status === 'EXCUSED').length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, late, excused, rate };
  }, [records]);

  // Filtered student list
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus =
        statusFilter === 'ALL' ? true : r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [records, searchQuery, statusFilter]);

  // Change individual status handler
  const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    const student = records.find((r) => r.studentId === studentId);
    if (!student) return;

    // If session is already finalized/recorded, trigger mandatory institutional correction slip
    if (isRecorded && student.status !== newStatus) {
      setCorrectionTarget({
        studentId,
        studentName: student.studentName,
        newStatus,
      });
      setCorrectionReason('');
      return;
    }

    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status: newStatus } : r)),
    );
  };

  // Confirm correction slip
  const confirmCorrection = () => {
    if (!correctionTarget || !correctionReason.trim()) return;

    setRecords((prev) =>
      prev.map((r) =>
        r.studentId === correctionTarget.studentId
          ? {
              ...r,
              status: correctionTarget.newStatus,
              note: `Corrected: ${correctionReason.trim()} [${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]`,
            }
          : r,
      ),
    );

    setCorrectionTarget(null);
    setCorrectionReason('');
  };

  // Bulk set status for all students in list
  const handleBulkSet = (status: AttendanceStatus) => {
    setRecords((prev) => prev.map((r) => ({ ...r, status })));
  };

  // Keyboard navigation & stamping (P, A, L, E, 1, 2, 3, 4, Arrow keys)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number, studentId: string) => {
      let targetStatus: AttendanceStatus | null = null;

      if (e.key === 'p' || e.key === 'P' || e.key === '1') targetStatus = 'PRESENT';
      else if (e.key === 'a' || e.key === 'A' || e.key === '2') targetStatus = 'ABSENT';
      else if (e.key === 'l' || e.key === 'L' || e.key === '3') targetStatus = 'LATE';
      else if (e.key === 'e' || e.key === 'E' || e.key === '4') targetStatus = 'EXCUSED';

      if (targetStatus) {
        e.preventDefault();
        handleStatusChange(studentId, targetStatus);
        // Advance to next row automatically
        const nextIndex = Math.min(index + 1, filteredRecords.length - 1);
        setActiveRowIndex(nextIndex);
        const nextStudent = filteredRecords[nextIndex];
        if (nextStudent) {
          const nextRowEl = rowRefs.current.get(nextStudent.studentId);
          nextRowEl?.focus();
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = Math.min(index + 1, filteredRecords.length - 1);
        setActiveRowIndex(nextIndex);
        const nextStudent = filteredRecords[nextIndex];
        if (nextStudent) {
          rowRefs.current.get(nextStudent.studentId)?.focus();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = Math.max(index - 1, 0);
        setActiveRowIndex(prevIndex);
        const prevStudent = filteredRecords[prevIndex];
        if (prevStudent) {
          rowRefs.current.get(prevStudent.studentId)?.focus();
        }
      }
    },
    [filteredRecords, isRecorded],
  );

  // Save draft
  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      await onSaveAttendance({
        batchId: currentBatchId,
        date: selectedDate,
        records: records.map((r) => ({
          studentId: r.studentId,
          status: r.status,
          note: r.note,
        })),
      });
      setSaveSuccessMsg('Attendance draft saved successfully to local register.');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Finalize attendance
  const handleFinalize = async () => {
    try {
      setIsSaving(true);
      await onSaveAttendance({
        batchId: currentBatchId,
        date: selectedDate,
        records: records.map((r) => ({
          studentId: r.studentId,
          status: r.status,
          note: r.note,
        })),
      });
      setIsRecorded(true);
      setShowFinalizeModal(false);
      setSaveSuccessMsg('Session officially verified and sealed. Audit log updated.');
      setTimeout(() => setSaveSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Finalize error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (batches.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-['Raleway'] font-bold tracking-wider mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
              OFFICIAL ACADEMIC REGISTRY
            </div>
            <h1 className="text-3xl md:text-4xl font-['Playfair_Display'] font-bold text-stone-900 tracking-tight">
              Daily Attendance Register
            </h1>
            <p className="text-sm font-['Raleway'] text-stone-600 mt-1 max-w-xl">
              Tangible roll call management with instantaneous attendance statistics, parent SMS triggers, and audited correction slips.
            </p>
          </div>
        </div>

        <div className="paper-card p-12 text-center space-y-3">
          <Users className="w-10 h-10 text-[var(--ink-muted)] mx-auto opacity-50" />
          <h3 className="font-['Playfair_Display'] font-bold text-lg text-[var(--ink-primary)]">
            No Active Batches Found
          </h3>
          <p className="font-['Raleway'] text-xs text-[var(--ink-muted)] max-w-md mx-auto">
            You must create at least one batch and enroll students before you can take attendance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16">
      {/* Studio Desk Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-['Raleway'] font-bold tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
            OFFICIAL ACADEMIC REGISTRY
          </div>
          <h1 className="text-3xl md:text-4xl font-['Playfair_Display'] font-bold text-stone-900 tracking-tight">
            Daily Attendance Register
          </h1>
          <p className="text-sm font-['Raleway'] text-stone-600 mt-1 max-w-xl">
            Tangible roll call management with instantaneous attendance statistics, parent SMS triggers, and audited correction slips.
          </p>
        </div>

        {/* Desk Accents: Coffee & Pencil */}
        <div className="hidden lg:flex items-center gap-6 select-none">
          <YellowPencil rotation={-15} />
          <CoffeeCup />
        </div>
      </div>

      {/* TOP SECTION: The Corkboard with 3D Pushpins and Colorful Pastel Sticky Notes */}
      <Corkboard title="Live Roll Call Pinboard">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Note 1: Batch & Quorum (Pastel Sunny Yellow) */}
          <StickyNote
            color="yellow"
            pinColor="blue"
            rotation={-1.5}
            title={currentBatch?.name || 'Class Batch'}
            badge="QUORUM"
            footer={
              <div className="flex items-center justify-between text-[11px] font-['Inter']">
                <span>Room: {currentBatch?.room || 'General Room'}</span>
                <span className="font-semibold">{currentBatch?.code || 'BATCH'}</span>
              </div>
            }
          >
            <p className="font-['Raleway'] font-medium text-xs">
              Subject: <strong className="font-bold">{currentBatch?.subject || 'Class Subject'}</strong>
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-['Inter'] text-[#713F12]">
                <CountUp to={metrics.total} duration={1} />
              </span>
              <span className="text-xs text-[#A16207]">Enrolled Candidates</span>
            </div>
          </StickyNote>

          {/* Note 2: Present Today (Pastel Sage Mint Green) */}
          <StickyNote
            color="mint"
            pinColor="green"
            rotation={1.2}
            title="Present in Hall"
            badge="ACTIVE"
            footer={
              <div className="flex items-center justify-between text-[11px] font-['Inter'] text-[#15803D]">
                <span>Rate: {metrics.rate}%</span>
                <span className="font-bold">✓ Quorum Met</span>
              </div>
            }
          >
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-['Inter'] text-[#14532D]">
                <CountUp to={metrics.present} duration={1} />
              </span>
              <span className="text-xs font-semibold text-[#166534]">
                of {metrics.total} verified
              </span>
            </div>
            <p className="text-[11px] text-[#15803D] mt-1">
              Biometric & physical headcount synchronized.
            </p>
          </StickyNote>

          {/* Note 3: Absentees Alert (Pastel Blush Pink) */}
          <StickyNote
            color="pink"
            pinColor="red"
            rotation={-0.8}
            title="Absentees"
            badge="SMS QUEUED"
            footer={
              <div className="flex items-center justify-between text-[11px] font-['Inter'] text-[#BE185D]">
                <span>SMS Alert: Auto</span>
                <span className="font-bold">09:15 AM</span>
              </div>
            }
          >
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-['Inter'] text-[#831843]">
                <CountUp to={metrics.absent} duration={1} />
              </span>
              <span className="text-xs font-semibold text-[#9D174D]">
                unexcused absent
              </span>
            </div>
            <p className="text-[11px] text-[#BE185D] mt-1">
              Automated parent SMS alert ready to dispatch upon ledger seal.
            </p>
          </StickyNote>

          {/* Note 4: Late & Excused (AK Pastel Tech Blue) */}
          <StickyNote
            color="blue"
            pinColor="blue"
            rotation={1.8}
            title="Late & Sanctions"
            badge="LEAVE SLIP"
            footer={
              <div className="flex items-center justify-between text-[11px] font-['Inter'] text-[#0369A1]">
                <span>Sanction: Signed</span>
                <span className="font-bold">Dean Validated</span>
              </div>
            }
          >
            <div className="flex items-baseline gap-3">
              <div>
                <span className="text-2xl font-bold font-['Inter'] text-[#0C4A6E]">
                  <CountUp to={metrics.late} duration={1} />
                </span>
                <span className="text-[11px] ml-1 font-semibold text-[#0369A1]">Late</span>
              </div>
              <span className="text-stone-300">/</span>
              <div>
                <span className="text-2xl font-bold font-['Inter'] text-[#0C4A6E]">
                  <CountUp to={metrics.excused} duration={1} />
                </span>
                <span className="text-[11px] ml-1 font-semibold text-[#0369A1]">Excused</span>
              </div>
            </div>
            <p className="text-[11px] text-[#0284C7] mt-1">
              Official medical slips or bus delay notes recorded.
            </p>
          </StickyNote>
        </div>
      </Corkboard>

      {/* Save Success Alert Banner */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-sm flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="font-['Raleway'] font-semibold text-xs md:text-sm">
            {saveSuccessMsg}
          </p>
        </div>
      )}

      {/* MAIN PIECE: The Master Academic Ledger / Physical Clipboard */}
      <div className="relative paper-card overflow-hidden">
        {/* Realistic Brass Clipboard Clamp at the top */}
        <div className="w-full flex justify-center -mt-3.5 mb-2 pointer-events-none select-none">
          <div className="relative px-8 py-2 rounded-b-xl bg-gradient-to-b from-[#D4AF37] via-[#F3E5AB] to-[#AA771C] border border-[#996515] shadow-md flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#5C4033] border border-amber-900/60 shadow-inner" />
            <span className="font-['Inter'] text-[10px] uppercase font-bold tracking-widest text-[#4A2F0F]">
              PADHAIPILOT ACADEMIC LEDGER • OFFICIAL REGISTER
            </span>
            <div className="w-2.5 h-2.5 rounded-full bg-[#5C4033] border border-amber-900/60 shadow-inner" />
          </div>
        </div>

        {/* Register Toolbar: Batch Picker, Date, Search, Quick Stamps */}
        <div className="p-6 border-b border-[var(--border-paper)] bg-[var(--bg-paper-warm)] space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Batch & Date Selectors */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Batch Selector */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[var(--border-paper)] shadow-sm">
                <Users className="w-4 h-4 text-amber-700" />
                <select
                  value={currentBatchId}
                  onChange={(e) => setCurrentBatchId(e.target.value)}
                  className="bg-transparent font-['Raleway'] font-bold text-xs text-[var(--ink-primary)] outline-none cursor-pointer"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selector */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[var(--border-paper)] shadow-sm">
                <Calendar className="w-4 h-4 text-amber-700" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent font-['Inter'] font-semibold text-xs text-[var(--ink-primary)] outline-none cursor-pointer"
                />
              </div>

              {/* Status Seal Pill */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-['Raleway'] font-bold border shadow-sm ${
                  isRecorded
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                }`}
              >
                {isRecorded ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-800" />
                    <span>Finalized & Sealed</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    <span>Live Roll Call Session</span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Bulk Action Stamps */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkSet('PRESENT')}
                className="btn-subtle"
                title="Mark all candidates present"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Mark All Present
              </button>

              <button
                onClick={() => handleBulkSet('ABSENT')}
                className="btn-secondary text-rose-700 border-rose-200"
                title="Mark all candidates absent"
              >
                <UserX className="w-3.5 h-3.5" />
                Mark All Absent
              </button>
            </div>
          </div>

          {/* Search & Filter Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            {/* Search Input */}
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-[var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidate name or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-paper w-full pl-9"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 bg-[var(--bg-surface-subtle)] p-1 rounded-xl border border-[var(--border-paper)]">
              {(['ALL', 'PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const).map((st) => {
                const count =
                  st === 'ALL'
                    ? records.length
                    : records.filter((r) => r.status === st).length;
                const isActive = statusFilter === st;

                return (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-['Raleway'] transition-all ${
                      isActive
                        ? 'bg-white text-[var(--ink-primary)] font-bold shadow-sm'
                        : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)] font-medium'
                    }`}
                  >
                    {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Keyboard Instructions Sub-banner */}
        <div className="px-6 py-2 bg-amber-50/70 border-b border-stone-200 text-[11px] font-['Raleway'] text-stone-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-amber-700" />
            <span>
              <strong>Speed Roll Call:</strong> Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-stone-300 font-mono font-bold text-[10px]">P</kbd> Present, <kbd className="px-1.5 py-0.5 rounded bg-white border border-stone-300 font-mono font-bold text-[10px]">A</kbd> Absent, <kbd className="px-1.5 py-0.5 rounded bg-white border border-stone-300 font-mono font-bold text-[10px]">L</kbd> Late, <kbd className="px-1.5 py-0.5 rounded bg-white border border-stone-300 font-mono font-bold text-[10px]">E</kbd> Excused. Arrow Up/Down to navigate.
            </span>
          </div>
          <span className="hidden md:inline font-['Inter'] font-semibold text-stone-500">
            {filteredRecords.length} student{filteredRecords.length === 1 ? '' : 's'} displayed
          </span>
        </div>

        {/* Roll Call Table (The Roster) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-[#FAF8F5] text-[11px] font-['Raleway'] font-bold text-stone-600 uppercase tracking-wider">
                <th className="py-3 px-5 w-12 text-center">#</th>
                <th className="py-3 px-5">Student / Candidate</th>
                <th className="py-3 px-5 w-36">Roll Number</th>
                <th className="py-3 px-5 w-32 text-center">Historical Rate</th>
                <th className="py-3 px-6 text-center w-80">Attendance Stamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400 font-['Raleway']">
                    No candidates matched the current search or filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((student, idx) => {
                  const isRowActive = activeRowIndex === idx;

                  return (
                    <tr
                      key={student.studentId}
                      ref={(el) => {
                        if (el) rowRefs.current.set(student.studentId, el);
                        else rowRefs.current.delete(student.studentId);
                      }}
                      tabIndex={0}
                      onFocus={() => setActiveRowIndex(idx)}
                      onKeyDown={(e) => handleKeyDown(e, idx, student.studentId)}
                      className={`transition-colors group outline-none ${
                        isRowActive
                          ? 'bg-amber-50/50'
                          : idx % 2 === 0
                          ? 'bg-white'
                          : 'bg-[#FFFDF9]'
                      } hover:bg-stone-50`}
                    >
                      {/* Index */}
                      <td className="py-3 px-5 text-center font-['Inter'] text-xs font-semibold text-stone-400">
                        {idx + 1}
                      </td>

                      {/* Student info with polaroid-style mini avatar */}
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center font-['Playfair_Display'] font-bold text-xs text-stone-700 shadow-sm">
                            {student.studentName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-['Raleway'] font-bold text-xs text-stone-900 group-hover:text-amber-800 transition-colors">
                              {student.studentName}
                            </p>
                            {student.note && (
                              <p className="font-['Inter'] text-[10px] text-amber-700 italic">
                                Note: {student.note}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Roll Number in Inter Font */}
                      <td className="py-3 px-5">
                        <span className="font-['Inter'] text-xs font-mono font-bold text-stone-700 bg-stone-100/80 px-2 py-0.5 rounded border border-stone-200">
                          {student.rollNumber}
                        </span>
                      </td>

                      {/* Historical Attendance Rate */}
                      <td className="py-3 px-5 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <div className="w-12 h-1.5 rounded-full bg-stone-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                (student.recentRate || 90) >= 85
                                  ? 'bg-emerald-500'
                                  : (student.recentRate || 90) >= 75
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${student.recentRate || 90}%` }}
                            />
                          </div>
                          <span className="font-['Inter'] text-xs font-semibold text-stone-600">
                            {student.recentRate}%
                          </span>
                        </div>
                      </td>

                      {/* Tactile Rubber Stamp Buttons (P, A, L, E) Using Global Stamp Classes */}
                      <td className="py-3 px-6">
                        <div className="flex items-center justify-center gap-2">
                          {/* PRESENT Stamp */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.studentId, 'PRESENT')}
                            className={`stamp-base ${
                              student.status === 'PRESENT'
                                ? 'stamp-p-active'
                                : 'bg-stone-100 hover:bg-emerald-50 border-stone-200 text-stone-600 font-semibold'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-600" />
                            <span>P</span>
                            <span className="text-[10px] hidden sm:inline">Present</span>
                          </button>

                          {/* ABSENT Stamp */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.studentId, 'ABSENT')}
                            className={`stamp-base ${
                              student.status === 'ABSENT'
                                ? 'stamp-a-active'
                                : 'bg-stone-100 hover:bg-rose-50 border-stone-200 text-stone-600 font-semibold'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-rose-600" />
                            <span>A</span>
                            <span className="text-[10px] hidden sm:inline">Absent</span>
                          </button>

                          {/* LATE Stamp */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.studentId, 'LATE')}
                            className={`stamp-base ${
                              student.status === 'LATE'
                                ? 'stamp-l-active'
                                : 'bg-stone-100 hover:bg-amber-50 border-stone-200 text-stone-600 font-semibold'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-amber-600" />
                            <span>L</span>
                            <span className="text-[10px] hidden sm:inline">Late</span>
                          </button>

                          {/* EXCUSED Stamp */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.studentId, 'EXCUSED')}
                            className={`stamp-base ${
                              student.status === 'EXCUSED'
                                ? 'stamp-e-active'
                                : 'bg-stone-100 hover:bg-sky-50 border-stone-200 text-stone-600 font-semibold'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-sky-600" />
                            <span>E</span>
                            <span className="text-[10px] hidden sm:inline">Excused</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Register Footer Actions: Save Draft & Finalize Seal */}
        <div className="p-6 border-t border-[var(--border-paper)] bg-[var(--bg-paper-warm)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-['Raleway'] text-[var(--ink-muted)]">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Audited & verified against institutional coaching roll standards.</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Save Draft Button (Global btn-secondary) */}
            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="btn-secondary disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[var(--ink-muted)]" />
              <span>{isSaving ? 'Saving...' : 'Save Draft Register'}</span>
            </button>

            {/* Finalize Button (Global btn-primary) */}
            <button
              onClick={() => setShowFinalizeModal(true)}
              disabled={isSaving || isRecorded}
              className={
                isRecorded
                  ? 'btn-secondary cursor-not-allowed opacity-60'
                  : 'btn-primary'
              }
            >
              <Lock className="w-4 h-4 text-amber-200" />
              <span>{isRecorded ? 'Ledger Sealed' : 'Verify & Seal Register'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* FINALIZATION CONFIRMATION MODAL */}
      {showFinalizeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border border-stone-300 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-['Playfair_Display'] font-bold text-lg text-stone-900">
                  Seal Daily Attendance Register
                </h3>
                <p className="font-['Raleway'] text-xs text-stone-600">
                  {currentBatch?.name} • {selectedDate}
                </p>
              </div>
            </div>

            <p className="font-['Raleway'] text-xs text-stone-700 leading-relaxed">
              Sealing this session locks the attendance counts ({metrics.present} Present, {metrics.absent} Absent). Subsequent alterations will mandate an official <strong>Faculty Correction Slip</strong> with an audit reason.
            </p>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-['Raleway'] text-amber-900 space-y-1">
              <p className="font-bold">Automated Dispatch:</p>
              <p>• SMS notification will be dispatched to parents of the {metrics.absent} absent student(s).</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowFinalizeModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalize}
                disabled={isSaving}
                className="btn-primary"
              >
                {isSaving ? 'Sealing...' : 'Confirm & Seal Ledger'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CORRECTION SLIP AUDIT MODAL */}
      {correctionTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border-2 border-dashed border-stone-400 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
              <History className="w-5 h-5 text-amber-700" />
              <h3 className="font-['Playfair_Display'] font-bold text-lg text-stone-900">
                Institutional Correction Slip
              </h3>
            </div>

            <p className="font-['Raleway'] text-xs text-stone-700 leading-relaxed">
              This session was already officially sealed. To change <strong>{correctionTarget.studentName}</strong>'s attendance to <strong>{correctionTarget.newStatus}</strong>, state the authorized academic reason:
            </p>

            <div>
              <label className="block font-['Raleway'] font-bold text-xs text-stone-800 mb-1">
                Correction Reason / Reference (Mandatory)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Student arrived 15 mins late due to institute bus breakdown; verified by transportation in-charge."
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                className="w-full bg-white p-3 rounded-xl border border-stone-300 text-xs font-['Raleway'] text-stone-900 focus:outline-none focus:border-stone-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setCorrectionTarget(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-['Raleway'] font-semibold text-xs"
              >
                Discard Change
              </button>
              <button
                onClick={confirmCorrection}
                disabled={!correctionReason.trim()}
                className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-['Raleway'] font-bold text-xs shadow-md disabled:opacity-50"
              >
                Sign Correction Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
