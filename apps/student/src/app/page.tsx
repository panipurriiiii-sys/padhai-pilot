'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Search,
  TrendingUp,
  X,
  ShieldCheck,
  LogOut,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Sparkles,
  Download,
  FileText,
  FileCheck,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Globe,
  Clock,
  CreditCard,
  AlertTriangle,
  User,
  GraduationCap,
  Percent,
  HelpCircle,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  ListTodo,
  FileBadge,
  Phone,
  Bookmark,
  Building,
  KeyRound,
  Filter,
  CheckSquare,
  Square,
  RefreshCw,
} from 'lucide-react';
import {
  StudentAssessmentResult,
  InAppNotification,
  UserSession,
  StudyMaterialItem,
  StudentAnalyticsSummary,
} from '@padhai-pilot/shared';
import {
  studentApi,
  clearAuthToken,
  TeachingDiaryEntry,
  TimetableDay,
  AssignmentItem,
  TestItem,
  AcademicQuery,
  StudyTask,
  OfficialDocument,
  StudentProfileData,
} from '../lib/api';
import {
  StudentAttendanceTrendCard,
  StudentResultsTrendCard,
  StudentSubjectAveragesCard,
  StudentAssignmentBreakdownCard,
  StudentFeeBreakdownCard,
  StudentTaskProgressCard,
  ExamVsClassCard,
  SubjectPerformanceCard,
  HomeworkCompletionCard,
} from '../components/charts';
import { EmptyState, ErrorState, MotionProvider, ToastProvider } from '@padhai-pilot/ui';
import { StudentFeesPanel, StudentLeavesPanel } from '../components/StudentFinance';

type PortalTab =
  | 'OVERVIEW'
  | 'DIARY'
  | 'MATERIALS'
  | 'TIMETABLE'
  | 'ATTENDANCE'
  | 'ASSIGNMENTS'
  | 'TESTS'
  | 'RESULTS'
  | 'FEES'
  | 'LEAVES'
  | 'QUERIES'
  | 'PLANNER'
  | 'DOCUMENTS'
  | 'PROFILE';

const MATERIAL_CATEGORIES: { key: string; label: string }[] = [
  { key: 'ALL', label: 'All Resources' },
  { key: 'CHAPTER_NOTES', label: 'Chapter Notes' },
  { key: 'WORKSHEET', label: 'Daily Worksheets (DPP)' },
  { key: 'FORMULA_SHEET', label: 'Formula Sheets' },
  { key: 'HANDOUT', label: 'Lecture Handouts' },
  { key: 'REVISION_GUIDE', label: 'Revision Guides' },
  { key: 'PRACTICE_PAPER', label: 'Practice Papers' },
];

const ALL_RESOURCES = ['dashboard', 'results', 'notifications', 'materials', 'attendance', 'fees', 'announcements', 'diary', 'timetable', 'assignments', 'tests', 'queries', 'tasks', 'documents', 'profile', 'analytics'] as const;

/** Resources each tab cannot render without. */
const TAB_RESOURCES: Record<string, string[]> = {
  OVERVIEW: ['dashboard'],
  DIARY: ['diary'],
  MATERIALS: ['materials'],
  TIMETABLE: ['timetable'],
  ATTENDANCE: ['attendance'],
  ASSIGNMENTS: ['assignments'],
  TESTS: ['tests'],
  RESULTS: ['results'],
  QUERIES: ['queries'],
  PLANNER: ['tasks'],
  DOCUMENTS: ['documents'],
  PROFILE: ['profile'],
};

