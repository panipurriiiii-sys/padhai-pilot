'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  Download,
  Search,
  Filter,
  CheckSquare,
  Square,
  RefreshCw,
  Edit3,
  Calendar,
  Layers,
  Award,
  AlertTriangle,
  History,
  X,
  Printer,
  ChevronRight,
  UserCheck,
  UserX,
} from 'lucide-react';
import {
  ClassroomAssessment,
  AssessmentMarkItem,
  BatchSummary,
  StudentRosterItem,
  AttendanceStatus,
  ResultStatus,
  AssessmentType,
  calculateGradeAndPercentage,
} from '@padhai-pilot/shared';
import { teacherApi } from '../lib/api';

interface BulkMarksEntryViewProps {
  batches: BatchSummary[];
  selectedBatchId?: string;
  onSelectBatch?: (batchId: string) => void;
}

export function BulkMarksEntryView({
  batches,
  selectedBatchId: initialBatchId,
}: BulkMarksEntryViewProps) {
  // 1. Class & Assessment Setup State
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    initialBatchId || (batches.length > 0 ? batches[0].id : ''),
  );
  const [assessmentList, setAssessmentList] = useState<ClassroomAssessment[]>([]);
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string>('');
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<AssessmentType>('UNIT_TEST');
  const [assessmentDate, setAssessmentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [maxMarks, setMaxMarks] = useState<number>(50);
  const [passingMarks, setPassingMarks] = useState<number>(20);
  const [instructions, setInstructions] = useState('');
  const [assessmentStatus, setAssessmentStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');

  // 2. Marks Roster Table State
  const [roster, setRoster] = useState<AssessmentMarkItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<'ALL' | AttendanceStatus>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 3. Review & Correction Modals
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccessData, setPublishSuccessData] = useState<{ publishedCount: number; message: string } | null>(null);

  const [correctionTarget, setCorrectionTarget] = useState<AssessmentMarkItem | null>(null);
  const [correctionNewMarks, setCorrectionNewMarks] = useState<string>('');
  const [correctionReason, setCorrectionReason] = useState<string>('');
  const [isCorrecting, setIsCorrecting] = useState(false);

  // Ref for keyboard navigation between obtained marks inputs
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Load assessments and students for selected batch
  useEffect(() => {
    async function loadBatchData() {
      if (!selectedBatchId) return;
      setIsLoading(true);
      try {
        const [assessments, rosterData] = await Promise.all([
          teacherApi.getAssessments(selectedBatchId),
          teacherApi.getBatchRoster(selectedBatchId),
        ]);

        setAssessmentList(assessments);

        if (assessments.length > 0) {
          const first = assessments[0];
          setCurrentAssessmentId(first.id);
          setAssessmentTitle(first.title);
          setSubject(first.subject);
          setCategory(first.category);
          setAssessmentDate(first.assessmentDate.split('T')[0]);
          setMaxMarks(first.maxMarks);
          setPassingMarks(first.passingMarks || Math.round(first.maxMarks * 0.4));
          setInstructions(first.instructions || '');
          setAssessmentStatus(first.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT');

          // Load details
          const details = await teacherApi.getAssessmentDetails(first.id);
          setRoster(details.roster);
        } else {
          // Initialize fresh roster from students
          const initialTable: AssessmentMarkItem[] = rosterData.students.map((s) => ({
            studentId: s.id,
            studentName: s.fullName,
            rollNumber: s.rollNumber,
            attendanceStatus: 'PRESENT',
            obtainedMarks: null,
            percentage: null,
            grade: null,
            resultStatus: 'PENDING',
            feedback: '',
            isPublished: false,
            isEligible: true,
          }));
          setRoster(initialTable);
          setCurrentAssessmentId('');
          setAssessmentStatus('DRAFT');
        }
      } catch (err) {
        console.error('Failed to load batch assessment data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadBatchData();
  }, [selectedBatchId]);

  // Handle switching assessment selection
  const handleSelectExistingAssessment = async (asmId: string) => {
    if (!asmId) return;
    setIsLoading(true);
    try {
      const details = await teacherApi.getAssessmentDetails(asmId);
      const a = details.assessment;
      setCurrentAssessmentId(a.id);
      setAssessmentTitle(a.title);
      setSubject(a.subject);
      setCategory(a.category);
      setAssessmentDate(a.assessmentDate.split('T')[0]);
      setMaxMarks(a.maxMarks);
      setPassingMarks(a.passingMarks || Math.round(a.maxMarks * 0.4));
      setInstructions(a.instructions || '');
      setAssessmentStatus(a.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT');
      setRoster(details.roster);
      setPublishSuccessData(null);
    } catch (err) {
      console.error('Failed to load assessment details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Start a new blank assessment
  const handleStartNewAssessment = async () => {
    setCurrentAssessmentId('');
    setAssessmentTitle(`Class Assessment #${assessmentList.length + 1} — ${new Date().toLocaleDateString()}`);
    setAssessmentStatus('DRAFT');
    setMaxMarks(50);
    setPassingMarks(20);
    setPublishSuccessData(null);

    const rosterData = await teacherApi.getBatchRoster(selectedBatchId);
    setRoster(
      rosterData.students.map((s) => ({
        studentId: s.id,
        studentName: s.fullName,
        rollNumber: s.rollNumber,
        attendanceStatus: 'PRESENT',
        obtainedMarks: null,
        percentage: null,
        grade: null,
        resultStatus: 'PENDING',
        feedback: '',
        isPublished: false,
        isEligible: true,
      })),
    );
  };

  // -------------------------------------------------------------
  // ATTENDANCE & ELIGIBILITY TOGGLE ACTIONS
  // -------------------------------------------------------------
  const handleToggleSelectAll = (checked: boolean) => {
    setRoster((prev) => prev.map((item) => ({ ...item, isEligible: checked })));
  };

  const handleToggleSelectStudent = (studentId: string) => {
    setRoster((prev) =>
      prev.map((item) =>
        item.studentId === studentId ? { ...item, isEligible: !item.isEligible } : item,
      ),
    );
  };

  const handleMarkAllAttendance = (status: AttendanceStatus) => {
    setRoster((prev) =>
      prev.map((item) => {
        if (!item.isEligible) return item;

        // If marking absent, obtained marks must be null (do not silently score zero)
        if (status === 'ABSENT') {
          return {
            ...item,
            attendanceStatus: status,
            obtainedMarks: null,
            percentage: null,
            grade: null,
            resultStatus: 'ABSENT',
          };
        }

        return {
          ...item,
          attendanceStatus: status,
          resultStatus: item.obtainedMarks !== null ? 'SCORED' : 'PENDING',
        };
      }),
    );
  };

  const handleSetStudentAttendance = (studentId: string, status: AttendanceStatus) => {
    setRoster((prev) =>
      prev.map((item) => {
        if (item.studentId !== studentId) return item;

        if (status === 'ABSENT') {
          return {
            ...item,
            attendanceStatus: status,
            obtainedMarks: null,
            percentage: null,
            grade: null,
            resultStatus: 'ABSENT',
          };
        }

        const isScored = item.obtainedMarks !== null && item.obtainedMarks !== undefined;
        return {
          ...item,
          attendanceStatus: status,
          resultStatus: isScored ? 'SCORED' : 'PENDING',
        };
      }),
    );
  };

  // -------------------------------------------------------------
  // OBTAINED MARKS INPUT & KEYBOARD NAVIGATION
  // -------------------------------------------------------------
  const handleMarksChange = (studentId: string, value: string) => {
    setRoster((prev) =>
      prev.map((item) => {
        if (item.studentId !== studentId) return item;

        if (value.trim() === '') {
          return {
            ...item,
            obtainedMarks: null,
            percentage: null,
            grade: null,
            resultStatus: item.attendanceStatus === 'ABSENT' ? 'ABSENT' : 'PENDING',
          };
        }

        const num = parseFloat(value);
        if (isNaN(num)) {
          return item; // Ignore non-numeric strings
        }

        const { percentage, grade } = calculateGradeAndPercentage(num, maxMarks);
        return {
          ...item,
          obtainedMarks: num,
          percentage,
          grade,
          resultStatus: 'SCORED',
          attendanceStatus: item.attendanceStatus === 'ABSENT' ? 'PRESENT' : item.attendanceStatus,
        };
      }),
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentIndex: number) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      const nextItem = filteredRoster[currentIndex + 1];
      if (nextItem) {
        inputRefs.current.get(nextItem.studentId)?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevItem = filteredRoster[currentIndex - 1];
      if (prevItem) {
        inputRefs.current.get(prevItem.studentId)?.focus();
      }
    }
  };

  // -------------------------------------------------------------
  // FILTERED ROSTER & COMPUTED COUNTERS
  // -------------------------------------------------------------
  const filteredRoster = useMemo(() => {
    return roster.filter((item) => {
      const matchSearch =
        item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchAttendance =
        attendanceFilter === 'ALL' || item.attendanceStatus === attendanceFilter;

      return matchSearch && matchAttendance;
    });
  }, [roster, searchQuery, attendanceFilter]);

  const summary = useMemo(() => {
    const eligible = roster.filter((r) => r.isEligible !== false);
    const present = eligible.filter((r) => r.attendanceStatus === 'PRESENT').length;
    const absent = eligible.filter((r) => r.attendanceStatus === 'ABSENT').length;
    const scored = eligible.filter((r) => r.resultStatus === 'SCORED').length;
    const pending = eligible.filter((r) => r.resultStatus === 'PENDING').length;

    const invalidRows = eligible.filter(
      (r) =>
        r.obtainedMarks !== null &&
        r.obtainedMarks !== undefined &&
        (r.obtainedMarks < 0 || r.obtainedMarks > maxMarks),
    );

    const unmarkedPresent = eligible.filter(
      (r) =>
        r.attendanceStatus === 'PRESENT' &&
        (r.obtainedMarks === null || r.obtainedMarks === undefined),
    );

    return {
      total: eligible.length,
      present,
      absent,
      scored,
      pending,
      invalidCount: invalidRows.length,
      unmarkedCount: unmarkedPresent.length,
      canPublish: invalidRows.length === 0 && unmarkedPresent.length === 0 && eligible.length > 0,
    };
  }, [roster, maxMarks]);

  // -------------------------------------------------------------
  // ACTIONS: SAVE DRAFT & PUBLISH
  // -------------------------------------------------------------
  const handleSaveDraft = async () => {
    setIsLoading(true);
    setSaveMessage(null);

    try {
      const payload = {
        assessmentId: currentAssessmentId || undefined,
        batchId: selectedBatchId,
        subject,
        title: assessmentTitle,
        category,
        assessmentDate,
        maxMarks,
        passingMarks,
        instructions,
        marks: roster.map((r) => ({
          studentId: r.studentId,
          attendanceStatus: r.attendanceStatus,
          obtainedMarks: r.obtainedMarks,
          feedback: r.feedback,
          isEligible: r.isEligible,
        })),
      };

      const res = await teacherApi.saveDraftMarks(payload);
      if (res.assessmentId) {
        setCurrentAssessmentId(res.assessmentId);
      }

      setSaveMessage({
        type: 'success',
        text: `Draft saved successfully (${res.savedCount || roster.length} student records preserved in database).`,
      });
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err: any) {
      setSaveMessage({
        type: 'error',
        text: err.message || 'Failed to save draft. Check row errors.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPublish = async () => {
    setIsPublishing(true);
    try {
      // 1. Ensure draft is up to date first
      await handleSaveDraft();

      // 2. Publish
      const res = await teacherApi.publishAssessment(currentAssessmentId);
      setAssessmentStatus('PUBLISHED');
      setShowReviewModal(false);
      setPublishSuccessData({
        publishedCount: res.publishedCount || summary.scored,
        message: res.message,
      });

      // Update local roster
      setRoster((prev) => prev.map((r) => ({ ...r, isPublished: true })));
    } catch (err: any) {
      alert(`Publishing failed: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  // -------------------------------------------------------------
  // CORRECTION & AUDIT REVISION WORKFLOW
  // -------------------------------------------------------------
  const handleOpenCorrection = (markItem: AssessmentMarkItem) => {
    setCorrectionTarget(markItem);
    setCorrectionNewMarks(markItem.obtainedMarks !== null ? String(markItem.obtainedMarks) : '');
    setCorrectionReason('');
  };

  const handleSubmitCorrection = async () => {
    if (!correctionTarget || !currentAssessmentId) return;
    const num = parseFloat(correctionNewMarks);
    if (isNaN(num) || num < 0 || num > maxMarks) {
      alert(`Marks must be between 0 and ${maxMarks}`);
      return;
    }
    if (!correctionReason.trim()) {
      alert('A reason must be documented for result correction.');
      return;
    }

    setIsCorrecting(true);
    try {
      await teacherApi.correctMark(currentAssessmentId, correctionTarget.id || correctionTarget.studentId, {
        obtainedMarks: num,
        reason: correctionReason,
      });

      const { percentage, grade } = calculateGradeAndPercentage(num, maxMarks);
      setRoster((prev) =>
        prev.map((r) =>
          r.studentId === correctionTarget.studentId
            ? {
                ...r,
                obtainedMarks: num,
                percentage,
                grade,
                resultStatus: 'SCORED',
                correctionReason,
              }
            : r,
        ),
      );

      setCorrectionTarget(null);
      alert('Marks corrected successfully! Student has been notified of the revision.');
    } catch (err: any) {
      alert(`Correction failed: ${err.message}`);
    } finally {
      setIsCorrecting(false);
    }
  };

  // -------------------------------------------------------------
  // EXPORT RESULT SHEET
  // -------------------------------------------------------------
  const handleExportCsv = async () => {
    if (!currentAssessmentId) {
      alert('Please save the assessment draft before exporting.');
      return;
    }
    const csvContent = await teacherApi.exportResultSheetCsv(currentAssessmentId);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Result_Sheet_${assessmentTitle.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintSheet = () => {
    window.print();
  };

  if (batches.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E3DFD9] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1677FF]/10 flex items-center justify-center text-[#1677FF] border border-[#1677FF]/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-['Playfair_Display'] text-2xl font-bold text-stone-900 tracking-tight">
                Bulk Attendance & Marks Entry
              </h1>
              <p className="font-['Raleway'] text-xs text-stone-500">
                Classroom evaluation spreadsheet, attendance verification, and instant result publishing
              </p>
            </div>
          </div>
        </div>

        <div className="paper-card p-12 text-center space-y-3">
          <FileSpreadsheet className="w-10 h-10 text-[var(--ink-muted)] mx-auto opacity-50" />
          <h3 className="font-['Playfair_Display'] font-bold text-lg text-[var(--ink-primary)]">
            No Active Batches Found
          </h3>
          <p className="font-['Raleway'] text-xs text-[var(--ink-muted)] max-w-md mx-auto">
            You must create at least one batch and enroll students before you can enter and publish assessment marks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* HEADER: TITLE & CORE CONTROLS                                 */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E3DFD9] shadow-xl">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-[#1677FF]/10 flex items-center justify-center text-[#1677FF] border border-[#1677FF]/20 shadow-[0_0_12px_rgba(22,119,255,0.2)]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-['Playfair_Display'] text-2xl font-bold text-stone-900 tracking-tight">
                Bulk Attendance & Marks Entry
              </h1>
              <p className="font-['Raleway'] text-xs text-stone-500">
                Classroom evaluation spreadsheet, attendance verification, and instant result publishing
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleStartNewAssessment}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-stone-100 text-stone-900 border border-[#E3DFD9] transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            New Assessment
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-stone-100 text-stone-900 border border-[#E3DFD9] transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#1677FF]" />
            Export CSV
          </button>

          <button
            onClick={handlePrintSheet}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-stone-100 text-stone-900 border border-[#E3DFD9] transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-stone-500" />
            Print Sheet
          </button>

          <button
            onClick={handleSaveDraft}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#1677FF]/20 hover:bg-[#1677FF]/30 text-[#1677FF] border border-[#1677FF]/40 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            Save Draft
          </button>

          <button
            onClick={() => setShowReviewModal(true)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#1677FF] hover:bg-[#1465dc] text-white shadow-[0_0_15px_rgba(22,119,255,0.4)] transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            Review & Publish
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {saveMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center gap-3 border transition-all ${
            saveMessage.type === 'success'
              ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
              : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30'
          }`}
        >
          {saveMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{saveMessage.text}</span>
        </div>
      )}

      {/* Publish Celebration Banner */}
      {publishSuccessData && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#10B981]/15 via-[#10B981]/10 to-transparent border border-[#10B981]/30 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/20 flex items-center justify-center text-[#10B981] border border-[#10B981]/40">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="font-['Playfair_Display'] font-bold text-base text-stone-900">
                Results Published Successfully!
              </div>
              <div className="font-['Raleway'] text-xs text-stone-500">
                {publishSuccessData.message} Published results and student notifications are now live in the Student Portal.
              </div>
            </div>
          </div>
          <button
            onClick={() => setPublishSuccessData(null)}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-[#ffffff0d]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ASSESSMENT CONFIGURATION BAR                                 */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 bg-white p-5 rounded-2xl border border-[#E3DFD9]">
        {/* Batch Selection */}
        <div className="lg:col-span-2">
          <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5 font-['Raleway']">
            Class / Batch
          </label>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="w-full bg-[#FAF8F5] border border-[#E3DFD9] rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#1677FF]"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>

        {/* Existing Assessment Switcher */}
        <div className="lg:col-span-2">
          <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5 font-['Raleway']">
            Existing Assessments
          </label>
          <select
            value={currentAssessmentId}
            onChange={(e) => handleSelectExistingAssessment(e.target.value)}
            className="w-full bg-[#FAF8F5] border border-[#E3DFD9] rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#1677FF]"
          >
            <option value="">-- Create New Blank Assessment --</option>
            {assessmentList.map((a) => (
              <option key={a.id} value={a.id}>
                [{a.status}] {a.title} ({a.assessmentDate.split('T')[0]})
              </option>
            ))}
          </select>
        </div>

        {/* Assessment Category */}
        <div>
          <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5 font-['Raleway']">
            Exam Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as AssessmentType)}
            className="w-full bg-[#FAF8F5] border border-[#E3DFD9] rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#1677FF]"
          >
            <option value="UNIT_TEST">Unit Test</option>
            <option value="MONTHLY_EXAM">Monthly Exam</option>
            <option value="TERM_EXAM">Term Exam</option>
            <option value="QUIZ">Quiz</option>
            <option value="PRACTICAL">Practical Lab</option>
            <option value="GENERAL">General</option>
          </select>
        </div>

        {/* Assessment Date */}
        <div>
          <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5 font-['Raleway']">
            Date
          </label>
          <input
            type="date"
            value={assessmentDate}
            onChange={(e) => setAssessmentDate(e.target.value)}
            className="w-full bg-[#FAF8F5] border border-[#E3DFD9] rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#1677FF]"
          />
        </div>

        {/* Assessment Title */}
        <div className="lg:col-span-3">
          <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5 font-['Raleway']">
            Assessment Name
          </label>
          <input
            type="text"
            value={assessmentTitle}
            onChange={(e) => setAssessmentTitle(e.target.value)}
            placeholder="e.g. Unit Test 1 — Differential Calculus"
            className="w-full bg-[#FAF8F5] border border-[#E3DFD9] rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#1677FF]"
          />
        </div>

        {/* Subject */}
        <div className="lg:col-span-1">
          <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5 font-['Raleway']">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-[#FAF8F5] border border-[#E3DFD9] rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#1677FF]"
          />
        </div>

        {/* Total Max Marks */}
        <div>
          <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5 font-['Raleway']">
            Maximum Marks
          </label>
          <input
            type="number"
            min="1"
            value={maxMarks}
            onChange={(e) => setMaxMarks(Number(e.target.value) || 0)}
            className="w-full bg-[#FAF8F5] border border-[#E3DFD9] rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#1677FF] font-mono"
          />
        </div>

        {/* Status Badge */}
        <div className="flex flex-col justify-end">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3DFD9] h-[38px]">
            <span className="text-[11px] font-semibold text-stone-500">Lifecycle:</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                assessmentStatus === 'PUBLISHED'
                  ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                  : 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30'
              }`}
            >
              {assessmentStatus}
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* BULK SELECTION & ATTENDANCE ACTIONS BAR                       */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E3DFD9]">
        {/* Roster Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              placeholder="Search student or roll no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#E3DFD9] rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-900 placeholder-[#929BAA] focus:outline-none focus:border-[#1677FF]"
            />
          </div>

          {/* Attendance Filter Pills */}
          <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E3DFD9]">
            {(['ALL', 'PRESENT', 'ABSENT'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setAttendanceFilter(status)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  attendanceFilter === status
                    ? 'bg-[#1677FF] text-white shadow-sm'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Fast Bulk Attendance Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-stone-500 mr-1 hidden sm:inline">Bulk Attendance:</span>
          <button
            onClick={() => handleMarkAllAttendance('PRESENT')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 transition-all cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Mark All Present
          </button>
          <button
            onClick={() => handleMarkAllAttendance('ABSENT')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 transition-all cursor-pointer"
          >
            <UserX className="w-3.5 h-3.5" />
            Mark All Absent
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SPREADSHEET-LIKE MARKS ENTRY TABLE                            */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-[#E3DFD9] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E3DFD9] text-[11px] uppercase font-bold text-stone-500 tracking-wider select-none">
                <th className="py-3.5 px-4 w-12 text-center">
                  <button
                    onClick={() => handleToggleSelectAll(!roster.every((r) => r.isEligible !== false))}
                    className="p-1 hover:text-stone-900 text-stone-500 cursor-pointer"
                  >
                    {roster.every((r) => r.isEligible !== false) ? (
                      <CheckSquare className="w-4 h-4 text-[#1677FF]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Student ID / Roll</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4 w-44">Attendance</th>
                <th className="py-3.5 px-4 w-28 text-center font-mono">Max Marks</th>
                <th className="py-3.5 px-4 w-44 font-mono">Obtained Marks</th>
                <th className="py-3.5 px-4 w-20 text-center font-mono">%</th>
                <th className="py-3.5 px-4 w-20 text-center">Grade</th>
                <th className="py-3.5 px-4 w-28 text-center">Status</th>
                <th className="py-3.5 px-4">Feedback / Notes</th>
                {assessmentStatus === 'PUBLISHED' && <th className="py-3.5 px-4 w-24 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ffffff0a] text-xs font-['Raleway']">
              {filteredRoster.map((row, idx) => {
                const isSelected = row.isEligible !== false;
                const isAbsent = row.attendanceStatus === 'ABSENT';
                const isInvalid =
                  row.obtainedMarks !== null &&
                  row.obtainedMarks !== undefined &&
                  (row.obtainedMarks < 0 || row.obtainedMarks > maxMarks);

                return (
                  <tr
                    key={row.studentId}
                    className={`transition-colors hover:bg-[var(--bg-secondary)]/60 ${
                      !isSelected ? 'opacity-40 bg-[var(--bg-muted)]' : ''
                    } ${isInvalid ? 'bg-rose-50/60' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleSelectStudent(row.studentId)}
                        className="p-1 text-stone-500 hover:text-stone-900 cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#1677FF]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Student Roll */}
                    <td className="py-3 px-4 font-mono text-[11px] font-semibold text-[#1677FF]">
                      {row.rollNumber}
                    </td>

                    {/* Student Name */}
                    <td className="py-3 px-4 font-medium text-stone-900">
                      <div>{row.studentName}</div>
                      <div className="text-[10px] text-stone-500 font-mono">ID: {row.studentId}</div>
                    </td>

                    {/* Attendance Status Selector */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E3DFD9] w-fit">
                        {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as AttendanceStatus[]).map((st) => {
                          const isActive = row.attendanceStatus === st;
                          return (
                            <button
                              key={st}
                              onClick={() => handleSetStudentAttendance(row.studentId, st)}
                              title={st}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                isActive
                                  ? st === 'PRESENT'
                                    ? 'bg-[#10B981] text-white shadow-sm'
                                    : st === 'ABSENT'
                                    ? 'bg-[#EF4444] text-white shadow-sm'
                                    : 'bg-[#F59E0B] text-white shadow-sm'
                                  : 'text-stone-500 hover:text-stone-900'
                              }`}
                            >
                              {st[0]}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    {/* Max Marks (Static per row, global from assessment) */}
                    <td className="py-3 px-4 text-center font-mono font-medium text-stone-500">
                      {maxMarks}
                    </td>

                    {/* Obtained Marks Input (Keyboard Accessible) */}
                    <td className="py-3 px-4">
                      {isAbsent ? (
                        <div className="px-3 py-1.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs font-semibold text-center select-none">
                          Absent (No Mark)
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            ref={(el) => {
                              if (el) inputRefs.current.set(row.studentId, el);
                              else inputRefs.current.delete(row.studentId);
                            }}
                            type="number"
                            step="0.5"
                            min="0"
                            max={maxMarks}
                            value={row.obtainedMarks !== null && row.obtainedMarks !== undefined ? row.obtainedMarks : ''}
                            onChange={(e) => handleMarksChange(row.studentId, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx)}
                            placeholder="Enter marks"
                            className={`w-full bg-[#FAF8F5] border rounded-xl px-3 py-1.5 text-xs font-mono font-semibold text-stone-900 focus:outline-none ${
                              isInvalid
                                ? 'border-[#EF4444] focus:border-[#EF4444] shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                                : 'border-[#E3DFD9] focus:border-[#1677FF]'
                            }`}
                          />
                          {isInvalid && (
                            <div className="text-[10px] text-[#EF4444] font-sans mt-0.5">
                              0 - {maxMarks} required
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Computed Percentage */}
                    <td className="py-3 px-4 text-center font-mono font-semibold text-stone-900">
                      {row.percentage !== null && row.percentage !== undefined ? `${row.percentage}%` : '—'}
                    </td>

                    {/* Computed Grade Badge */}
                    <td className="py-3 px-4 text-center">
                      {row.grade ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.grade.startsWith('A')
                              ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                              : row.grade.startsWith('B')
                              ? 'bg-[#1677FF]/15 text-[#1677FF] border border-[#1677FF]/30'
                              : row.grade.startsWith('C')
                              ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                              : 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                          }`}
                        >
                          {row.grade}
                        </span>
                      ) : (
                        <span className="text-stone-500">—</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          row.resultStatus === 'SCORED'
                            ? 'bg-[#10B981]/10 text-[#10B981]'
                            : row.resultStatus === 'ABSENT'
                            ? 'bg-[#EF4444]/10 text-[#EF4444]'
                            : 'bg-[#929BAA]/10 text-stone-500'
                        }`}
                      >
                        {row.resultStatus}
                      </span>
                    </td>

                    {/* Feedback Input */}
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={row.feedback || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRoster((prev) =>
                            prev.map((item) =>
                              item.studentId === row.studentId ? { ...item, feedback: val } : item,
                            ),
                          );
                        }}
                        placeholder="Optional remarks..."
                        className="w-full bg-transparent border-b border-[#E3DFD9] focus:border-[#1677FF] px-1 py-1 text-xs text-stone-500 focus:text-stone-900 focus:outline-none transition-colors"
                      />
                    </td>

                    {/* Published Row Action: Correct Marks */}
                    {assessmentStatus === 'PUBLISHED' && (
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenCorrection(row)}
                          title="Correct and republish with audit reason"
                          className="flex items-center gap-1 text-[11px] font-semibold text-[#1677FF] hover:underline cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          Revise
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SUMMARY STATS FOOTER BAR                                     */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-[#FAF8F5] px-6 py-4 border-t border-[#E3DFD9] flex flex-wrap items-center justify-between gap-4 text-xs font-['Raleway']">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-stone-500">Included:</span>
              <span className="font-mono font-bold text-stone-900">{summary.total} students</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-stone-500">Present:</span>
              <span className="font-mono font-bold text-[#10B981]">{summary.present}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-stone-500">Absent:</span>
              <span className="font-mono font-bold text-[#EF4444]">{summary.absent}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-stone-500">Scored:</span>
              <span className="font-mono font-bold text-[#1677FF]">{summary.scored}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-stone-500">Pending:</span>
              <span className="font-mono font-bold text-[#F59E0B]">{summary.pending}</span>
            </div>
            {summary.invalidCount > 0 && (
              <div className="flex items-center gap-1.5 text-[#EF4444] font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{summary.invalidCount} invalid mark entries</span>
              </div>
            )}
            {summary.unmarkedCount > 0 && (
              <div className="flex items-center gap-1.5 text-[#F59E0B] font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{summary.unmarkedCount} present students without marks</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-stone-100 text-stone-900 border border-[#E3DFD9] cursor-pointer"
            >
              Save Draft
            </button>
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1677FF] hover:bg-[#1465dc] text-white shadow-lg cursor-pointer"
            >
              Review & Publish All Eligible Results
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* REVIEW & CONFIRM PUBLISH MODAL (Stage B -> Stage C)           */}
      {/* ------------------------------------------------------------- */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E3DFD9] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E3DFD9] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#1677FF]/15 flex items-center justify-center text-[#1677FF]">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-['Playfair_Display'] text-lg font-bold text-stone-900">
                    Review Assessment Results
                  </h3>
                  <p className="text-xs text-stone-500 font-['Raleway']">Stage B: Pre-Publish Verification</p>
                </div>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1 rounded-lg text-stone-500 hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Assessment Meta Box */}
            <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E3DFD9] space-y-2 text-xs font-['Raleway']">
              <div className="flex justify-between">
                <span className="text-stone-500">Assessment:</span>
                <span className="font-semibold text-stone-900">{assessmentTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Subject & Date:</span>
                <span className="font-semibold text-stone-900">
                  {subject} | {assessmentDate}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Maximum Marks:</span>
                <span className="font-mono font-semibold text-[#1677FF]">{maxMarks} Marks</span>
              </div>
            </div>

            {/* Breakdown Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E3DFD9]">
                <div className="text-[10px] text-stone-500 uppercase font-bold">Included</div>
                <div className="text-lg font-mono font-bold text-stone-900">{summary.total}</div>
              </div>
              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E3DFD9]">
                <div className="text-[10px] text-stone-500 uppercase font-bold">Present</div>
                <div className="text-lg font-mono font-bold text-[#10B981]">{summary.present}</div>
              </div>
              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E3DFD9]">
                <div className="text-[10px] text-stone-500 uppercase font-bold">Absent</div>
                <div className="text-lg font-mono font-bold text-[#EF4444]">{summary.absent}</div>
              </div>
              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E3DFD9]">
                <div className="text-[10px] text-stone-500 uppercase font-bold">Scored</div>
                <div className="text-lg font-mono font-bold text-[#1677FF]">{summary.scored}</div>
              </div>
            </div>

            {/* Warning or Blocking Errors */}
            {summary.invalidCount > 0 ? (
              <div className="p-3.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Publishing is blocked: You have {summary.invalidCount} invalid mark entries that exceed {maxMarks} or are negative.
                </span>
              </div>
            ) : summary.unmarkedCount > 0 ? (
              <div className="p-3.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Notice: {summary.unmarkedCount} students are marked Present but have no marks entered. They will remain in PENDING status.
                </span>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>All verification checks passed. Results are eligible for instant student publishing.</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white text-stone-500 hover:text-stone-900 border border-[#E3DFD9]"
              >
                Back to Edit
              </button>
              <button
                onClick={handleConfirmPublish}
                disabled={isPublishing || summary.invalidCount > 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#1677FF] hover:bg-[#1465dc] text-white shadow-[0_0_20px_rgba(22,119,255,0.4)] disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {isPublishing ? 'Publishing...' : 'Confirm & Publish All Results'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* RESULT CORRECTION MODAL (Audit-Preserved Revision)            */}
      {/* ------------------------------------------------------------- */}
      {correctionTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E3DFD9] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E3DFD9] pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#1677FF]" />
                <h3 className="font-['Playfair_Display'] text-base font-bold text-stone-900">
                  Revise Student Result
                </h3>
              </div>
              <button
                onClick={() => setCorrectionTarget(null)}
                className="text-stone-500 hover:text-stone-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs font-['Raleway'] space-y-1 text-stone-500">
              <div>
                Student:{' '}
                <span className="font-semibold text-stone-900">
                  {correctionTarget.studentName} ({correctionTarget.rollNumber})
                </span>
              </div>
              <div>
                Current Score:{' '}
                <span className="font-mono font-semibold text-[#1677FF]">
                  {correctionTarget.obtainedMarks ?? 'N/A'} / {maxMarks}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5 font-['Raleway']">
                New Obtained Marks (Max: {maxMarks})
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max={maxMarks}
                value={correctionNewMarks}
                onChange={(e) => setCorrectionNewMarks(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E3DFD9] rounded-xl px-3 py-2 text-xs font-mono font-semibold text-stone-900 focus:outline-none focus:border-[#1677FF]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5 font-['Raleway']">
                Audit Reason for Revision (Required)
              </label>
              <textarea
                rows={3}
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="e.g. Recounting error in section B resolved during student doubt clearance."
                className="w-full bg-[#FAF8F5] border border-[#E3DFD9] rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#1677FF]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCorrectionTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-stone-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitCorrection}
                disabled={isCorrecting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1677FF] text-white hover:bg-[#1465dc] disabled:opacity-50 cursor-pointer"
              >
                {isCorrecting ? 'Saving Revision...' : 'Save & Notify Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