function StudentPortal() {
  const [student, setStudent] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<PortalTab>('OVERVIEW');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // Core Data States
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [results, setResults] = useState<StudentAssessmentResult[]>([]);
  const [materials, setMaterials] = useState<StudyMaterialItem[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [diaries, setDiaries] = useState<TeachingDiaryEntry[]>([]);
  const [timetable, setTimetable] = useState<TimetableDay[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [queries, setQueries] = useState<AcademicQuery[]>([]);
  const [studyTasks, setStudyTasks] = useState<StudyTask[]>([]);
  const [documents, setDocuments] = useState<OfficialDocument[]>([]);
  const [profileData, setProfileData] = useState<StudentProfileData | null>(null);
  const [analytics, setAnalytics] = useState<StudentAnalyticsSummary | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  const [attendanceData, setAttendanceData] = useState<{
    totalClasses: number;
    attended: number;
    absent: number;
    late: number;
    percentage: number;
    records: Array<{
      id: string;
      date: string;
      status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
      subjectName?: string;
      remarks?: string;
    }>;
  }>({
    totalClasses: 0,
    attended: 0,
    absent: 0,
    late: 0,
    percentage: 0,
    records: [],
  });

  const [feesData, setFeesData] = useState<{
    totalFees: number;
    paidAmount: number;
    balanceDue: number;
    status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
    receipts: Array<{
      id: string;
      title: string;
      dueDate: string;
      amount: number;
      paidAmount: number;
      status: 'PAID' | 'PENDING' | 'OVERDUE';
      paidDate?: string;
      receiptNumber?: string;
    }>;
  }>({
    totalFees: 0,
    paidAmount: 0,
    balanceDue: 0,
    status: 'PAID',
    receipts: [],
  });

  const [announcements, setAnnouncements] = useState<
    Array<{
      id: string;
      title: string;
      content: string;
      date: string;
      priority: 'NORMAL' | 'URGENT';
      authorName?: string;
    }>
  >([]);

  // Computed average percentage from verified assessment scores
  const avgScorePercentage = useMemo(() => {
    if (dashboardData?.stats?.avgPercentage !== undefined && dashboardData.stats.avgPercentage > 0) {
      return dashboardData.stats.avgPercentage;
    }
    const scored = results.filter(
      (r) => (r.resultStatus === 'SCORED' || !r.resultStatus) && r.percentage !== null && r.percentage !== undefined,
    );
    if (!scored.length) return null;
    return Math.round(scored.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / scored.length);
  }, [dashboardData, results]);

  // Filter States
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Interactive States
  const [selectedResult, setSelectedResult] = useState<StudentAssessmentResult | null>(null);
  const [selectedDiary, setSelectedDiary] = useState<TeachingDiaryEntry | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentItem | null>(null);
  const [assignmentAnswer, setAssignmentAnswer] = useState('');
  const [assignmentFileUrl, setAssignmentFileUrl] = useState('');
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);

  // Online Assessment Modal
  const [activeTest, setActiveTest] = useState<any>(null);
  const [testAnswers, setTestAnswers] = useState<Record<string, number>>({});
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);
  const [testResultFeedback, setTestResultFeedback] = useState<string | null>(null);

  // Attendance Correction Modal
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [correctionDate, setCorrectionDate] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

  // Ask Academic Doubt Modal
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [querySubject, setQuerySubject] = useState('Mathematics');
  const [queryTopic, setQueryTopic] = useState('');
  const [queryText, setQueryText] = useState('');
  const [isSubmittingQuery, setIsSubmittingQuery] = useState(false);

  // New Study Task Input
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('Mathematics');
  const [newTaskPriority, setNewTaskPriority] = useState<'NORMAL' | 'HIGH' | 'LOW'>('NORMAL');

  // Join Institute / Invitation State
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [inviteValidationResult, setInviteValidationResult] = useState<any>(null);
  const [isValidatingInvite, setIsValidatingInvite] = useState(false);
  const [inviteStatusMsg, setInviteStatusMsg] = useState<string | null>(null);

  // Support Ticket Modal
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportCategory, setSupportCategory] = useState<'PROFILE_CORRECTION' | 'ATTENDANCE_MISMATCH' | 'PAYMENT_ISSUE' | 'ACADEMIC_HELP' | 'TECHNICAL_SUPPORT'>('ACADEMIC_HELP');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportDescription, setSupportDescription] = useState('');
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  // Auth States
  const [authMode, setAuthMode] = useState<'SIGN_IN' | 'REGISTER'>('SIGN_IN');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regInviteCode, setRegInviteCode] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  const [loadErrors, setLoadErrors] = useState<Record<string, string>>({});

  const loadResource = async (key: string) => {
    try {
      switch (key) {
        case 'dashboard': setDashboardData(await studentApi.getDashboard()); break;
        case 'results': setResults(await studentApi.getPublishedResults()); break;
        case 'notifications': setNotifications(await studentApi.getNotifications()); break;
        case 'materials': setMaterials(await studentApi.getStudyMaterials()); break;
        case 'attendance': setAttendanceData(await studentApi.getAttendance()); break;
        case 'fees': setFeesData(await studentApi.getFees()); break;
        case 'announcements': setAnnouncements(await studentApi.getAnnouncements()); break;
        case 'diary': setDiaries(await studentApi.getTeachingDiaries()); break;
        case 'timetable': setTimetable(await studentApi.getTimetable()); break;
        case 'assignments': setAssignments(await studentApi.getAssignments()); break;
        case 'tests': setTests(await studentApi.getTests()); break;
        case 'queries': setQueries(await studentApi.getAcademicQueries()); break;
        case 'tasks': setStudyTasks(await studentApi.getStudyTasks()); break;
        case 'documents': setDocuments(await studentApi.getDocuments()); break;
        case 'profile': setProfileData(await studentApi.getProfile()); break;
        case 'analytics': setAnalytics(await studentApi.getAnalytics()); break;
      }
      setLoadErrors((p) => {
        if (!p[key]) return p;
        const n = { ...p };
        delete n[key];
        return n;
      });
    } catch (err) {
      setLoadErrors((p) => ({ ...p, [key]: err instanceof Error ? err.message : 'Request failed' }));
    }
  };

  // Load all student data. Every resource is independent: one failure never hides the others,
  // and a failed resource shows an error state with Retry instead of empty or sample data.
  const loadAllStudentData = async () => {
    setIsLoading(true);
    try {
      await Promise.all(ALL_RESOURCES.map((k) => loadResource(k)));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const sharedCode = new URLSearchParams(window.location.search).get('code');
    if (sharedCode) {
      setRegInviteCode(sharedCode.trim().toUpperCase());
      setInviteCodeInput(sharedCode.trim().toUpperCase());
    }
    const onUnauthorized = () => {
      setStudent(null);
      setSessionNotice('Your session expired. Please sign in again.');
    };
    window.addEventListener('pp:unauthorized', onUnauthorized);

    const session = studentApi.getStudentSession();
    if (!session) {
      setIsLoading(false);
      return () => window.removeEventListener('pp:unauthorized', onUnauthorized);
    }
    // Never trust the cached session alone: confirm the token is still valid.
    studentApi
      .verifySession()
      .then((verified) => {
        if (verified) {
          setStudent(verified);
          return loadAllStudentData();
        }
        setIsLoading(false);
      })
      .catch((err: { status?: number }) => {
        if (err?.status === 401) {
          clearAuthToken();
          setIsLoading(false);
          return;
        }
        // Server unreachable: keep the cached identity; each resource shows its own error + Retry.
        setStudent(session);
        return loadAllStudentData();
      });
    return () => window.removeEventListener('pp:unauthorized', onUnauthorized);
  }, []);

  const blockingErrors = (TAB_RESOURCES[activeTab] ?? []).filter((k) => loadErrors[k]);

  // Authentication Handlers
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) return;

    setLoginLoading(true);
    setAuthError('');
    try {
      const res = await studentApi.login(loginEmail.trim(), loginPassword);
      setStudent(res.user);
      await loadAllStudentData();
    } catch (err: any) {
      setAuthError(err.message || 'Invalid email or password.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim() || !regEmail.trim() || !regPassword) return;

    setLoginLoading(true);
    setAuthError('');
    try {
      const res = await studentApi.register({
        fullName: regFullName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        phone: regPhone.trim() || undefined,
        invitationCode: regInviteCode.trim() || undefined,
      });
      setStudent(res.user);
      setAuthSuccessMsg('Account created successfully!');
      await loadAllStudentData();
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    setStudent(null);
    setDashboardData(null);
    setResults([]);
    setMaterials([]);
    setNotifications([]);
    setDiaries([]);
    setTimetable([]);
    setAssignments([]);
    setTests([]);
    setQueries([]);
    setStudyTasks([]);
    setDocuments([]);
    setProfileData(null);
  };

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Invitation Verification & Join
  const handleVerifyInvite = async () => {
    if (!inviteCodeInput.trim()) return;
    setIsValidatingInvite(true);
    setInviteStatusMsg(null);
    try {
      const res = await studentApi.validateInvitation(inviteCodeInput.trim());
      setInviteValidationResult(res);
    } catch (err: any) {
      setInviteStatusMsg(err.message || 'Invalid invitation code.');
      setInviteValidationResult(null);
    } finally {
      setIsValidatingInvite(false);
    }
  };

  const handleConfirmJoinBatch = async () => {
    if (!inviteCodeInput.trim()) return;
    setIsValidatingInvite(true);
    try {
      const res = await studentApi.joinBatch(inviteCodeInput.trim());
      setInviteStatusMsg(res.alreadyEnrolled ? 'You are already enrolled in this batch.' : 'You have joined the batch.');
      setStudent(res.user);
      setInviteValidationResult(null);
      setInviteCodeInput('');
      await loadAllStudentData();
    } catch (err: any) {
      setInviteStatusMsg(err.message || 'Failed to join batch.');
    } finally {
      setIsValidatingInvite(false);
    }
  };

  // Assignment Submission
  const handleSubmitAssignment = async (isDraft: boolean) => {
    if (!selectedAssignment) return;
    if (!assignmentAnswer.trim() && !assignmentFileUrl.trim()) {
      alert('Please write an answer response or provide an attachment link.');
      return;
    }
    setIsSubmittingAssignment(true);
    try {
      await studentApi.submitAssignment(selectedAssignment.id, {
        content: assignmentAnswer.trim() || undefined,
        attachmentUrl: assignmentFileUrl.trim() || undefined,
        isDraft,
      });
      alert(isDraft ? 'Assignment draft saved.' : 'Assignment submitted for grading!');
      setSelectedAssignment(null);
      setAssignmentAnswer('');
      setAssignmentFileUrl('');
      const updated = await studentApi.getAssignments();
      setAssignments(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to submit assignment.');
    } finally {
      setIsSubmittingAssignment(false);
    }
  };

  // Online Assessment
  const handleStartTest = async (testId: string) => {
    setIsLoading(true);
    try {
      const details = await studentApi.getTestDetails(testId);
      setActiveTest(details);
      setTestAnswers({});
      setTestResultFeedback(null);
    } catch (err: any) {
      alert(err.message || 'Failed to launch assessment.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitTest = async () => {
    if (!activeTest) return;
    setIsSubmittingTest(true);
    try {
      const payload = Object.entries(testAnswers).map(([qid, optIdx]) => ({
        questionId: qid,
        selectedOptionIndex: optIdx,
      }));
      const res = await studentApi.submitTestAttempt(activeTest.id, payload);
      setTestResultFeedback(
        `Test Evaluated! Score: ${res.score}/${res.totalMarks} (${res.percentage}%). Feedback: ${res.feedback}`,
      );
      const updatedTests = await studentApi.getTests();
      setTests(updatedTests);
    } catch (err: any) {
      alert(err.message || 'Test submission failed.');
    } finally {
      setIsSubmittingTest(false);
    }
  };

  // Attendance Correction
  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionDate || !correctionReason.trim()) return;
    setIsSubmittingCorrection(true);
    try {
      await studentApi.submitAttendanceCorrection(correctionDate, correctionReason.trim());
      alert('Correction request submitted to academic faculty.');
      setShowAttendanceModal(false);
      setCorrectionDate('');
      setCorrectionReason('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit request.');
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  // Submit Academic Doubt
  const handleSubmitDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) return;
    setIsSubmittingQuery(true);
    try {
      await studentApi.submitAcademicQuery({
        subject: querySubject,
        topic: queryTopic.trim() || undefined,
        questionText: queryText.trim(),
      });
      alert('Your question has been sent to faculty.');
      setShowQueryModal(false);
      setQueryTopic('');
      setQueryText('');
      const qList = await studentApi.getAcademicQueries();
      setQueries(qList);
    } catch (err: any) {
      alert(err.message || 'Failed to post query.');
    } finally {
      setIsSubmittingQuery(false);
    }
  };

  // Study Planner Task Management
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      await studentApi.createStudyTask({
        title: newTaskTitle.trim(),
        subject: newTaskSubject,
        priority: newTaskPriority,
      });
      setNewTaskTitle('');
      const tasks = await studentApi.getStudyTasks();
      setStudyTasks(tasks);
    } catch (err: any) {
      alert(err.message || 'Failed to create task.');
    }
  };

  const handleToggleTask = async (taskId: string, current: boolean) => {
    try {
      await studentApi.updateStudyTask(taskId, !current);
      setStudyTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, isCompleted: !current } : t)),
      );
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await studentApi.deleteStudyTask(taskId);
      setStudyTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err: any) {
      console.error(err);
    }
  };

  // Submit Support Ticket
  const handleSubmitSupportTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportDescription.trim()) return;
    setIsSubmittingSupport(true);
    try {
      const res = await studentApi.submitSupportRequest({
        category: supportCategory,
        subject: supportSubject.trim(),
        description: supportDescription.trim(),
      });
      alert(`Support Ticket #${res.ticketId} created! The academic desk will review it.`);
      setShowSupportModal(false);
      setSupportSubject('');
      setSupportDescription('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit support ticket.');
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  // Filtered Study Materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchesCategory =
        selectedCategory === 'ALL' || m.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.chapter && m.chapter.toLowerCase().includes(searchQuery.toLowerCase())) ||
        m.subject.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [materials, selectedCategory, searchQuery]);

  // Filtered Results
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const matchesSubject =
        selectedSubject === 'ALL' || r.subject === selectedSubject;
      return matchesSubject;
    });
  }, [results, selectedSubject]);

  // Unread notification count
  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // --------------------------------------------------------------------------
  // AUTHENTICATION SCREEN (When user is not signed in)
  // --------------------------------------------------------------------------
  if (!student) {
    return (
      <main className="min-h-screen bg-[var(--bg-desk)] text-[var(--ink-primary)] flex items-center justify-center p-4 sm:p-6 font-sans">
        <div className="w-full max-w-md bg-[var(--bg-paper)] border border-[var(--border-paper)] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle Glow Header */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--brand-electric)] via-[var(--brand-deep)] to-[#047857]" />

          {/* Institute Branding Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] text-[var(--brand-electric)] mb-3 shadow-inner">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--ink-primary)]">
              PadhaiPilot
            </h1>
            <p className="font-sans text-xs text-[var(--ink-muted)] mt-1">
              Student Academic Portal & Verified Results Vault
            </p>
          </div>

          {/* Auth Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-[var(--bg-paper-warm)] rounded-xl border border-[var(--border-paper)] mb-5">
            <button
              onClick={() => {
                setAuthMode('SIGN_IN');
                setAuthError('');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition ${
                authMode === 'SIGN_IN'
                  ? 'bg-[var(--brand-electric)] text-white shadow'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setAuthMode('REGISTER');
                setAuthError('');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition ${
                authMode === 'REGISTER'
                  ? 'bg-[var(--brand-electric)] text-white shadow'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
              }`}
            >
              New Registration
            </button>
          </div>

          {sessionNotice && !authError && (
            <div role="status" className="mb-4 p-2.5 rounded-lg bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.3)] text-[#B45309] text-xs">{sessionNotice}</div>
          )}
          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-[rgba(244,63,94,0.12)] border border-[rgba(244,63,94,0.3)] text-xs text-[#BE123C] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccessMsg && (
            <div className="mb-4 p-3 rounded-xl bg-[rgba(16,185,129,0.12)] border border-[rgba(16,185,129,0.3)] text-xs text-[#047857] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{authSuccessMsg}</span>
            </div>
          )}

          {authMode === 'SIGN_IN' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1.5">
                  Student Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="student@padhaipilot.com"
                    className="w-full bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] focus:border-[var(--brand-electric)] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[var(--ink-primary)] outline-none transition placeholder:text-[var(--ink-faint)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] focus:border-[var(--brand-electric)] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[var(--ink-primary)] outline-none transition placeholder:text-[var(--ink-faint)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 rounded-xl bg-[var(--brand-electric)] hover:bg-[var(--brand-hover)] text-xs font-semibold text-white transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>Access Student Portal</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Aarav Patel"
                  className="w-full bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] focus:border-[var(--brand-electric)] rounded-xl px-3.5 py-2 text-xs text-[var(--ink-primary)] outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
                  Student Email *
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="aarav@example.com"
                  className="w-full bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] focus:border-[var(--brand-electric)] rounded-xl px-3.5 py-2 text-xs text-[var(--ink-primary)] outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] focus:border-[var(--brand-electric)] rounded-xl px-3.5 py-2 text-xs text-[var(--ink-primary)] outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91..."
                    className="w-full bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] focus:border-[var(--brand-electric)] rounded-xl px-3.5 py-2 text-xs text-[var(--ink-primary)] outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
                  Invitation Code (Optional for Instant Batch Enrollment)
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
                  <input
                    type="text"
                    value={regInviteCode}
                    onChange={(e) => setRegInviteCode(e.target.value)}
                    placeholder="e.g. APEX-INV-2026"
                    className="w-full bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] focus:border-[var(--brand-electric)] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[var(--ink-primary)] outline-none transition"
                  />
                </div>
                <p className="text-[10px] text-[var(--ink-muted)] mt-1">
                  If your teacher provided an admission code, enter it to link your batch automatically.
                </p>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 rounded-xl bg-[#047857] hover:bg-emerald-600 text-xs font-semibold text-white transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 mt-2"
              >
                {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Create Student Account</span>
              </button>
            </form>
          )}
        </div>
      </main>
    );
  }

  // --------------------------------------------------------------------------
  // LOGGED-IN PORTAL INTERFACE
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[var(--bg-desk)] text-[var(--ink-primary)] flex flex-col font-sans">
      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 bg-[var(--bg-paper)]/90 backdrop-blur-md border-b border-[var(--border-paper)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] flex items-center justify-center text-[var(--brand-electric)] shadow-inner">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base tracking-tight text-[var(--ink-primary)]">
                  {student.instituteName || 'Institute'}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[rgba(22,119,255,0.12)] text-[var(--brand-electric)] border border-[rgba(22,119,255,0.25)]">
                  Student Vault
                </span>
              </div>
              <div className="text-[11px] text-[var(--ink-muted)] font-sans">
                {profileData?.batchName || 'Enrolled Batch'}{profileData?.rollNumber ? ` • Roll: ${profileData.rollNumber}` : ''}
              </div>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2.5">
            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 rounded-xl bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] hover:bg-[var(--bg-surface-subtle)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#BE123C] text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Student Pill & Sign Out */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-paper-warm)] border border-[var(--border-paper)]">
              <div className="w-6 h-6 rounded-full bg-[var(--brand-electric)]/20 text-[var(--brand-electric)] font-semibold text-xs flex items-center justify-center font-display">
                {student.fullName.charAt(0)}
              </div>
              <span className="text-xs font-semibold text-[var(--ink-primary)] max-w-[120px] truncate">
                {student.fullName}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] hover:bg-[rgba(244,63,94,0.15)] text-[var(--ink-muted)] hover:text-[#BE123C] transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* HORIZONTAL TAB NAVIGATION BAR */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 overflow-x-auto no-scrollbar flex items-center gap-1 border-t border-[var(--border-paper)] py-1.5">
          {[
            { id: 'OVERVIEW', label: 'Overview', icon: Layers },
            { id: 'DIARY', label: 'Daily Diary', icon: BookOpen },
            { id: 'MATERIALS', label: 'Study Vault', icon: FileText },
            { id: 'TIMETABLE', label: 'Timetable', icon: Calendar },
            { id: 'ATTENDANCE', label: 'Attendance', icon: CheckCircle2 },
            { id: 'ASSIGNMENTS', label: 'Homework', icon: FileCheck },
            { id: 'TESTS', label: 'Online Tests', icon: Clock },
            { id: 'RESULTS', label: 'Exam Results', icon: Award },
            { id: 'FEES', label: 'Fees & Dues', icon: CreditCard },
            { id: 'LEAVES', label: 'Leave', icon: Calendar },
            { id: 'QUERIES', label: 'Faculty Doubts', icon: MessageSquare },
            { id: 'PLANNER', label: 'Study Planner', icon: ListTodo },
            { id: 'DOCUMENTS', label: 'Documents', icon: FileBadge },
            { id: 'PROFILE', label: 'Profile & Settings', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as PortalTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[var(--brand-electric)] text-white shadow-sm'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-paper-warm)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="py-24 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[var(--brand-electric)] animate-spin mx-auto" />
            <div className="text-xs text-[var(--ink-muted)] font-medium">
              Synchronizing verified student academic ledger...
            </div>
          </div>
        ) : blockingErrors.length > 0 ? (
          <div className="py-16 flex justify-center" role="alert">
            <ErrorState
              title="Could not load this section"
              description={blockingErrors.map((k) => loadErrors[k]).join('; ')}
              onRetry={() => blockingErrors.forEach((k) => loadResource(k))}
            />
          </div>
        ) : (
          <>
            {/* 1. OVERVIEW / DASHBOARD TAB */}
            {activeTab === 'OVERVIEW' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <ExamVsClassCard analytics={analytics} error={loadErrors.analytics} />
                  <SubjectPerformanceCard analytics={analytics} error={loadErrors.analytics} />
                  <HomeworkCompletionCard analytics={analytics} error={loadErrors.analytics} />
                </div>
                {/* Greeting & Welcome Banner */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-[var(--bg-paper)] via-[var(--bg-paper-warm)] to-[var(--bg-paper)] border border-[var(--border-paper)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
                  <div>
                    <span className="text-[11px] font-semibold text-[var(--brand-electric)] tracking-wider uppercase font-data">
                      Verified Academic Dashboard
                    </span>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--ink-primary)] mt-1">
                      Welcome back, {student.fullName}
                    </h2>
                    <p className="font-sans text-xs text-[var(--ink-muted)] mt-1">
                      Enrolled in {profileData?.batchName || student.instituteName || 'All Batches'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('DIARY')}
                      className="px-3.5 py-2 rounded-xl bg-[var(--brand-electric)] hover:bg-[var(--brand-hover)] text-xs font-semibold text-white transition flex items-center gap-1.5 shadow"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Today's Diary</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('MATERIALS')}
                      className="px-3.5 py-2 rounded-xl bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] hover:bg-[var(--bg-surface-subtle)] text-xs font-semibold text-[var(--ink-primary)] transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Notes</span>
                    </button>
                  </div>
                </div>

                {/* KPI METRICS STRIP */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                  <div className="p-4 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-paper)]">
                    <div className="flex items-center justify-between text-[var(--ink-muted)] text-xs mb-1">
                      <span>Attendance Rate</span>
                      <CheckCircle2 className="w-4 h-4 text-[#047857]" />
                    </div>
                    <div className="font-data text-2xl font-bold text-[#047857]">
                      {attendanceData.percentage}%
                    </div>
                    <div className="text-[10px] text-[var(--ink-muted)] mt-1">
                      {attendanceData.attended} of {attendanceData.totalClasses} sessions present
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-paper)]">
                    <div className="flex items-center justify-between text-[var(--ink-muted)] text-xs mb-1">
                      <span>Average Score</span>
                      <TrendingUp className="w-4 h-4 text-[var(--brand-electric)]" />
                    </div>
                    <div className="font-data text-2xl font-bold text-[var(--ink-primary)]">
                      {avgScorePercentage !== null ? `${avgScorePercentage}%` : '—'}
                    </div>
                    <div className="text-[10px] text-[var(--ink-muted)] mt-1">
                      Across {results.length} published exams
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-paper)]">
                    <div className="flex items-center justify-between text-[var(--ink-muted)] text-xs mb-1">
                      <span>Pending Homework</span>
                      <Clock className="w-4 h-4 text-[#B45309]" />
                    </div>
                    <div className="font-data text-2xl font-bold text-[#B45309]">
                      {assignments.filter((a) => a.status === 'PENDING').length}
                    </div>
                    <div className="text-[10px] text-[var(--ink-muted)] mt-1">
                      Due this week
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--bg-paper)] border border-[var(--border-paper)]">
                    <div className="flex items-center justify-between text-[var(--ink-muted)] text-xs mb-1">
                      <span>Fee Balance</span>
                      <CreditCard className="w-4 h-4 text-[var(--ink-secondary)]" />
                    </div>
                    <div className="font-data text-2xl font-bold text-[var(--ink-primary)]">
                      ₹{feesData.balanceDue.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[var(--ink-muted)] mt-1">
                      {feesData.status === 'PAID' ? 'All dues cleared' : feesData.balanceDue > 0 ? 'Outstanding balance due' : 'No dues'}
                    </div>
                  </div>
                </div>

                {/* TODAY'S TIMETABLE & IMPORTANT ANNOUNCEMENTS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Today's Timetable */}
                  <div className="lg:col-span-2 p-5 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-paper)]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[var(--brand-electric)]" />
                        <h3 className="font-sans font-bold text-sm text-[var(--ink-primary)]">
                          Today's Academic Schedule
                        </h3>
                      </div>
                      <button
                        onClick={() => setActiveTab('TIMETABLE')}
                        className="text-xs text-[var(--brand-electric)] hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>Full Week</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {(dashboardData?.timetable ?? []).length === 0 && (
                        <p className="text-xs text-[var(--ink-muted)]">No classes scheduled today.</p>
                      )}
                      {(dashboardData?.timetable ?? []).map((slot: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] flex items-center justify-between gap-3 hover:border-[var(--border-paper)] transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-8 rounded-full bg-[var(--brand-electric)]" />
                            <div>
                              <div className="text-xs font-bold text-[var(--ink-primary)]">
                                {slot.subject}
                              </div>
                              <div className="text-[11px] text-[var(--ink-muted)]">
                                {slot.faculty} • Room {slot.room}
                              </div>
                            </div>
                          </div>
                          <div className="font-data text-xs font-semibold text-[var(--brand-electric)] bg-[rgba(22,119,255,0.1)] px-2.5 py-1 rounded-lg">
                            {slot.time}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Announcements Widget */}
                  <div className="p-5 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-paper)] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-[#B45309]" />
                        <h3 className="font-sans font-bold text-sm text-[var(--ink-primary)]">
                          Faculty Notices
                        </h3>
                      </div>

                      <div className="space-y-3">
                        {announcements.slice(0, 2).map((ann) => (
                          <div
                            key={ann.id}
                            className="p-3 rounded-xl bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  ann.priority === 'URGENT'
                                    ? 'bg-[rgba(244,63,94,0.15)] text-[#BE123C]'
                                    : 'bg-[rgba(22,119,255,0.15)] text-[var(--brand-electric)]'
                                }`}
                              >
                                {ann.priority}
                              </span>
                              <span className="font-data text-[10px] text-[var(--ink-muted)]">
                                {ann.date}
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-[var(--ink-primary)]">
                              {ann.title}
                            </div>
                            <p className="text-[11px] text-[var(--ink-muted)] line-clamp-2">
                              {ann.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('QUERIES')}
                      className="w-full mt-4 py-2 rounded-xl bg-[var(--bg-paper-warm)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-paper)] text-xs font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Ask Academic Question</span>
                    </button>
                  </div>
                </div>

                {/* RECENT TEACHING DIARY & RECENT NOTES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Latest Diary */}
                  <div className="p-5 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-paper)]">
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#047857]" />
                        <h3 className="font-sans font-bold text-sm text-[var(--ink-primary)]">
                          Latest Classroom Diary
                        </h3>
                      </div>
                      <button
                        onClick={() => setActiveTab('DIARY')}
                        className="text-xs text-[#047857] hover:underline font-semibold"
                      >
                        View All
                      </button>
                    </div>

                    {diaries[0] ? (
                      <div className="p-4 rounded-xl bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#047857] uppercase tracking-wider">
                            {diaries[0].subject} • {diaries[0].lessonDate}
                          </span>
                          <span className="text-[10px] text-[var(--ink-muted)]">
                            {diaries[0].facultyName}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-[var(--ink-primary)]">
                          {diaries[0].chapterTitle}
                        </div>
                        <p className="text-[11px] text-[var(--ink-muted)] line-clamp-3 leading-relaxed">
                          {diaries[0].conceptsTaught}
                        </p>
                        {diaries[0].homeworkAssigned && (
                          <div className="pt-2 border-t border-[var(--border-paper)] text-[11px] text-[#B45309] flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">HW: {diaries[0].homeworkAssigned}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-[var(--ink-muted)] py-6 text-center">
                        No diary entries published yet.
                      </div>
                    )}
                  </div>

                  {/* Recent Study Materials */}
                  <div className="p-5 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-paper)]">
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[var(--brand-electric)]" />
                        <h3 className="font-sans font-bold text-sm text-[var(--ink-primary)]">
                          Recent Notes & Worksheets
                        </h3>
                      </div>
                      <button
                        onClick={() => setActiveTab('MATERIALS')}
                        className="text-xs text-[var(--brand-electric)] hover:underline font-semibold"
                      >
                        Vault
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {materials.slice(0, 3).map((mat) => (
                        <div
                          key={mat.id}
                          className="p-3 rounded-xl bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] flex items-center justify-between gap-3 hover:border-[var(--border-paper)] transition"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <FileText className="w-4 h-4 text-[var(--brand-electric)] shrink-0" />
                            <div className="overflow-hidden">
                              <div className="text-xs font-bold text-[var(--ink-primary)] truncate">
                                {mat.title}
                              </div>
                              <div className="text-[10px] text-[var(--ink-muted)]">
                                {mat.subject} • {mat.fileSize || 'PDF'}
                              </div>
                            </div>
                          </div>

                          {mat.fileUrl && (
                            <a
                              href={mat.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-[var(--brand-electric)]/10 text-[var(--brand-electric)] hover:bg-[var(--brand-electric)] hover:text-white transition text-xs font-semibold shrink-0"
                            >
                              Download
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. DAILY TEACHING DIARY TAB */}
            {activeTab === 'DIARY' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
                      Daily Teaching Diary
                    </h2>
                    <p className="font-sans text-xs text-[var(--ink-muted)] mt-1">
                      Direct faculty lesson records, topics taught, and assigned homework for your batch.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search chapter, topics..."
                        className="bg-[var(--bg-paper)] border border-[var(--border-paper)] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[var(--ink-primary)] outline-none focus:border-[var(--brand-electric)] w-48 sm:w-64"
                      />
                    </div>
                  </div>
                </div>

                {/* Subject Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {['ALL', 'Mathematics', 'Physics', 'Chemistry'].map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubject(sub)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        selectedSubject === sub
                          ? 'bg-[#047857] text-white shadow'
                          : 'bg-[var(--bg-paper)] border border-[var(--border-paper)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
                      }`}
                    >
                      {sub === 'ALL' ? 'All Subjects' : sub}
                    </button>
                  ))}
                </div>

                {/* Diary Entries List */}
                <div className="space-y-4">
                  {diaries
                    .filter((d) => selectedSubject === 'ALL' || d.subject === selectedSubject)
                    .filter(
                      (d) =>
                        !searchQuery.trim() ||
                        d.chapterTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        d.conceptsTaught.toLowerCase().includes(searchQuery.toLowerCase()),
                    )
                    .map((diary) => (
                      <div
                        key={diary.id}
                        className="p-5 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-paper)] hover:border-[var(--border-paper)] transition shadow-lg space-y-3.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-paper)] pb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[rgba(16,185,129,0.15)] text-[#047857]">
                              {diary.subject}
                            </span>
                            <span className="font-data text-xs font-semibold text-[var(--ink-primary)]">
                              {diary.lessonDate} {diary.sessionTime ? ` (${diary.sessionTime})` : ''}
                            </span>
                          </div>
                          <div className="text-xs text-[var(--ink-muted)]">
                            Faculty: <span className="font-semibold text-[var(--ink-primary)]">{diary.facultyName}</span>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-sans font-bold text-base text-[var(--ink-primary)]">
                            {diary.chapterTitle}
                          </h3>
                          <div className="mt-2 text-xs text-[var(--ink-secondary)] leading-relaxed whitespace-pre-line bg-[var(--bg-paper-warm)] p-3.5 rounded-xl border border-[var(--border-paper)]">
                            <span className="font-bold text-[var(--ink-primary)] block mb-1">Concepts Covered:</span>
                            {diary.conceptsTaught}
                          </div>
                        </div>

                        {diary.learningObjectives && (
                          <div className="text-xs text-[var(--ink-muted)]">
                            <span className="font-semibold text-[var(--ink-secondary)]">Objectives: </span>
                            {diary.learningObjectives}
                          </div>
                        )}

                        {diary.homeworkAssigned && (
                          <div className="p-3 rounded-xl bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] text-xs text-[#B45309] flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 shrink-0" />
                              <span><strong className="text-amber-300">Homework:</strong> {diary.homeworkAssigned}</span>
                            </div>
                            <button
                              onClick={() => setActiveTab('ASSIGNMENTS')}
                              className="px-2.5 py-1 rounded bg-[#B45309] text-black font-semibold text-[11px] shrink-0 hover:bg-amber-400 transition"
                            >
                              Submit
                            </button>
                          </div>
                        )}

                        {diary.attachmentUrl && (
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] text-[var(--ink-muted)] flex items-center gap-1.5">
                              <FileCheck className="w-3.5 h-3.5 text-[#047857]" />
                              <span>Faculty Attached Lesson Notes</span>
                            </span>
                            <a
                              href={diary.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-[var(--bg-paper-warm)] hover:bg-[var(--brand-electric)] text-[var(--brand-electric)] hover:text-white border border-[var(--border-paper)] text-xs font-semibold transition flex items-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download PDF</span>
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 3. NOTES & STUDY MATERIALS LIBRARY TAB */}
            {activeTab === 'MATERIALS' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
                      Study Materials & Notes Vault
                    </h2>
                    <p className="font-sans text-xs text-[var(--ink-muted)] mt-1">
                      Direct high-speed delivery from verified Media CDN (media.dhyey.cc). Zero database bloat.
                    </p>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search notes, formulas..."
                      className="bg-[var(--bg-paper)] border border-[var(--border-paper)] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[var(--ink-primary)] outline-none focus:border-[var(--brand-electric)] w-48 sm:w-64"
                    />
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {MATERIAL_CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                        selectedCategory === cat.key
                          ? 'bg-[var(--brand-electric)] text-white shadow'
                          : 'bg-[var(--bg-paper)] border border-[var(--border-paper)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Materials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMaterials.map((mat) => (
                    <div
                      key={mat.id}
                      className="p-5 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-paper)] hover:border-[var(--border-paper)] transition shadow-lg flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-[var(--ink-muted)] mb-2">
                          <span className="px-2 py-0.5 rounded bg-[var(--bg-paper-warm)] text-[var(--brand-electric)] font-semibold border border-[var(--border-paper)]">
                            {mat.category.replace(/_/g, ' ')}
                          </span>
                          <span className="font-data">{mat.fileSize || 'PDF'}</span>
                        </div>

                        <h3 className="font-sans font-bold text-sm text-[var(--ink-primary)] line-clamp-2">
                          {mat.title}
                        </h3>

                        <div className="text-[11px] text-[var(--ink-muted)] mt-1">
                          {mat.chapter ? `${mat.chapter} • ` : ''}{mat.subject}
                        </div>

                        {mat.content && (
                          <p className="text-[11px] text-[var(--ink-secondary)] line-clamp-2 mt-2 leading-relaxed">
                            {mat.content}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-[var(--border-paper)] flex items-center justify-between gap-2">
                        <span className="text-[10px] text-[var(--ink-muted)]">
                          By {mat.facultyName || 'Faculty'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {mat.fileUrl && (
                            <button
                              onClick={() => handleCopy(mat.fileUrl!, mat.id)}
                              className="p-1.5 rounded-lg bg-[var(--bg-paper-warm)] hover:bg-[var(--bg-surface-subtle)] text-[var(--ink-muted)] hover:text-white transition"
                              title="Copy CDN Link"
                            >
                              {copiedId === mat.id ? <Check className="w-3.5 h-3.5 text-[#047857]" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          {mat.fileUrl && (
                            <a
                              href={mat.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-[var(--brand-electric)] hover:bg-[var(--brand-hover)] text-white text-xs font-semibold transition flex items-center gap-1 shadow"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. TIMETABLE TAB */}
            {activeTab === 'TIMETABLE' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
                    Weekly Academic Timetable
                  </h2>
                  <p className="font-sans text-xs text-[var(--ink-muted)] mt-1">
                    Scheduled lecture sessions, doubt clinics, and weekly assessments.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {timetable.map((dayPlan, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-paper)] space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-[var(--border-paper)]">
                        <h3 className="font-sans font-bold text-sm text-[var(--ink-primary)]">
                          {dayPlan.day}
                        </h3>
                        <span className="text-[10px] text-[var(--brand-electric)] font-semibold bg-[rgba(22,119,255,0.1)] px-2 py-0.5 rounded">
                          {dayPlan.slots.length} Classes
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {dayPlan.slots.map((slot, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-3 rounded-xl bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] space-y-1"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-[var(--ink-primary)]">{slot.subject}</span>
                              <span className="font-data text-[11px] text-[var(--brand-electric)] font-semibold">
                                {slot.time}
                              </span>
                            </div>
                            <div className="text-[11px] text-[var(--ink-muted)]">
                              Topic: {slot.topic}
                            </div>
                            <div className="text-[10px] text-[var(--ink-faint)] flex items-center justify-between pt-1">
                              <span>{slot.faculty}</span>
                              <span>Room {slot.room}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. ATTENDANCE & CORRECTION REQUEST TAB */}
            {activeTab === 'ATTENDANCE' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
                      Attendance Ledger & Eligibility
                    </h2>
                    <p className="font-sans text-xs text-[var(--ink-muted)] mt-1">
                      Verified roll-call attendance recorded by faculty. Submit correction requests if needed.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowAttendanceModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-[var(--brand-electric)] hover:bg-[var(--brand-hover)] text-xs font-semibold text-white transition flex items-center gap-1.5 shadow"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Request Correction</span>
                  </button>
                </div>

                {/* Monthly Attendance Rate Chart */}
                <StudentAttendanceTrendCard records={attendanceData.records} />

                {/* Progress Banner */}
                <div className="p-6 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-paper)] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                  <div className="space-y-2 text-center md:text-left">
                    <div className="text-xs text-[var(--ink-muted)] uppercase tracking-wider font-semibold">
                      Current Standing
                    </div>
                    <div className="flex items-baseline gap-3 justify-center md:justify-start">
                      <span className="font-data text-4xl font-extrabold text-[#047857]">
                        {attendanceData.percentage}%
                      </span>
                      <span className="text-xs text-[#047857] font-semibold px-2 py-0.5 rounded bg-[rgba(16,185,129,0.12)]">
                        Eligible for Mock Tests (Min 75% required)
                      </span>
                    </div>
                    <p className="text-xs text-[var(--ink-muted)]">
                      You have attended {attendanceData.attended} out of {attendanceData.totalClasses} scheduled sessions.
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-center p-3 rounded-xl bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] min-w-[70px]">
                      <div className="font-data text-lg font-bold text-[#047857]">{attendanceData.attended}</div>
                      <div className="text-[10px] text-[var(--ink-muted)]">Present</div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] min-w-[70px]">
                      <div className="font-data text-lg font-bold text-[#BE123C]">{attendanceData.absent}</div>
                      <div className="text-[10px] text-[var(--ink-muted)]">Absent</div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] min-w-[70px]">
                      <div className="font-data text-lg font-bold text-[#B45309]">{attendanceData.late}</div>
                      <div className="text-[10px] text-[var(--ink-muted)]">Late</div>
                    </div>
                  </div>
                </div>

                {/* Session Records Table */}
                <div className="rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-paper)] overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-[var(--border-paper)] font-bold text-xs text-[var(--ink-primary)]">
                    Recent Session Attendance History
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--border-paper)] bg-[var(--bg-paper-warm)]/50 text-[11px] text-[var(--ink-muted)]">
                          <th className="p-3.5 font-semibold">Date</th>
                          <th className="p-3.5 font-semibold">Subject / Session</th>
                          <th className="p-3.5 font-semibold">Status</th>
                          <th className="p-3.5 font-semibold">Faculty Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-paper)] text-xs">
                        {attendanceData.records.map((rec) => (
                          <tr key={rec.id} className="hover:bg-[var(--bg-paper-warm)]/40 transition">
                            <td className="p-3.5 font-data text-[var(--ink-primary)]">{rec.date}</td>
                            <td className="p-3.5 text-[var(--ink-secondary)]">{rec.subjectName || 'Class Session'}</td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  rec.status === 'PRESENT'
                                    ? 'bg-[rgba(16,185,129,0.15)] text-[#047857]'
                                    : rec.status === 'LATE'
                                    ? 'bg-[rgba(245,158,11,0.15)] text-[#B45309]'
                                    : 'bg-[rgba(244,63,94,0.15)] text-[#BE123C]'
                                }`}
                              >
                                {rec.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-[var(--ink-muted)] text-[11px]">{rec.remarks || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 6. HOMEWORK & ASSIGNMENTS TAB */}
            {activeTab === 'ASSIGNMENTS' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
                    Homework & Assignment Tracker
                  </h2>
                  <p className="font-sans text-xs text-[var(--ink-muted)] mt-1">
                    Solve daily problem practice (DPP) sets and submit homework for faculty evaluation.
                  </p>
                </div>

                {/* Assignment Status Distribution */}
                <StudentAssignmentBreakdownCard assignments={assignments} />

                {assignments.length === 0 ? (
                  <EmptyState
                    art="education/homework"
                    title="No assignments published yet"
                    description="Practice problem sets and homework assigned by faculty will appear here."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {assignments.map((asg) => (
                    <div
                      key={asg.id}
                      className="p-5 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-paper)] flex flex-col justify-between space-y-4 shadow-lg"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--bg-paper-warm)] text-[var(--brand-electric)] border border-[var(--border-paper)]">
                            {asg.subject}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              asg.status === 'GRADED'
                                ? 'bg-[rgba(16,185,129,0.15)] text-[#047857]'
                                : asg.status === 'SUBMITTED'
                                ? 'bg-[rgba(22,119,255,0.15)] text-[var(--brand-electric)]'
                                : 'bg-[rgba(245,158,11,0.15)] text-[#B45309]'
                            }`}
                          >
                            {asg.status}
                          </span>
                        </div>

                        <h3 className="font-sans font-bold text-sm text-[var(--ink-primary)]">
                          {asg.title}
                        </h3>

                        <p className="text-xs text-[var(--ink-muted)] leading-relaxed line-clamp-3">
                          {asg.instructions}
                        </p>

                        <div className="text-[11px] text-[var(--ink-secondary)] pt-1">
                          Max Marks: <strong className="font-data">{asg.maxMarks}</strong>
                        </div>
                        {asg.attachmentUrl && (
                          <a href={asg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--brand-electric)] underline">
                            <FileText className="w-3.5 h-3.5" /> Open assignment document
                          </a>
                        )}
                      </div>

                      {asg.submission?.marksObtained !== undefined && (
                        <div className="p-3 rounded-xl bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] text-xs space-y-1">
                          <div className="flex items-center justify-between text-[#047857] font-bold">
                            <span>Score Released:</span>
                            <span className="font-data">{asg.submission.marksObtained} / {asg.maxMarks}</span>
                          </div>
                          {asg.submission.feedback && (
                            <div className="text-[11px] text-[var(--ink-muted)]">
                              Feedback: {asg.submission.feedback}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="pt-2 border-t border-[var(--border-paper)] flex items-center justify-between">
                        <span className="text-[10px] text-[var(--ink-muted)]">
                          Due: {new Date(asg.dueDate).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedAssignment(asg);
                            setAssignmentAnswer(asg.submission?.content || '');
                            setAssignmentFileUrl(asg.submission?.attachmentUrl || '');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[var(--brand-electric)] hover:bg-[var(--brand-hover)] text-white text-xs font-semibold transition"
                        >
                          {asg.status === 'GRADED' ? 'View Work' : asg.status === 'SUBMITTED' ? 'Edit Work' : 'Submit'}
                        </button>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </div>
            )}

            {/* 7. TESTS & QUIZZES TAB */}
            {activeTab === 'TESTS' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
                    Online Tests & Examination Center
                  </h2>
                  <p className="font-sans text-xs text-[var(--ink-muted)] mt-1">
                    Computer-based tests (CBT) with server-side time tracking, negative marking, and instant scoring.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {tests.map((test) => (
                    <div
                      key={test.id}
                      className="p-5 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-paper)] flex flex-col justify-between space-y-4 shadow-lg"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--bg-paper-warm)] text-[var(--brand-electric)]">
                            {test.subject}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              test.status === 'ACTIVE'
                                ? 'bg-[rgba(16,185,129,0.15)] text-[#047857]'
                                : test.status === 'COMPLETED'
                                ? 'bg-[rgba(22,119,255,0.15)] text-[var(--brand-electric)]'
                                : 'bg-[rgba(245,158,11,0.15)] text-[#B45309]'
                            }`}
                          >
                            {test.status}
                          </span>
                        </div>

                        <h3 className="font-sans font-bold text-sm text-[var(--ink-primary)]">
                          {test.title}
                        </h3>

                        <p className="text-xs text-[var(--ink-muted)] line-clamp-2">
                          {test.instructions}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-[var(--ink-secondary)] pt-1">
                          <span>Duration: <strong className="font-data">{test.durationMinutes}m</strong></span>
                          <span>•</span>
                          <span>Max: <strong className="font-data">{test.totalMarks}M</strong></span>
                        </div>
                      </div>

                      {test.attempt && (
                        <div className="p-3 rounded-xl bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] text-xs text-[#047857] font-bold flex items-center justify-between">
                          <span>Attempt Scored:</span>
                          <span className="font-data">{test.attempt.score} / {test.totalMarks}</span>
                        </div>
                      )}

                      <button
                        onClick={() => handleStartTest(test.id)}
                        disabled={test.status === 'COMPLETED'}
                        className="w-full py-2.5 rounded-xl bg-[var(--brand-electric)] hover:bg-[var(--brand-hover)] disabled:bg-[var(--bg-paper-warm)] disabled:text-[var(--ink-faint)] text-xs font-semibold text-white transition flex items-center justify-center gap-1.5 shadow"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{test.status === 'COMPLETED' ? 'Completed' : 'Start Test Session'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 8. EXAM RESULTS & BULK MARKS TAB */}
            {activeTab === 'RESULTS' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
                      Verified Classroom Assessment Results
                    </h2>
                    <p className="font-sans text-xs text-[var(--ink-muted)] mt-1">
                      Scores published by faculty via bulk assessment entry. Download official report cards.
                    </p>
                  </div>

                  <a
                    href="https://media-hosting.dhyeyp254.workers.dev/1793335828256.json"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-[var(--brand-electric)] hover:bg-[var(--brand-hover)] text-xs font-semibold text-white transition flex items-center gap-1.5 shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Report Card (PDF)</span>
                  </a>
                </div>

                {/* Score Trends & Subject Averages */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <StudentResultsTrendCard results={results} />
                  <StudentSubjectAveragesCard results={results} />
                </div>

                <div className="rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-paper)] overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--border-paper)] bg-[var(--bg-paper-warm)]/50 text-[11px] text-[var(--ink-muted)]">
                          <th className="p-3.5 font-semibold">Assessment Title</th>
                          <th className="p-3.5 font-semibold">Subject</th>
                          <th className="p-3.5 font-semibold">Max</th>
                          <th className="p-3.5 font-semibold">Obtained</th>
                          <th className="p-3.5 font-semibold">Percentage</th>
                          <th className="p-3.5 font-semibold">Grade</th>
                          <th className="p-3.5 font-semibold">Faculty Feedback</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-paper)] text-xs">
                        {filteredResults.map((res) => (
                          <tr key={res.assessmentId} className="hover:bg-[var(--bg-paper-warm)]/40 transition">
                            <td className="p-3.5 font-bold text-[var(--ink-primary)]">{res.title}</td>
                            <td className="p-3.5 text-[var(--ink-secondary)]">{res.subject}</td>
                            <td className="p-3.5 font-data text-[var(--ink-muted)]">{res.maxMarks}</td>
                            <td className="p-3.5 font-data font-bold text-[#047857]">{res.obtainedMarks ?? '—'}</td>
                            <td className="p-3.5 font-data font-bold text-[var(--brand-electric)]">
                              {res.percentage !== null ? `${res.percentage}%` : '—'}
                            </td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[rgba(16,185,129,0.15)] text-[#047857]">
                                {res.grade || '—'}
                              </span>
                            </td>
                            <td className="p-3.5 text-[11px] text-[var(--ink-muted)]">{res.feedback || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 9. FEES & DUES TAB */}
            {activeTab === 'FEES' && <StudentFeesPanel />}

            {activeTab === 'LEAVES' && <StudentLeavesPanel />}

            {activeTab === 'QUERIES' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
                      Faculty Academic Doubts Clinic
                    </h2>
                    <p className="font-sans text-xs text-[var(--ink-muted)] mt-1">
                      Submit homework or conceptual doubts to faculty and receive verified answers.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowQueryModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-[var(--brand-electric)] hover:bg-[var(--brand-hover)] text-xs font-semibold text-white transition flex items-center gap-1.5 shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ask New Doubt</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {queries.map((q) => (
                    <div
                      key={q.id}
                      className="p-5 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-paper)] space-y-3.5 shadow-lg"
                    >
                      <div className="flex items-center justify-between border-b border-[var(--border-paper)] pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--bg-paper-warm)] text-[var(--brand-electric)]">
                            {q.subject}
                          </span>
                          {q.topic && (
                            <span className="text-xs text-[var(--ink-secondary)] font-semibold">
                              {q.topic}
                            </span>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            q.status === 'ANSWERED'
                              ? 'bg-[rgba(16,185,129,0.15)] text-[#047857]'
                              : 'bg-[rgba(245,158,11,0.15)] text-[#B45309]'
                          }`}
                        >
                          {q.status}
                        </span>
                      </div>

                      <div className="text-xs text-[var(--ink-primary)] leading-relaxed">
                        <strong className="text-[var(--ink-muted)] block mb-1">Your Question:</strong>
                        {q.questionText}
                      </div>

                      {q.facultyReply && (
                        <div className="p-3.5 rounded-xl bg-[var(--bg-paper-warm)] border border-[rgba(16,185,129,0.2)] text-xs text-[var(--ink-secondary)] space-y-1">
                          <div className="flex items-center justify-between text-[#047857] font-bold text-[11px]">
                            <span>Faculty Response ({q.facultyName || 'Faculty'})</span>
                            <span className="font-data text-[10px] text-[var(--ink-muted)]">{q.repliedAt?.split('T')[0]}</span>
                          </div>
                          <p className="leading-relaxed">{q.facultyReply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 11. STUDY PLANNER TAB */}
            {activeTab === 'PLANNER' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
                    Personal Study Planner & Daily Checklist
                  </h2>
                  <p className="font-sans text-xs text-[var(--ink-muted)] mt-1">
                    Manage daily study goals, DPP checklists, and syllabus preparation deadlines.
                  </p>
                </div>

                {/* Add Task Form */}
                <form
                  onSubmit={handleCreateTask}
                  className="p-4 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-paper)] flex flex-col sm:flex-row items-center gap-3 shadow-lg"
                >
                  <input
                    type="text"
                    required
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="e.g. Solve 30 Questions on Definite Integrals DPP 14"
                    className="flex-1 w-full bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--ink-primary)] outline-none focus:border-[var(--brand-electric)]"
                  />
                  <select
                    value={newTaskSubject}
                    onChange={(e) => setNewTaskSubject(e.target.value)}
                    className="w-full sm:w-36 bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] rounded-xl px-3 py-2.5 text-xs text-[var(--ink-primary)] outline-none"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="General Study">General</option>
                  </select>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full sm:w-28 bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] rounded-xl px-3 py-2.5 text-xs text-[var(--ink-primary)] outline-none"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="LOW">Low</option>
                  </select>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[var(--brand-electric)] hover:bg-[var(--brand-hover)] text-xs font-semibold text-white transition flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Task</span>
                  </button>
                </form>

                {/* Study Goals Progress Donut */}
                <StudentTaskProgressCard tasks={studyTasks} />

                {/* Tasks List */}
                <div className="space-y-2.5">
                  {studyTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-xl bg-[var(--bg-paper)] border transition flex items-center justify-between gap-3 shadow-sm ${
                        task.isCompleted
                          ? 'border-[var(--border-paper)] opacity-60'
                          : 'border-[var(--border-paper)] hover:border-[var(--border-paper)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleTask(task.id, task.isCompleted)}
                          className="text-[var(--brand-electric)] hover:text-[var(--brand-hover)] transition"
                        >
                          {task.isCompleted ? (
                            <CheckSquare className="w-4 h-4 text-[#047857]" />
                          ) : (
                            <Square className="w-4 h-4 text-[var(--ink-muted)]" />
                          )}
                        </button>
                        <div>
                          <div
                            className={`text-xs font-bold ${
                              task.isCompleted ? 'line-through text-[var(--ink-muted)]' : 'text-[var(--ink-primary)]'
                            }`}
                          >
                            {task.title}
                          </div>
                          <div className="text-[10px] text-[var(--ink-muted)] flex items-center gap-2 mt-0.5">
                            <span>{task.subject}</span>
                            <span>•</span>
                            <span
                              className={
                                task.priority === 'HIGH'
                                  ? 'text-[#BE123C] font-semibold'
                                  : 'text-[var(--ink-muted)]'
                              }
                            >
                              {task.priority} Priority
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[#BE123C] hover:bg-[var(--bg-paper-warm)] transition"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 12. DOCUMENTS & PDF CENTER TAB */}
            {activeTab === 'DOCUMENTS' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
                    Official Student Documents & PDF Center
                  </h2>
                  <p className="font-sans text-xs text-[var(--ink-muted)] mt-1">
                    Download official statements, report cards, fee receipts, and timetables.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-5 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-paper)] flex items-center justify-between gap-4 shadow-lg hover:border-[var(--border-paper)] transition"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] flex items-center justify-center text-[var(--brand-electric)] shrink-0">
                          <FileBadge className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[var(--ink-primary)] line-clamp-1">
                            {doc.title}
                          </div>
                          <div className="text-[10px] text-[var(--ink-muted)] mt-0.5">
                            {doc.academicPeriod} • Issued: {doc.issueDate} • {doc.fileSize}
                          </div>
                        </div>
                      </div>

                      <a
                        href={doc.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-[var(--brand-electric)] hover:bg-[var(--brand-hover)] text-white text-xs font-semibold transition flex items-center gap-1.5 shrink-0 shadow"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 13. PROFILE & SETTINGS TAB */}
            {activeTab === 'PROFILE' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
                    Student Profile & Institute Enrollment
                  </h2>
                  <p className="font-sans text-xs text-[var(--ink-muted)] mt-1">
                    Manage your credentials, verify institute membership, or join a new batch via invitation code.
                  </p>
                </div>

                {/* Profile Identity Card */}
                <div className="p-6 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-paper)] grid grid-cols-1 md:grid-cols-2 gap-6 shadow-xl">
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-[var(--brand-electric)] uppercase tracking-wider">
                      Student Credentials
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--ink-muted)] uppercase block">Full Name</label>
                      <div className="text-sm font-bold text-[var(--ink-primary)]">{student.fullName}</div>
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--ink-muted)] uppercase block">Email Address</label>
                      <div className="text-sm text-[var(--ink-primary)]">{student.email}</div>
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--ink-muted)] uppercase block">Phone Contact</label>
                      <div className="text-sm text-[var(--ink-primary)]">{profileData?.phone || 'Not provided'}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs font-bold text-[#047857] uppercase tracking-wider">
                      Academic Allocation
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--ink-muted)] uppercase block">Enrolled Institute</label>
                      <div className="text-sm font-bold text-[var(--ink-primary)]">
                        {student.instituteName || 'Enrolled Institute'}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--ink-muted)] uppercase block">Batch Assignment</label>
                      <div className="text-sm text-[var(--ink-primary)]">
                        {profileData?.batchName || '—'}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--ink-muted)] uppercase block">Student Roll Number</label>
                      <div className="text-sm font-data font-bold text-[#047857]">
                        {profileData?.rollNumber || '—'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* JOIN BATCH WITH INVITATION CODE */}
                <div className="p-6 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-paper)] space-y-4 shadow-xl">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[var(--brand-electric)]" />
                    <h3 className="font-sans font-bold text-sm text-[var(--ink-primary)]">
                      Join Another Batch via Invitation Code
                    </h3>
                  </div>
                  <p className="text-xs text-[var(--ink-muted)]">
                    If your instructor provided a fresh invitation code for Physics, Chemistry, or Special Mock Batches, redeem it below.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="text"
                      value={inviteCodeInput}
                      onChange={(e) => setInviteCodeInput(e.target.value)}
                      placeholder="e.g. APEX-INV-2026"
                      className="flex-1 w-full bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--ink-primary)] outline-none focus:border-[var(--brand-electric)]"
                    />
                    <button
                      onClick={handleVerifyInvite}
                      disabled={isValidatingInvite || !inviteCodeInput.trim()}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[var(--bg-paper-warm)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-paper)] text-xs font-semibold text-[var(--ink-primary)] transition"
                    >
                      {isValidatingInvite ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Verify Code'}
                    </button>
                  </div>

                  {inviteValidationResult && (
                    <div className="p-4 rounded-xl bg-[var(--bg-paper-warm)] border border-[rgba(16,185,129,0.3)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-[#047857]">Valid Invitation Verified!</div>
                        <div className="text-xs text-[var(--ink-primary)] font-medium mt-0.5">
                          {inviteValidationResult.instituteName} — {inviteValidationResult.batchName} ({inviteValidationResult.subject})
                        </div>
                      </div>
                      <button
                        onClick={handleConfirmJoinBatch}
                        className="px-4 py-2 rounded-xl bg-[#047857] hover:bg-emerald-600 text-xs font-bold text-white transition shadow"
                      >
                        Confirm Enrollment
                      </button>
                    </div>
                  )}

                  {inviteStatusMsg && (
                    <div className="text-xs text-[#B45309] font-medium">{inviteStatusMsg}</div>
                  )}
                </div>

                {/* SUPPORT & HELP */}
                <div className="p-6 rounded-2xl bg-[var(--bg-paper)] border border-[var(--border-paper)] flex items-center justify-between shadow-xl">
                  <div>
                    <h3 className="font-sans font-bold text-sm text-[var(--ink-primary)]">
                      Academic Help & Support Desk
                    </h3>
                    <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                      Need correction in profile details, fees, or report cards? Submit an official ticket.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSupportModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-[var(--bg-paper-warm)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-paper)] text-xs font-semibold text-[var(--ink-primary)] transition flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Create Ticket</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* --------------------------------------------------------------------------
          MODALS & SLIDING DRAWERS
      -------------------------------------------------------------------------- */}

      {/* 1. NOTIFICATIONS DRAWER */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-[var(--bg-paper)] h-full border-l border-[var(--border-paper)] p-6 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-paper)]">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[var(--brand-electric)]" />
                  <h3 className="font-sans font-bold text-base text-[var(--ink-primary)]">
                    Notifications
                  </h3>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1 rounded-lg text-[var(--ink-muted)] hover:bg-[var(--bg-paper-warm)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 mt-4 overflow-y-auto max-h-[75vh] pr-1">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3.5 rounded-xl border transition space-y-1 ${
                      notif.isRead
                        ? 'bg-[var(--bg-paper-warm)]/40 border-[var(--border-paper)] text-[var(--ink-muted)]'
                        : 'bg-[var(--bg-paper-warm)] border-[rgba(22,119,255,0.3)] text-[var(--ink-primary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-[var(--ink-muted)]">
                      <span className="font-semibold text-[var(--brand-electric)]">{notif.type}</span>
                      <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs font-bold">{notif.title}</div>
                    <p className="text-[11px] text-[var(--ink-secondary)]">{notif.message}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                setShowNotifications(false);
              }}
              className="w-full py-2.5 rounded-xl bg-[var(--bg-paper-warm)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-paper)] text-xs font-semibold text-[var(--ink-primary)] transition"
            >
              Mark All as Read
            </button>
          </div>
        </div>
      )}

      {/* 2. SUBMIT ASSIGNMENT MODAL */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[var(--bg-paper)] border border-[var(--border-paper)] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-sans font-bold text-base text-[var(--ink-primary)]">
                  Submit Homework: {selectedAssignment.title}
                </h3>
                <p className="text-xs text-[var(--ink-muted)]">Max Marks: {selectedAssignment.maxMarks}</p>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="p-1 rounded-lg text-[var(--ink-muted)] hover:bg-[var(--bg-paper-warm)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Your Answer / Notes
              </label>
              <textarea
                rows={4}
                value={assignmentAnswer}
                onChange={(e) => setAssignmentAnswer(e.target.value)}
                placeholder="Write your calculations, notes, or explanations..."
                className="w-full bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] rounded-xl p-3 text-xs text-[var(--ink-primary)] outline-none focus:border-[var(--brand-electric)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Attachment URL (Media CDN or Google Drive / Scanned PDF)
              </label>
              <input
                type="text"
                value={assignmentFileUrl}
                onChange={(e) => setAssignmentFileUrl(e.target.value)}
                placeholder="https://media-hosting.dhyeyp254.workers.dev/..."
                className="w-full bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] rounded-xl px-3 py-2 text-xs text-[var(--ink-primary)] outline-none focus:border-[var(--brand-electric)]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleSubmitAssignment(true)}
                disabled={isSubmittingAssignment}
                className="px-4 py-2 rounded-xl bg-[var(--bg-paper-warm)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-paper)] text-xs font-semibold text-[var(--ink-primary)] transition"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => handleSubmitAssignment(false)}
                disabled={isSubmittingAssignment}
                className="px-4 py-2 rounded-xl bg-[var(--brand-electric)] hover:bg-[var(--brand-hover)] text-xs font-semibold text-white transition flex items-center gap-1.5"
              >
                {isSubmittingAssignment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Submit Final Work</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. ONLINE ASSESSMENT MODAL */}
      {activeTest && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[var(--bg-paper)] border border-[var(--border-paper)] rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-paper)] pb-3">
              <div>
                <h3 className="font-sans font-bold text-lg text-[var(--ink-primary)]">
                  {activeTest.title}
                </h3>
                <p className="text-xs text-[var(--ink-muted)]">
                  Duration: {activeTest.durationMinutes}m • Total Marks: {activeTest.totalMarks}
                </p>
              </div>
              <button
                onClick={() => setActiveTest(null)}
                className="p-1 rounded-lg text-[var(--ink-muted)] hover:bg-[var(--bg-paper-warm)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {testResultFeedback ? (
              <div className="p-5 rounded-xl bg-[rgba(16,185,129,0.12)] border border-[rgba(16,185,129,0.3)] text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-[#047857] mx-auto" />
                <div className="font-display text-xl font-bold text-[var(--ink-primary)]">
                  Test Submitted Successfully!
                </div>
                <p className="text-xs text-[var(--ink-secondary)]">{testResultFeedback}</p>
                <button
                  onClick={() => setActiveTest(null)}
                  className="px-5 py-2 rounded-xl bg-[#047857] text-white font-bold text-xs"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeTest.questions.map((q: any, idx: number) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] space-y-3"
                  >
                    <div className="text-xs font-bold text-[var(--ink-primary)] flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[var(--brand-electric)]/20 text-[var(--brand-electric)] flex items-center justify-center text-[10px] font-data">
                        {idx + 1}
                      </span>
                      <span>{q.text}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options?.map((opt: string, optIdx: number) => {
                        const isSelected = testAnswers[q.id] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() =>
                              setTestAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                            }
                            className={`p-3 rounded-xl border text-left text-xs transition flex items-center gap-2.5 ${
                              isSelected
                                ? 'bg-[var(--brand-electric)]/20 border-[var(--brand-electric)] text-white font-bold'
                                : 'bg-[var(--bg-paper)] border-[var(--border-paper)] text-[var(--ink-secondary)] hover:bg-[var(--bg-surface-subtle)]'
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                                isSelected ? 'border-[var(--brand-electric)] bg-[var(--brand-electric)] text-white' : 'border-[var(--ink-faint)]'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleSubmitTest}
                  disabled={isSubmittingTest}
                  className="w-full py-3 rounded-xl bg-[#047857] hover:bg-emerald-600 text-xs font-bold text-white transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {isSubmittingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Submit Assessment For Server Grading</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. ATTENDANCE CORRECTION MODAL */}
      {showAttendanceModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitCorrection}
            className="w-full max-w-md bg-[var(--bg-paper)] border border-[var(--border-paper)] rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-bold text-base text-[var(--ink-primary)]">
                Attendance Correction Request
              </h3>
              <button
                type="button"
                onClick={() => setShowAttendanceModal(false)}
                className="p-1 rounded-lg text-[var(--ink-muted)] hover:bg-[var(--bg-paper-warm)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Session Date *
              </label>
              <input
                type="date"
                required
                value={correctionDate}
                onChange={(e) => setCorrectionDate(e.target.value)}
                className="w-full bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] rounded-xl px-3 py-2 text-xs text-[var(--ink-primary)] outline-none focus:border-[var(--brand-electric)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Reason for Correction *
              </label>
              <textarea
                rows={3}
                required
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="Explain why you were marked absent or late (e.g. attended stream, medical slip)..."
                className="w-full bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] rounded-xl p-3 text-xs text-[var(--ink-primary)] outline-none focus:border-[var(--brand-electric)]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAttendanceModal(false)}
                className="px-4 py-2 rounded-xl bg-[var(--bg-paper-warm)] text-xs font-semibold text-[var(--ink-muted)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingCorrection}
                className="px-4 py-2 rounded-xl bg-[var(--brand-electric)] hover:bg-[var(--brand-hover)] text-xs font-semibold text-white transition flex items-center gap-1.5"
              >
                {isSubmittingCorrection ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Submit Request</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. ASK FACULTY DOUBT MODAL */}
      {showQueryModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitDoubt}
            className="w-full max-w-lg bg-[var(--bg-paper)] border border-[var(--border-paper)] rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-bold text-base text-[var(--ink-primary)]">
                Ask Academic Doubt
              </h3>
              <button
                type="button"
                onClick={() => setShowQueryModal(false)}
                className="p-1 rounded-lg text-[var(--ink-muted)] hover:bg-[var(--bg-paper-warm)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                  Subject *
                </label>
                <select
                  value={querySubject}
                  onChange={(e) => setQuerySubject(e.target.value)}
                  className="w-full bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] rounded-xl px-3 py-2 text-xs text-[var(--ink-primary)] outline-none"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                  Topic / Chapter
                </label>
                <input
                  type="text"
                  value={queryTopic}
                  onChange={(e) => setQueryTopic(e.target.value)}
                  placeholder="e.g. Definite Integrals"
                  className="w-full bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] rounded-xl px-3 py-2 text-xs text-[var(--ink-primary)] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Describe Your Doubt / Question *
              </label>
              <textarea
                rows={4}
                required
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Explain the step where you are stuck or paste the problem text..."
                className="w-full bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] rounded-xl p-3 text-xs text-[var(--ink-primary)] outline-none focus:border-[var(--brand-electric)]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowQueryModal(false)}
                className="px-4 py-2 rounded-xl bg-[var(--bg-paper-warm)] text-xs font-semibold text-[var(--ink-muted)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingQuery}
                className="px-4 py-2 rounded-xl bg-[var(--brand-electric)] hover:bg-[var(--brand-hover)] text-xs font-semibold text-white transition flex items-center gap-1.5"
              >
                {isSubmittingQuery ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Send to Faculty</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. SUPPORT TICKET MODAL */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitSupportTicket}
            className="w-full max-w-md bg-[var(--bg-paper)] border border-[var(--border-paper)] rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-bold text-base text-[var(--ink-primary)]">
                Submit Support Ticket
              </h3>
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="p-1 rounded-lg text-[var(--ink-muted)] hover:bg-[var(--bg-paper-warm)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Category
              </label>
              <select
                value={supportCategory}
                onChange={(e) => setSupportCategory(e.target.value as any)}
                className="w-full bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] rounded-xl px-3 py-2 text-xs text-[var(--ink-primary)] outline-none"
              >
                <option value="PROFILE_CORRECTION">Profile Correction</option>
                <option value="ATTENDANCE_MISMATCH">Attendance Mismatch</option>
                <option value="PAYMENT_ISSUE">Payment / Fee Issue</option>
                <option value="ACADEMIC_HELP">Academic Assistance</option>
                <option value="TECHNICAL_SUPPORT">Technical Issue</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Subject *
              </label>
              <input
                type="text"
                required
                value={supportSubject}
                onChange={(e) => setSupportSubject(e.target.value)}
                placeholder="Summary of issue..."
                className="w-full bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] rounded-xl px-3 py-2 text-xs text-[var(--ink-primary)] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1">
                Description *
              </label>
              <textarea
                rows={3}
                required
                value={supportDescription}
                onChange={(e) => setSupportDescription(e.target.value)}
                placeholder="Details of your request..."
                className="w-full bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] rounded-xl p-3 text-xs text-[var(--ink-primary)] outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="px-4 py-2 rounded-xl bg-[var(--bg-paper-warm)] text-xs font-semibold text-[var(--ink-muted)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingSupport}
                className="px-4 py-2 rounded-xl bg-[var(--brand-electric)] hover:bg-[var(--brand-hover)] text-xs font-semibold text-white transition flex items-center gap-1.5"
              >
                {isSubmittingSupport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Submit Ticket</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/** Shared motion + toast context (reduced-motion aware). */
export default function StudentPortalRoot() {
  return (
    <MotionProvider>
      <ToastProvider>
        <StudentPortal />
      </ToastProvider>
    </MotionProvider>
  );
}
