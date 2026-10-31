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
    status: 'PAID' | 'PARTIAL' | 'OVERDUE';
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

  // Load all student data
  const loadAllStudentData = async () => {
    setIsLoading(true);
    try {
      const [
        dash,
        resList,
        notifList,
        matList,
        att,
        fee,
        ann,
        dList,
        tt,
        asgList,
        tstList,
        qList,
        tasks,
        docs,
        prof,
      ] = await Promise.all([
        studentApi.getDashboard(),
        studentApi.getPublishedResults(),
        studentApi.getNotifications(),
        studentApi.getStudyMaterials(),
        studentApi.getAttendance(),
        studentApi.getFees(),
        studentApi.getAnnouncements(),
        studentApi.getTeachingDiaries(),
        studentApi.getTimetable(),
        studentApi.getAssignments(),
        studentApi.getTests(),
        studentApi.getAcademicQueries(),
        studentApi.getStudyTasks(),
        studentApi.getDocuments(),
        studentApi.getProfile(),
      ]);

      setDashboardData(dash);
      setResults(resList);
      setNotifications(notifList);
      setMaterials(matList);
      setAttendanceData(att);
      setFeesData(fee);
      setAnnouncements(ann);
      setDiaries(dList);
      setTimetable(tt);
      setAssignments(asgList);
      setTests(tstList);
      setQueries(qList);
      setStudyTasks(tasks);
      setDocuments(docs);
      setProfileData(prof);
    } catch (err) {
      console.error('Failed to load student data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const session = studentApi.getStudentSession();
    if (session) {
      setStudent(session);
      loadAllStudentData();
    } else {
      setIsLoading(false);
    }
  }, []);

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

  const handleDemoStudentLogin = async () => {
    setLoginLoading(true);
    setAuthError('');
    try {
      const res = await studentApi.loginDemoStudent();
      setStudent(res.user);
      await loadAllStudentData();
    } catch (err: any) {
      setAuthError(err.message || 'Demo student access failed.');
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
      setInviteStatusMsg(res.message);
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
      <main className="min-h-screen bg-[#050608] text-[#F5F7FA] flex items-center justify-center p-4 sm:p-6 font-sans">
        <div className="w-full max-w-md bg-[#0A0D12] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle Glow Header */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1677FF] via-[#6366F1] to-[#10B981]" />

          {/* Institute Branding Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#10151D] border border-[rgba(255,255,255,0.1)] text-[#1677FF] mb-3 shadow-inner">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#F5F7FA]">
              PadhaiPilot
            </h1>
            <p className="font-sans text-xs text-[#929BAA] mt-1">
              Student Academic Portal & Verified Results Vault
            </p>
          </div>

          {/* Quick Demo Access Button */}
          <div className="mb-6 p-3 rounded-xl bg-[#10151D] border border-[rgba(255,255,255,0.06)] flex items-center justify-between">
            <div>
              <div className="font-sans text-xs font-semibold text-[#F5F7FA]">
                Instant Demo Access
              </div>
              <div className="text-[11px] text-[#929BAA]">
                Aarav Patel (JEE Advanced Alpha)
              </div>
            </div>
            <button
              onClick={handleDemoStudentLogin}
              disabled={loginLoading}
              className="px-3 py-1.5 rounded-lg bg-[#1677FF] hover:bg-[#3395FF] text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-sm"
            >
              {loginLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Enter Demo</span>
            </button>
          </div>

          {/* Auth Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-[#10151D] rounded-xl border border-[rgba(255,255,255,0.06)] mb-5">
            <button
              onClick={() => {
                setAuthMode('SIGN_IN');
                setAuthError('');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition ${
                authMode === 'SIGN_IN'
                  ? 'bg-[#1677FF] text-white shadow'
                  : 'text-[#929BAA] hover:text-[#F5F7FA]'
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
                  ? 'bg-[#1677FF] text-white shadow'
                  : 'text-[#929BAA] hover:text-[#F5F7FA]'
              }`}
            >
              New Registration
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-[rgba(244,63,94,0.12)] border border-[rgba(244,63,94,0.3)] text-xs text-[#F43F5E] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccessMsg && (
            <div className="mb-4 p-3 rounded-xl bg-[rgba(16,185,129,0.12)] border border-[rgba(16,185,129,0.3)] text-xs text-[#10B981] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{authSuccessMsg}</span>
            </div>
          )}

          {authMode === 'SIGN_IN' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#C3CAD6] mb-1.5">
                  Student Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#929BAA]" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="student@padhaipilot.com"
                    className="w-full bg-[#10151D] border border-[rgba(255,255,255,0.08)] focus:border-[#1677FF] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#F5F7FA] outline-none transition placeholder:text-[#55595F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#C3CAD6] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#929BAA]" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#10151D] border border-[rgba(255,255,255,0.08)] focus:border-[#1677FF] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#F5F7FA] outline-none transition placeholder:text-[#55595F]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 rounded-xl bg-[#1677FF] hover:bg-[#3395FF] text-xs font-semibold text-white transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>Access Student Portal</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#C3CAD6] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Aarav Patel"
                  className="w-full bg-[#10151D] border border-[rgba(255,255,255,0.08)] focus:border-[#1677FF] rounded-xl px-3.5 py-2 text-xs text-[#F5F7FA] outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#C3CAD6] mb-1">
                  Student Email *
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="aarav@example.com"
                  className="w-full bg-[#10151D] border border-[rgba(255,255,255,0.08)] focus:border-[#1677FF] rounded-xl px-3.5 py-2 text-xs text-[#F5F7FA] outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-[#C3CAD6] mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full bg-[#10151D] border border-[rgba(255,255,255,0.08)] focus:border-[#1677FF] rounded-xl px-3.5 py-2 text-xs text-[#F5F7FA] outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#C3CAD6] mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91..."
                    className="w-full bg-[#10151D] border border-[rgba(255,255,255,0.08)] focus:border-[#1677FF] rounded-xl px-3.5 py-2 text-xs text-[#F5F7FA] outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#C3CAD6] mb-1">
                  Invitation Code (Optional for Instant Batch Enrollment)
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#929BAA]" />
                  <input
                    type="text"
                    value={regInviteCode}
                    onChange={(e) => setRegInviteCode(e.target.value)}
                    placeholder="e.g. APEX-INV-2026"
                    className="w-full bg-[#10151D] border border-[rgba(255,255,255,0.08)] focus:border-[#1677FF] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#F5F7FA] outline-none transition"
                  />
                </div>
                <p className="text-[10px] text-[#929BAA] mt-1">
                  If your teacher provided an admission code, enter it to link your batch automatically.
                </p>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-xs font-semibold text-white transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 mt-2"
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
    <div className="min-h-screen bg-[#050608] text-[#F5F7FA] flex flex-col font-sans">
      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 bg-[#0A0D12]/90 backdrop-blur-md border-b border-[rgba(255,255,255,0.08)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#10151D] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-[#1677FF] shadow-inner">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base tracking-tight text-[#F5F7FA]">
                  {student.instituteName || 'Institute'}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[rgba(22,119,255,0.12)] text-[#1677FF] border border-[rgba(22,119,255,0.25)]">
                  Student Vault
                </span>
              </div>
              <div className="text-[11px] text-[#929BAA] font-sans">
                {profileData?.batchName || 'Enrolled Batch'}{profileData?.rollNumber ? ` • Roll: ${profileData.rollNumber}` : ''}
              </div>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2.5">
            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 rounded-xl bg-[#10151D] border border-[rgba(255,255,255,0.08)] hover:bg-[#141A24] text-[#C3CAD6] hover:text-[#F5F7FA] transition"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#F43F5E] text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Student Pill & Sign Out */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#10151D] border border-[rgba(255,255,255,0.08)]">
              <div className="w-6 h-6 rounded-full bg-[#1677FF]/20 text-[#1677FF] font-semibold text-xs flex items-center justify-center font-display">
                {student.fullName.charAt(0)}
              </div>
              <span className="text-xs font-semibold text-[#F5F7FA] max-w-[120px] truncate">
                {student.fullName}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-[#10151D] border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(244,63,94,0.15)] text-[#929BAA] hover:text-[#F43F5E] transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* HORIZONTAL TAB NAVIGATION BAR */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 overflow-x-auto no-scrollbar flex items-center gap-1 border-t border-[rgba(255,255,255,0.04)] py-1.5">
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
                    ? 'bg-[#1677FF] text-white shadow-sm'
                    : 'text-[#929BAA] hover:text-[#F5F7FA] hover:bg-[#10151D]'
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
            <Loader2 className="w-8 h-8 text-[#1677FF] animate-spin mx-auto" />
            <div className="text-xs text-[#929BAA] font-medium">
              Synchronizing verified student academic ledger...
            </div>
          </div>
        ) : (
          <>
            {/* 1. OVERVIEW / DASHBOARD TAB */}
            {activeTab === 'OVERVIEW' && (
              <div className="space-y-6">
                {/* Greeting & Welcome Banner */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0A0D12] via-[#10151D] to-[#0A0D12] border border-[rgba(255,255,255,0.08)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
                  <div>
                    <span className="text-[11px] font-semibold text-[#1677FF] tracking-wider uppercase font-data">
                      Verified Academic Dashboard
                    </span>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F7FA] mt-1">
                      Welcome back, {student.fullName}
                    </h2>
                    <p className="font-sans text-xs text-[#929BAA] mt-1">
                      Enrolled in {profileData?.batchName || student.instituteName || 'All Batches'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('DIARY')}
                      className="px-3.5 py-2 rounded-xl bg-[#1677FF] hover:bg-[#3395FF] text-xs font-semibold text-white transition flex items-center gap-1.5 shadow"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Today's Diary</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('MATERIALS')}
                      className="px-3.5 py-2 rounded-xl bg-[#10151D] border border-[rgba(255,255,255,0.1)] hover:bg-[#141A24] text-xs font-semibold text-[#F5F7FA] transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Notes</span>
                    </button>
                  </div>
                </div>

                {/* KPI METRICS STRIP */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                  <div className="p-4 rounded-xl bg-[#0A0D12] border border-[rgba(255,255,255,0.08)]">
                    <div className="flex items-center justify-between text-[#929BAA] text-xs mb-1">
                      <span>Attendance Rate</span>
                      <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    </div>
                    <div className="font-data text-2xl font-bold text-[#10B981]">
                      {attendanceData.percentage}%
                    </div>
                    <div className="text-[10px] text-[#929BAA] mt-1">
                      {attendanceData.attended} of {attendanceData.totalClasses} sessions present
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0A0D12] border border-[rgba(255,255,255,0.08)]">
                    <div className="flex items-center justify-between text-[#929BAA] text-xs mb-1">
                      <span>Average Score</span>
                      <TrendingUp className="w-4 h-4 text-[#1677FF]" />
                    </div>
                    <div className="font-data text-2xl font-bold text-[#F5F7FA]">
                      {avgScorePercentage !== null ? `${avgScorePercentage}%` : '—'}
                    </div>
                    <div className="text-[10px] text-[#929BAA] mt-1">
                      Across {results.length} published exams
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0A0D12] border border-[rgba(255,255,255,0.08)]">
                    <div className="flex items-center justify-between text-[#929BAA] text-xs mb-1">
                      <span>Pending Homework</span>
                      <Clock className="w-4 h-4 text-[#F59E0B]" />
                    </div>
                    <div className="font-data text-2xl font-bold text-[#F59E0B]">
                      {assignments.filter((a) => a.status === 'PENDING').length}
                    </div>
                    <div className="text-[10px] text-[#929BAA] mt-1">
                      Due this week
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0A0D12] border border-[rgba(255,255,255,0.08)]">
                    <div className="flex items-center justify-between text-[#929BAA] text-xs mb-1">
                      <span>Fee Balance</span>
                      <CreditCard className="w-4 h-4 text-[#C3CAD6]" />
                    </div>
                    <div className="font-data text-2xl font-bold text-[#F5F7FA]">
                      ₹{feesData.balanceDue.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[#929BAA] mt-1">
                      {feesData.status === 'PAID' ? 'All dues cleared' : feesData.balanceDue > 0 ? 'Outstanding balance due' : 'No dues'}
                    </div>
                  </div>
                </div>

                {/* TODAY'S TIMETABLE & IMPORTANT ANNOUNCEMENTS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Today's Timetable */}
                  <div className="lg:col-span-2 p-5 rounded-2xl bg-[#0A0D12] border border-[rgba(255,255,255,0.08)]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#1677FF]" />
                        <h3 className="font-sans font-bold text-sm text-[#F5F7FA]">
                          Today's Academic Schedule
                        </h3>
                      </div>
                      <button
                        onClick={() => setActiveTab('TIMETABLE')}
                        className="text-xs text-[#1677FF] hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>Full Week</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {(dashboardData?.timetable || [
                        { time: '09:00 AM - 10:30 AM', subject: 'Mathematics (Calculus)', room: 'Lecture Hall 2', faculty: 'Prof. Rajesh Sharma' },
                        { time: '11:00 AM - 12:30 PM', subject: 'Physics (Optics)', room: 'Physics Lab A', faculty: 'Dr. Alok Verma' },
                        { time: '02:00 PM - 03:30 PM', subject: 'Daily Problem Practice (DPP)', room: 'Study Wing 3', faculty: 'Faculty Assistant' },
                      ]).map((slot: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-[#10151D] border border-[rgba(255,255,255,0.05)] flex items-center justify-between gap-3 hover:border-[rgba(255,255,255,0.1)] transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-8 rounded-full bg-[#1677FF]" />
                            <div>
                              <div className="text-xs font-bold text-[#F5F7FA]">
                                {slot.subject}
                              </div>
                              <div className="text-[11px] text-[#929BAA]">
                                {slot.faculty} • Room {slot.room}
                              </div>
                            </div>
                          </div>
                          <div className="font-data text-xs font-semibold text-[#1677FF] bg-[rgba(22,119,255,0.1)] px-2.5 py-1 rounded-lg">
                            {slot.time}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Announcements Widget */}
                  <div className="p-5 rounded-2xl bg-[#0A0D12] border border-[rgba(255,255,255,0.08)] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                        <h3 className="font-sans font-bold text-sm text-[#F5F7FA]">
                          Faculty Notices
                        </h3>
                      </div>

                      <div className="space-y-3">
                        {announcements.slice(0, 2).map((ann) => (
                          <div
                            key={ann.id}
                            className="p-3 rounded-xl bg-[#10151D] border border-[rgba(255,255,255,0.05)] space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  ann.priority === 'URGENT'
                                    ? 'bg-[rgba(244,63,94,0.15)] text-[#F43F5E]'
                                    : 'bg-[rgba(22,119,255,0.15)] text-[#1677FF]'
                                }`}
                              >
                                {ann.priority}
                              </span>
                              <span className="font-data text-[10px] text-[#929BAA]">
                                {ann.date}
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-[#F5F7FA]">
                              {ann.title}
                            </div>
                            <p className="text-[11px] text-[#929BAA] line-clamp-2">
                              {ann.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('QUERIES')}
                      className="w-full mt-4 py-2 rounded-xl bg-[#10151D] hover:bg-[#141A24] border border-[rgba(255,255,255,0.08)] text-xs font-semibold text-[#C3CAD6] hover:text-[#F5F7FA] transition flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Ask Academic Question</span>
                    </button>
                  </div>
                </div>

                {/* RECENT TEACHING DIARY & RECENT NOTES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Latest Diary */}
                  <div className="p-5 rounded-2xl bg-[#0A0D12] border border-[rgba(255,255,255,0.08)]">
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#10B981]" />
                        <h3 className="font-sans font-bold text-sm text-[#F5F7FA]">
                          Latest Classroom Diary
                        </h3>
                      </div>
                      <button
                        onClick={() => setActiveTab('DIARY')}
                        className="text-xs text-[#10B981] hover:underline font-semibold"
                      >
                        View All
                      </button>
                    </div>

                    {diaries[0] ? (
                      <div className="p-4 rounded-xl bg-[#10151D] border border-[rgba(255,255,255,0.05)] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider">
                            {diaries[0].subject} • {diaries[0].lessonDate}
                          </span>
                          <span className="text-[10px] text-[#929BAA]">
                            {diaries[0].facultyName}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-[#F5F7FA]">
                          {diaries[0].chapterTitle}
                        </div>
                        <p className="text-[11px] text-[#929BAA] line-clamp-3 leading-relaxed">
                          {diaries[0].conceptsTaught}
                        </p>
                        {diaries[0].homeworkAssigned && (
                          <div className="pt-2 border-t border-[rgba(255,255,255,0.06)] text-[11px] text-[#F59E0B] flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">HW: {diaries[0].homeworkAssigned}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-[#929BAA] py-6 text-center">
                        No diary entries published yet.
                      </div>
                    )}
                  </div>

                  {/* Recent Study Materials */}
                  <div className="p-5 rounded-2xl bg-[#0A0D12] border border-[rgba(255,255,255,0.08)]">
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#1677FF]" />
                        <h3 className="font-sans font-bold text-sm text-[#F5F7FA]">
                          Recent Notes & Worksheets
                        </h3>
                      </div>
                      <button
                        onClick={() => setActiveTab('MATERIALS')}
                        className="text-xs text-[#1677FF] hover:underline font-semibold"
                      >
                        Vault
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {materials.slice(0, 3).map((mat) => (
                        <div
                          key={mat.id}
                          className="p-3 rounded-xl bg-[#10151D] border border-[rgba(255,255,255,0.05)] flex items-center justify-between gap-3 hover:border-[rgba(255,255,255,0.1)] transition"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <FileText className="w-4 h-4 text-[#1677FF] shrink-0" />
                            <div className="overflow-hidden">
                              <div className="text-xs font-bold text-[#F5F7FA] truncate">
                                {mat.title}
                              </div>
                              <div className="text-[10px] text-[#929BAA]">
                                {mat.subject} • {mat.fileSize || 'PDF'}
                              </div>
                            </div>
                          </div>

                          {mat.fileUrl && (
                            <a
                              href={mat.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-[#1677FF]/10 text-[#1677FF] hover:bg-[#1677FF] hover:text-white transition text-xs font-semibold shrink-0"
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
                    <h2 className="font-display text-2xl font-bold text-[#F5F7FA]">
                      Daily Teaching Diary
                    </h2>
                    <p className="font-sans text-xs text-[#929BAA] mt-1">
                      Direct faculty lesson records, topics taught, and assigned homework for your batch.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#929BAA]" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search chapter, topics..."
                        className="bg-[#0A0D12] border border-[rgba(255,255,255,0.08)] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#F5F7FA] outline-none focus:border-[#1677FF] w-48 sm:w-64"
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
                          ? 'bg-[#10B981] text-white shadow'
                          : 'bg-[#0A0D12] border border-[rgba(255,255,255,0.08)] text-[#929BAA] hover:text-[#F5F7FA]'
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
                        className="p-5 rounded-2xl bg-[#0A0D12] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] transition shadow-lg space-y-3.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[rgba(255,255,255,0.06)] pb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[rgba(16,185,129,0.15)] text-[#10B981]">
                              {diary.subject}
                            </span>
                            <span className="font-data text-xs font-semibold text-[#F5F7FA]">
                              {diary.lessonDate} {diary.sessionTime ? ` (${diary.sessionTime})` : ''}
                            </span>
                          </div>
                          <div className="text-xs text-[#929BAA]">
                            Faculty: <span className="font-semibold text-[#F5F7FA]">{diary.facultyName}</span>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-sans font-bold text-base text-[#F5F7FA]">
                            {diary.chapterTitle}
                          </h3>
                          <div className="mt-2 text-xs text-[#C3CAD6] leading-relaxed whitespace-pre-line bg-[#10151D] p-3.5 rounded-xl border border-[rgba(255,255,255,0.04)]">
                            <span className="font-bold text-[#F5F7FA] block mb-1">Concepts Covered:</span>
                            {diary.conceptsTaught}
                          </div>
                        </div>

                        {diary.learningObjectives && (
                          <div className="text-xs text-[#929BAA]">
                            <span className="font-semibold text-[#C3CAD6]">Objectives: </span>
                            {diary.learningObjectives}
                          </div>
                        )}

                        {diary.homeworkAssigned && (
                          <div className="p-3 rounded-xl bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] text-xs text-[#F59E0B] flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 shrink-0" />
                              <span><strong className="text-amber-300">Homework:</strong> {diary.homeworkAssigned}</span>
                            </div>
                            <button
                              onClick={() => setActiveTab('ASSIGNMENTS')}
                              className="px-2.5 py-1 rounded bg-[#F59E0B] text-black font-semibold text-[11px] shrink-0 hover:bg-amber-400 transition"
                            >
                              Submit
                            </button>
                          </div>
                        )}

                        {diary.attachmentUrl && (
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] text-[#929BAA] flex items-center gap-1.5">
                              <FileCheck className="w-3.5 h-3.5 text-[#10B981]" />
                              <span>Faculty Attached Lesson Notes</span>
                            </span>
                            <a
                              href={diary.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-[#10151D] hover:bg-[#1677FF] text-[#1677FF] hover:text-white border border-[rgba(255,255,255,0.08)] text-xs font-semibold transition flex items-center gap-1.5"
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
                    <h2 className="font-display text-2xl font-bold text-[#F5F7FA]">
                      Study Materials & Notes Vault
                    </h2>
                    <p className="font-sans text-xs text-[#929BAA] mt-1">
                      Direct high-speed delivery from verified Media CDN (media.dhyey.cc). Zero database bloat.
                    </p>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#929BAA]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search notes, formulas..."
                      className="bg-[#0A0D12] border border-[rgba(255,255,255,0.08)] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#F5F7FA] outline-none focus:border-[#1677FF] w-48 sm:w-64"
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
                          ? 'bg-[#1677FF] text-white shadow'
                          : 'bg-[#0A0D12] border border-[rgba(255,255,255,0.08)] text-[#929BAA] hover:text-[#F5F7FA]'
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
                      className="p-5 rounded-2xl bg-[#0A0D12] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] transition shadow-lg flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-[#929BAA] mb-2">
                          <span className="px-2 py-0.5 rounded bg-[#10151D] text-[#1677FF] font-semibold border border-[rgba(255,255,255,0.05)]">
                            {mat.category.replace(/_/g, ' ')}
                          </span>
                          <span className="font-data">{mat.fileSize || 'PDF'}</span>
                        </div>

                        <h3 className="font-sans font-bold text-sm text-[#F5F7FA] line-clamp-2">
                          {mat.title}
                        </h3>

                        <div className="text-[11px] text-[#929BAA] mt-1">
                          {mat.chapter ? `${mat.chapter} • ` : ''}{mat.subject}
                        </div>

                        {mat.content && (
                          <p className="text-[11px] text-[#C3CAD6] line-clamp-2 mt-2 leading-relaxed">
                            {mat.content}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between gap-2">
                        <span className="text-[10px] text-[#929BAA]">
                          By {mat.facultyName || 'Faculty'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {mat.fileUrl && (
                            <button
                              onClick={() => handleCopy(mat.fileUrl!, mat.id)}
                              className="p-1.5 rounded-lg bg-[#10151D] hover:bg-[#141A24] text-[#929BAA] hover:text-white transition"
                              title="Copy CDN Link"
                            >
                              {copiedId === mat.id ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          {mat.fileUrl && (
                            <a
                              href={mat.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-[#1677FF] hover:bg-[#3395FF] text-white text-xs font-semibold transition flex items-center gap-1 shadow"
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
                  <h2 className="font-display text-2xl font-bold text-[#F5F7FA]">
                    Weekly Academic Timetable
                  </h2>
                  <p className="font-sans text-xs text-[#929BAA] mt-1">
                    Scheduled lecture sessions, doubt clinics, and weekly assessments.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {timetable.map((dayPlan, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-[#0A0D12] border border-[rgba(255,255,255,0.08)] space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.06)]">
                        <h3 className="font-sans font-bold text-sm text-[#F5F7FA]">
                          {dayPlan.day}
                        </h3>
                        <span className="text-[10px] text-[#1677FF] font-semibold bg-[rgba(22,119,255,0.1)] px-2 py-0.5 rounded">
                          {dayPlan.slots.length} Classes
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {dayPlan.slots.map((slot, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-3 rounded-xl bg-[#10151D] border border-[rgba(255,255,255,0.05)] space-y-1"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-[#F5F7FA]">{slot.subject}</span>
                              <span className="font-data text-[11px] text-[#1677FF] font-semibold">
                                {slot.time}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#929BAA]">
                              Topic: {slot.topic}
                            </div>
                            <div className="text-[10px] text-[#55595F] flex items-center justify-between pt-1">
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
                    <h2 className="font-display text-2xl font-bold text-[#F5F7FA]">
                      Attendance Ledger & Eligibility
                    </h2>
                    <p className="font-sans text-xs text-[#929BAA] mt-1">
                      Verified roll-call attendance recorded by faculty. Submit correction requests if needed.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowAttendanceModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-[#1677FF] hover:bg-[#3395FF] text-xs font-semibold text-white transition flex items-center gap-1.5 shadow"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Request Correction</span>
                  </button>
                </div>

                {/* Monthly Attendance Rate Chart */}
                <StudentAttendanceTrendCard records={attendanceData.records} />

                {/* Progress Banner */}
                <div className="p-6 rounded-2xl bg-[#0A0D12] border border-[rgba(255,255,255,0.08)] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                  <div className="space-y-2 text-center md:text-left">
                    <div className="text-xs text-[#929BAA] uppercase tracking-wider font-semibold">
                      Current Standing
                    </div>
                    <div className="flex items-baseline gap-3 justify-center md:justify-start">
                      <span className="font-data text-4xl font-extrabold text-[#10B981]">
                        {attendanceData.percentage}%
                      </span>
                      <span className="text-xs text-[#10B981] font-semibold px-2 py-0.5 rounded bg-[rgba(16,185,129,0.12)]">
                        Eligible for Mock Tests (Min 75% required)
                      </span>
                    </div>
                    <p className="text-xs text-[#929BAA]">
                      You have attended {attendanceData.attended} out of {attendanceData.totalClasses} scheduled sessions.
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-center p-3 rounded-xl bg-[#10151D] border border-[rgba(255,255,255,0.05)] min-w-[70px]">
                      <div className="font-data text-lg font-bold text-[#10B981]">{attendanceData.attended}</div>
                      <div className="text-[10px] text-[#929BAA]">Present</div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-[#10151D] border border-[rgba(255,255,255,0.05)] min-w-[70px]">
                      <div className="font-data text-lg font-bold text-[#F43F5E]">{attendanceData.absent}</div>
                      <div className="text-[10px] text-[#929BAA]">Absent</div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-[#10151D] border border-[rgba(255,255,255,0.05)] min-w-[70px]">
                      <div className="font-data text-lg font-bold text-[#F59E0B]">{attendanceData.late}</div>
                      <div className="text-[10px] text-[#929BAA]">Late</div>
                    </div>
                  </div>
                </div>

                {/* Session Records Table */}
                <div className="rounded-2xl bg-[#0A0D12] border border-[rgba(255,255,255,0.08)] overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-[rgba(255,255,255,0.06)] font-bold text-xs text-[#F5F7FA]">
                    Recent Session Attendance History
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[rgba(255,255,255,0.06)] bg-[#10151D]/50 text-[11px] text-[#929BAA]">
                          <th className="p-3.5 font-semibold">Date</th>
                          <th className="p-3.5 font-semibold">Subject / Session</th>
                          <th className="p-3.5 font-semibold">Status</th>
                          <th className="p-3.5 font-semibold">Faculty Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-xs">
                        {attendanceData.records.map((rec) => (
                          <tr key={rec.id} className="hover:bg-[#10151D]/40 transition">
                            <td className="p-3.5 font-data text-[#F5F7FA]">{rec.date}</td>
                            <td className="p-3.5 text-[#C3CAD6]">{rec.subjectName || 'Class Session'}</td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  rec.status === 'PRESENT'
                                    ? 'bg-[rgba(16,185,129,0.15)] text-[#10B981]'
                                    : rec.status === 'LATE'
                                    ? 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B]'
                                    : 'bg-[rgba(244,63,94,0.15)] text-[#F43F5E]'
                                }`}
                              >
                                {rec.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-[#929BAA] text-[11px]">{rec.remarks || '—'}</td>
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
                  <h2 className="font-display text-2xl font-bold text-[#F5F7FA]">
                    Homework & Assignment Tracker
                  </h2>
                  <p className="font-sans text-xs text-[#929BAA] mt-1">
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
                      className="p-5 rounded-2xl bg-[#0A0D12] border border-[rgba(255,255,255,0.08)] flex flex-col justify-between space-y-4 shadow-lg"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#10151D] text-[#1677FF] border border-[rgba(255,255,255,0.06)]">
                            {asg.subject}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              asg.status === 'GRADED'
                                ? 'bg-[rgba(16,185,129,0.15)] text-[#10B981]'
                                : asg.status === 'SUBMITTED'
                                ? 'bg-[rgba(22,119,255,0.15)] text-[#1677FF]'
                                : 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B]'
                            }`}
                          >
                            {asg.status}
                          </span>
                        </div>

                        <h3 className="font-sans font-bold text-sm text-[#F5F7FA]">
                          {asg.title}
                        </h3>

                        <p className="text-xs text-[#929BAA] leading-relaxed line-clamp-3">
                          {asg.instructions}
                        </p>

                        <div className="text-[11px] text-[#C3CAD6] pt-1">
                          Max Marks: <strong className="font-data">{asg.maxMarks}</strong>
                        </div>
                      </div>

                      {asg.submission?.marksObtained !== undefined && (
                        <div className="p-3 rounded-xl bg-[#10151D] border border-[rgba(255,255,255,0.05)] text-xs space-y-1">
                          <div className="flex items-center justify-between text-[#10B981] font-bold">
                            <span>Score Released:</span>
                            <span className="font-data">{asg.submission.marksObtained} / {asg.maxMarks}</span>
                          </div>
                          {asg.submission.feedback && (
                            <div className="text-[11px] text-[#929BAA]">
                              Feedback: {asg.submission.feedback}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="pt-2 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                        <span className="text-[10px] text-[#929BAA]">
                          Due: {new Date(asg.dueDate).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedAssignment(asg);
                            setAssignmentAnswer(asg.submission?.content || '');
                            setAssignmentFileUrl(asg.submission?.attachmentUrl || '');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#1677FF] hover:bg-[#3395FF] text-white text-xs font-semibold transition"
                        >
                          {asg.status === 'GRADED' ? 'View Work' : asg.status === 'SUBMITTED' ? 'Edit Work' : 'Submit'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. TESTS & QUIZZES TAB */}
            {activeTab === 'TESTS' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[#F5F7FA]">
                    Online Tests & Examination Center
                  </h2>
                  <p className="font-sans text-xs text-[#929BAA] mt-1">
                    Computer-based tests (CBT) with server-side time tracking, negative marking, and instant scoring.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {tests.map((test) => (
                    <div
                      key={test.id}
                      className="p-5 rounded-2xl bg-[#0A0D12] border border-[rgba(255,255,255,0.08)] flex flex-col justify-between space-y-4 shadow-lg"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#10151D] text-[#1677FF]">
                            {test.subject}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              test.status === 'ACTIVE'
                                ? 'bg-[rgba(16,185,129,0.15)] text-[#10B981]'
                                : test.status === 'COMPLETED'
                                ? 'bg-[rgba(22,119,255,0.15)] text-[#1677FF]'
                                : 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B]'
                            }`}
                          >
                            {test.status}
                          </span>
                        </div>

                        <h3 className="font-sans font-bold text-sm text-[#F5F7FA]">
                          {test.title}
                        </h3>

                        <p className="text-xs text-[#929BAA] line-clamp-2">
                          {test.instructions}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-[#C3CAD6] pt-1">
                          <span>Duration: <strong className="font-data">{test.durationMinutes}m</strong></span>
                          <span>•</span>
                          <span>Max: <strong className="font-data">{test.totalMarks}M</strong></span>
                        </div>
                      </div>

                      {test.attempt && (
                        <div className="p-3 rounded-xl bg-[#10151D] border border-[rgba(255,255,255,0.05)] text-xs text-[#10B981] font-bold flex items-center justify-between">
                          <span>Attempt Scored:</span>
                          <span className="font-data">{test.attempt.score} / {test.totalMarks}</span>
                        </div>
                      )}

                      <button
                        onClick={() => handleStartTest(test.id)}
                        disabled={test.status === 'COMPLETED'}
                        className="w-full py-2.5 rounded-xl bg-[#1677FF] hover:bg-[#3395FF] disabled:bg-[#10151D] disabled:text-[#55595F] text-xs font-semibold text-white transition flex items-center justify-center gap-1.5 shadow"
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
                    <h2 className="font-display text-2xl font-bold text-[#F5F7FA]">
                      Verified Classroom Assessment Results
                    </h2>
                    <p className="font-sans text-xs text-[#929BAA] mt-1">
                      Scores published by faculty via bulk assessment entry. Download official report cards.
                    </p>
                  </div>

                  <a
                    href="https://media-hosting.dhyeyp254.workers.dev/1793335828256.json"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-[#1677FF] hover:bg-[#3395FF] text-xs font-semibold text-white transition flex items-center gap-1.5 shadow"
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

                <div className="rounded-2xl bg-[#0A0D12] border border-[rgba(255,255,255,0.08)] overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[rgba(255,255,255,0.06)] bg-[#10151D]/50 text-[11px] text-[#929BAA]">
                          <th className="p-3.5 font-semibold">Assessment Title</th>
                          <th className="p-3.5 font-semibold">Subject</th>
                          <th className="p-3.5 font-semibold">Max</th>
                          <th className="p-3.5 font-semibold">Obtained</th>
                          <th className="p-3.5 font-semibold">Percentage</th>
                          <th className="p-3.5 font-semibold">Grade</th>
                          <th className="p-3.5 font-semibold">Faculty Feedback</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-xs">
                        {filteredResults.map((res) => (
                          <tr key={res.assessmentId} className="hover:bg-[#10151D]/40 transition">
                            <td className="p-3.5 font-bold text-[#F5F7FA]">{res.title}</td>
                            <td className="p-3.5 text-[#C3CAD6]">{res.subject}</td>
                            <td className="p-3.5 font-data text-[#929BAA]">{res.maxMarks}</td>
                            <td className="p-3.5 font-data font-bold text-[#10B981]">{res.obtainedMarks ?? '—'}</td>
                            <td className="p-3.5 font-data font-bold text-[#1677FF]">
                              {res.percentage !== null ? `${res.percentage}%` : '—'}
                            </td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[rgba(16,185,129,0.15)] text-[#10B981]">
                                {res.grade || '—'}
                              </span>
                            </td>
                            <td className="p-3.5 text-[11px] text-[#929BAA]">{res.feedback || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 9. FEES & DUES TAB */}
            {activeTab === 'FEES' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[#F5F7FA]">
                    Fee Structure & Verified Receipts
                  </h2>
                  <p className="font-sans text-xs text-[#929BAA] mt-1">
                    Tuition installments, verified payment receipts, and automated payment reminders.
                  </p>
                </div>

                {/* Balance Summary Card */}
                <div className="p-6 rounded-2xl bg-[#0A0D12] border border-[rgba(255,255,255,0.08)] grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xl">
                  <div>
                    <div className="text-xs text-[#929BAA] uppercase font-semibold">Total Fee Payable</div>
                    <div className="font-data text-3xl font-extrabold text-[#F5F7FA] mt-1">
                      ₹{feesData.totalFees.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[#929BAA] mt-1">Academic Year 2026-2027</div>
                  </div>

                  <div>
                    <div className="text-xs text-[#929BAA] uppercase font-semibold">Amount Paid</div>
                    <div className="font-data text-3xl font-extrabold text-[#10B981] mt-1">
                      ₹{feesData.paidAmount.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[#10B981] font-semibold mt-1">Verified against receipts</div>
                  </div>

                  <div>
                    <div className="text-xs text-[#929BAA] uppercase font-semibold">Outstanding Balance</div>
                    <div className="font-data text-3xl font-extrabold text-[#F59E0B] mt-1">
                      ₹{feesData.balanceDue.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[#F59E0B] font-semibold mt-1">{feesData.balanceDue > 0 ? 'Pending payment' : 'Cleared'}</div>
                  </div>
                </div>

                {/* Fee Breakdown Donut */}
                <StudentFeeBreakdownCard fee={feesData} />

                {/* Receipts Table */}
                <div className="rounded-2xl bg-[#0A0D12] border border-[rgba(255,255,255,0.08)] overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-[rgba(255,255,255,0.06)] font-bold text-xs text-[#F5F7FA]">
                    Official Fee Receipts & Installments
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[rgba(255,255,255,0.06)] bg-[#10151D]/50 text-[11px] text-[#929BAA]">
                          <th className="p-3.5 font-semibold">Receipt / Invoice #</th>
                          <th className="p-3.5 font-semibold">Description</th>
                          <th className="p-3.5 font-semibold">Due Date</th>
                          <th className="p-3.5 font-semibold">Amount</th>
                          <th className="p-3.5 font-semibold">Status</th>
                          <th className="p-3.5 font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-xs">
                        {feesData.receipts.map((rec) => (
                          <tr key={rec.id} className="hover:bg-[#10151D]/40 transition">
                            <td className="p-3.5 font-data text-[#1677FF] font-semibold">{rec.receiptNumber || rec.id}</td>
                            <td className="p-3.5 text-[#F5F7FA] font-medium">{rec.title}</td>
                            <td className="p-3.5 font-data text-[#929BAA]">{rec.dueDate}</td>
                            <td className="p-3.5 font-data font-bold text-[#F5F7FA]">₹{rec.amount.toLocaleString()}</td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  rec.status === 'PAID'
                                    ? 'bg-[rgba(16,185,129,0.15)] text-[#10B981]'
                                    : 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B]'
                                }`}
                              >
                                {rec.status}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <a
                                href="https://media-hosting.dhyeyp254.workers.dev/1793338782614.json"
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-[#1677FF] hover:underline flex items-center gap-1 font-semibold"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Receipt PDF</span>
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 10. FACULTY DOUBTS & QUERIES TAB */}
            {activeTab === 'QUERIES' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[#F5F7FA]">
                      Faculty Academic Doubts Clinic
                    </h2>
                    <p className="font-sans text-xs text-[#929BAA] mt-1">
                      Submit homework or conceptual doubts to faculty and receive verified answers.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowQueryModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-[#1677FF] hover:bg-[#3395FF] text-xs font-semibold text-white transition flex items-center gap-1.5 shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ask New Doubt</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {queries.map((q) => (
                    <div
                      key={q.id}
                      className="p-5 rounded-2xl bg-[#0A0D12] border border-[rgba(255,255,255,0.08)] space-y-3.5 shadow-lg"
                    >
                      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#10151D] text-[#1677FF]">
                            {q.subject}
                          </span>
                          {q.topic && (
                            <span className="text-xs text-[#C3CAD6] font-semibold">
                              {q.topic}
                            </span>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            q.status === 'ANSWERED'
                              ? 'bg-[rgba(16,185,129,0.15)] text-[#10B981]'
                              : 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B]'
                          }`}
                        >
                          {q.status}
                        </span>
                      </div>

                      <div className="text-xs text-[#F5F7FA] leading-relaxed">
                        <strong className="text-[#929BAA] block mb-1">Your Question:</strong>
                        {q.questionText}
                      </div>

                      {q.facultyReply && (
                        <div className="p-3.5 rounded-xl bg-[#10151D] border border-[rgba(16,185,129,0.2)] text-xs text-[#C3CAD6] space-y-1">
                          <div className="flex items-center justify-between text-[#10B981] font-bold text-[11px]">
                            <span>Faculty Response ({q.facultyName || 'Faculty'})</span>
                            <span className="font-data text-[10px] text-[#929BAA]">{q.repliedAt?.split('T')[0]}</span>
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
                  <h2 className="font-display text-2xl font-bold text-[#F5F7FA]">
                    Personal Study Planner & Daily Checklist
                  </h2>
                  <p className="font-sans text-xs text-[#929BAA] mt-1">
                    Manage daily study goals, DPP checklists, and syllabus preparation deadlines.
                  </p>
                </div>

                {/* Add Task Form */}
                <form
                  onSubmit={handleCreateTask}
                  className="p-4 rounded-2xl bg-[#0A0D12] border border-[rgba(255,255,255,0.08)] flex flex-col sm:flex-row items-center gap-3 shadow-lg"
                >
                  <input
                    type="text"
                    required
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="e.g. Solve 30 Questions on Definite Integrals DPP 14"
                    className="flex-1 w-full bg-[#10151D] border border-[rgba(255,255,255,0.08)] rounded-xl px-3.5 py-2.5 text-xs text-[#F5F7FA] outline-none focus:border-[#1677FF]"
                  />
                  <select
                    value={newTaskSubject}
                    onChange={(e) => setNewTaskSubject(e.target.value)}
                    className="w-full sm:w-36 bg-[#10151D] border border-[rgba(255,255,255,0.08)] rounded-xl px-3 py-2.5 text-xs text-[#F5F7FA] outline-none"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="General Study">General</option>
                  </select>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full sm:w-28 bg-[#10151D] border border-[rgba(255,255,255,0.08)] rounded-xl px-3 py-2.5 text-xs text-[#F5F7FA] outline-none"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="LOW">Low</option>
                  </select>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#1677FF] hover:bg-[#3395FF] text-xs font-semibold text-white transition flex items-center justify-center gap-1.5 shrink-0"
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
                      className={`p-3.5 rounded-xl bg-[#0A0D12] border transition flex items-center justify-between gap-3 shadow-sm ${
                        task.isCompleted
                          ? 'border-[rgba(255,255,255,0.04)] opacity-60'
                          : 'border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleTask(task.id, task.isCompleted)}
                          className="text-[#1677FF] hover:text-[#3395FF] transition"
                        >
                          {task.isCompleted ? (
                            <CheckSquare className="w-4 h-4 text-[#10B981]" />
                          ) : (
                            <Square className="w-4 h-4 text-[#929BAA]" />
                          )}
                        </button>
                        <div>
                          <div
                            className={`text-xs font-bold ${
                              task.isCompleted ? 'line-through text-[#929BAA]' : 'text-[#F5F7FA]'
                            }`}
                          >
                            {task.title}
                          </div>
                          <div className="text-[10px] text-[#929BAA] flex items-center gap-2 mt-0.5">
                            <span>{task.subject}</span>
                            <span>•</span>
                            <span
                              className={
                                task.priority === 'HIGH'
                                  ? 'text-[#F43F5E] font-semibold'
                                  : 'text-[#929BAA]'
                              }
                            >
                              {task.priority} Priority
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 rounded-lg text-[#929BAA] hover:text-[#F43F5E] hover:bg-[#10151D] transition"
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
                  <h2 className="font-display text-2xl font-bold text-[#F5F7FA]">
                    Official Student Documents & PDF Center
                  </h2>
                  <p className="font-sans text-xs text-[#929BAA] mt-1">
                    Download official statements, report cards, fee receipts, and timetables.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-5 rounded-2xl bg-[#0A0D12] border border-[rgba(255,255,255,0.08)] flex items-center justify-between gap-4 shadow-lg hover:border-[rgba(255,255,255,0.15)] transition"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#10151D] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#1677FF] shrink-0">
                          <FileBadge className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#F5F7FA] line-clamp-1">
                            {doc.title}
                          </div>
                          <div className="text-[10px] text-[#929BAA] mt-0.5">
                            {doc.academicPeriod} • Issued: {doc.issueDate} • {doc.fileSize}
                          </div>
                        </div>
                      </div>

                      <a
                        href={doc.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-[#1677FF] hover:bg-[#3395FF] text-white text-xs font-semibold transition flex items-center gap-1.5 shrink-0 shadow"
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
                  <h2 className="font-display text-2xl font-bold text-[#F5F7FA]">
                    Student Profile & Institute Enrollment
                  </h2>
                  <p className="font-sans text-xs text-[#929BAA] mt-1">
                    Manage your credentials, verify institute membership, or join a new batch via invitation code.
                  </p>
                </div>

                {/* Profile Identity Card */}
                <div className="p-6 rounded-2xl bg-[#0A0D12] border border-[rgba(255,255,255,0.08)] grid grid-cols-1 md:grid-cols-2 gap-6 shadow-xl">
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-[#1677FF] uppercase tracking-wider">
                      Student Credentials
                    </div>
                    <div>
                      <label className="text-[10px] text-[#929BAA] uppercase block">Full Name</label>
                      <div className="text-sm font-bold text-[#F5F7FA]">{student.fullName}</div>
                    </div>
                    <div>
                      <label className="text-[10px] text-[#929BAA] uppercase block">Email Address</label>
                      <div className="text-sm text-[#F5F7FA]">{student.email}</div>
                    </div>
                    <div>
                      <label className="text-[10px] text-[#929BAA] uppercase block">Phone Contact</label>
                      <div className="text-sm text-[#F5F7FA]">{profileData?.phone || 'Not provided'}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs font-bold text-[#10B981] uppercase tracking-wider">
                      Academic Allocation
                    </div>
                    <div>
                      <label className="text-[10px] text-[#929BAA] uppercase block">Enrolled Institute</label>
                      <div className="text-sm font-bold text-[#F5F7FA]">
                        {student.instituteName || 'Enrolled Institute'}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-[#929BAA] uppercase block">Batch Assignment</label>
                      <div className="text-sm text-[#F5F7FA]">
                        {profileData?.batchName || '—'}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-[#929BAA] uppercase block">Student Roll Number</label>
                      <div className="text-sm font-data font-bold text-[#10B981]">
                        {profileData?.rollNumber || '—'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* JOIN BATCH WITH INVITATION CODE */}
                <div className="p-6 rounded-2xl bg-[#0A0D12] border border-[rgba(255,255,255,0.08)] space-y-4 shadow-xl">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#1677FF]" />
                    <h3 className="font-sans font-bold text-sm text-[#F5F7FA]">
                      Join Another Batch via Invitation Code
                    </h3>
                  </div>
                  <p className="text-xs text-[#929BAA]">
                    If your instructor provided a fresh invitation code for Physics, Chemistry, or Special Mock Batches, redeem it below.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="text"
                      value={inviteCodeInput}
                      onChange={(e) => setInviteCodeInput(e.target.value)}
                      placeholder="e.g. APEX-INV-2026"
                      className="flex-1 w-full bg-[#10151D] border border-[rgba(255,255,255,0.08)] rounded-xl px-3.5 py-2.5 text-xs text-[#F5F7FA] outline-none focus:border-[#1677FF]"
                    />
                    <button
                      onClick={handleVerifyInvite}
                      disabled={isValidatingInvite || !inviteCodeInput.trim()}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#10151D] hover:bg-[#141A24] border border-[rgba(255,255,255,0.1)] text-xs font-semibold text-[#F5F7FA] transition"
                    >
                      {isValidatingInvite ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Verify Code'}
                    </button>
                  </div>

                  {inviteValidationResult && (
                    <div className="p-4 rounded-xl bg-[#10151D] border border-[rgba(16,185,129,0.3)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-[#10B981]">Valid Invitation Verified!</div>
                        <div className="text-xs text-[#F5F7FA] font-medium mt-0.5">
                          {inviteValidationResult.instituteName} — {inviteValidationResult.batchName} ({inviteValidationResult.subject})
                        </div>
                      </div>
                      <button
                        onClick={handleConfirmJoinBatch}
                        className="px-4 py-2 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-xs font-bold text-white transition shadow"
                      >
                        Confirm Enrollment
                      </button>
                    </div>
                  )}

                  {inviteStatusMsg && (
                    <div className="text-xs text-[#F59E0B] font-medium">{inviteStatusMsg}</div>
                  )}
                </div>

                {/* SUPPORT & HELP */}
                <div className="p-6 rounded-2xl bg-[#0A0D12] border border-[rgba(255,255,255,0.08)] flex items-center justify-between shadow-xl">
                  <div>
                    <h3 className="font-sans font-bold text-sm text-[#F5F7FA]">
                      Academic Help & Support Desk
                    </h3>
                    <p className="text-xs text-[#929BAA] mt-0.5">
                      Need correction in profile details, fees, or report cards? Submit an official ticket.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSupportModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-[#10151D] hover:bg-[#141A24] border border-[rgba(255,255,255,0.1)] text-xs font-semibold text-[#F5F7FA] transition flex items-center gap-1.5"
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
          <div className="w-full max-w-md bg-[#0A0D12] h-full border-l border-[rgba(255,255,255,0.08)] p-6 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[rgba(255,255,255,0.08)]">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#1677FF]" />
                  <h3 className="font-sans font-bold text-base text-[#F5F7FA]">
                    Notifications
                  </h3>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1 rounded-lg text-[#929BAA] hover:bg-[#10151D]"
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
                        ? 'bg-[#10151D]/40 border-[rgba(255,255,255,0.04)] text-[#929BAA]'
                        : 'bg-[#10151D] border-[rgba(22,119,255,0.3)] text-[#F5F7FA]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-[#929BAA]">
                      <span className="font-semibold text-[#1677FF]">{notif.type}</span>
                      <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs font-bold">{notif.title}</div>
                    <p className="text-[11px] text-[#C3CAD6]">{notif.message}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                setShowNotifications(false);
              }}
              className="w-full py-2.5 rounded-xl bg-[#10151D] hover:bg-[#141A24] border border-[rgba(255,255,255,0.08)] text-xs font-semibold text-[#F5F7FA] transition"
            >
              Mark All as Read
            </button>
          </div>
        </div>
      )}

      {/* 2. SUBMIT ASSIGNMENT MODAL */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0A0D12] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-sans font-bold text-base text-[#F5F7FA]">
                  Submit Homework: {selectedAssignment.title}
                </h3>
                <p className="text-xs text-[#929BAA]">Max Marks: {selectedAssignment.maxMarks}</p>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="p-1 rounded-lg text-[#929BAA] hover:bg-[#10151D]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#C3CAD6] mb-1">
                Your Answer / Notes
              </label>
              <textarea
                rows={4}
                value={assignmentAnswer}
                onChange={(e) => setAssignmentAnswer(e.target.value)}
                placeholder="Write your calculations, notes, or explanations..."
                className="w-full bg-[#10151D] border border-[rgba(255,255,255,0.08)] rounded-xl p-3 text-xs text-[#F5F7FA] outline-none focus:border-[#1677FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#C3CAD6] mb-1">
                Attachment URL (Media CDN or Google Drive / Scanned PDF)
              </label>
              <input
                type="text"
                value={assignmentFileUrl}
                onChange={(e) => setAssignmentFileUrl(e.target.value)}
                placeholder="https://media-hosting.dhyeyp254.workers.dev/..."
                className="w-full bg-[#10151D] border border-[rgba(255,255,255,0.08)] rounded-xl px-3 py-2 text-xs text-[#F5F7FA] outline-none focus:border-[#1677FF]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleSubmitAssignment(true)}
                disabled={isSubmittingAssignment}
                className="px-4 py-2 rounded-xl bg-[#10151D] hover:bg-[#141A24] border border-[rgba(255,255,255,0.1)] text-xs font-semibold text-[#F5F7FA] transition"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => handleSubmitAssignment(false)}
                disabled={isSubmittingAssignment}
                className="px-4 py-2 rounded-xl bg-[#1677FF] hover:bg-[#3395FF] text-xs font-semibold text-white transition flex items-center gap-1.5"
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
          <div className="w-full max-w-2xl bg-[#0A0D12] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
              <div>
                <h3 className="font-sans font-bold text-lg text-[#F5F7FA]">
                  {activeTest.title}
                </h3>
                <p className="text-xs text-[#929BAA]">
                  Duration: {activeTest.durationMinutes}m • Total Marks: {activeTest.totalMarks}
                </p>
              </div>
              <button
                onClick={() => setActiveTest(null)}
                className="p-1 rounded-lg text-[#929BAA] hover:bg-[#10151D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {testResultFeedback ? (
              <div className="p-5 rounded-xl bg-[rgba(16,185,129,0.12)] border border-[rgba(16,185,129,0.3)] text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-[#10B981] mx-auto" />
                <div className="font-display text-xl font-bold text-[#F5F7FA]">
                  Test Submitted Successfully!
                </div>
                <p className="text-xs text-[#C3CAD6]">{testResultFeedback}</p>
                <button
                  onClick={() => setActiveTest(null)}
                  className="px-5 py-2 rounded-xl bg-[#10B981] text-white font-bold text-xs"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeTest.questions.map((q: any, idx: number) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl bg-[#10151D] border border-[rgba(255,255,255,0.05)] space-y-3"
                  >
                    <div className="text-xs font-bold text-[#F5F7FA] flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#1677FF]/20 text-[#1677FF] flex items-center justify-center text-[10px] font-data">
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
                                ? 'bg-[#1677FF]/20 border-[#1677FF] text-white font-bold'
                                : 'bg-[#0A0D12] border-[rgba(255,255,255,0.06)] text-[#C3CAD6] hover:bg-[#141A24]'
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                                isSelected ? 'border-[#1677FF] bg-[#1677FF] text-white' : 'border-[#55595F]'
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
                  className="w-full py-3 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-xs font-bold text-white transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
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
            className="w-full max-w-md bg-[#0A0D12] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-bold text-base text-[#F5F7FA]">
                Attendance Correction Request
              </h3>
              <button
                type="button"
                onClick={() => setShowAttendanceModal(false)}
                className="p-1 rounded-lg text-[#929BAA] hover:bg-[#10151D]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#C3CAD6] mb-1">
                Session Date *
              </label>
              <input
                type="date"
                required
                value={correctionDate}
                onChange={(e) => setCorrectionDate(e.target.value)}
                className="w-full bg-[#10151D] border border-[rgba(255,255,255,0.08)] rounded-xl px-3 py-2 text-xs text-[#F5F7FA] outline-none focus:border-[#1677FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#C3CAD6] mb-1">
                Reason for Correction *
              </label>
              <textarea
                rows={3}
                required
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="Explain why you were marked absent or late (e.g. attended stream, medical slip)..."
                className="w-full bg-[#10151D] border border-[rgba(255,255,255,0.08)] rounded-xl p-3 text-xs text-[#F5F7FA] outline-none focus:border-[#1677FF]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAttendanceModal(false)}
                className="px-4 py-2 rounded-xl bg-[#10151D] text-xs font-semibold text-[#929BAA]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingCorrection}
                className="px-4 py-2 rounded-xl bg-[#1677FF] hover:bg-[#3395FF] text-xs font-semibold text-white transition flex items-center gap-1.5"
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
            className="w-full max-w-lg bg-[#0A0D12] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-bold text-base text-[#F5F7FA]">
                Ask Academic Doubt
              </h3>
              <button
                type="button"
                onClick={() => setShowQueryModal(false)}
                className="p-1 rounded-lg text-[#929BAA] hover:bg-[#10151D]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#C3CAD6] mb-1">
                  Subject *
                </label>
                <select
                  value={querySubject}
                  onChange={(e) => setQuerySubject(e.target.value)}
                  className="w-full bg-[#10151D] border border-[rgba(255,255,255,0.08)] rounded-xl px-3 py-2 text-xs text-[#F5F7FA] outline-none"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#C3CAD6] mb-1">
                  Topic / Chapter
                </label>
                <input
                  type="text"
                  value={queryTopic}
                  onChange={(e) => setQueryTopic(e.target.value)}
                  placeholder="e.g. Definite Integrals"
                  className="w-full bg-[#10151D] border border-[rgba(255,255,255,0.08)] rounded-xl px-3 py-2 text-xs text-[#F5F7FA] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#C3CAD6] mb-1">
                Describe Your Doubt / Question *
              </label>
              <textarea
                rows={4}
                required
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Explain the step where you are stuck or paste the problem text..."
                className="w-full bg-[#10151D] border border-[rgba(255,255,255,0.08)] rounded-xl p-3 text-xs text-[#F5F7FA] outline-none focus:border-[#1677FF]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowQueryModal(false)}
                className="px-4 py-2 rounded-xl bg-[#10151D] text-xs font-semibold text-[#929BAA]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingQuery}
                className="px-4 py-2 rounded-xl bg-[#1677FF] hover:bg-[#3395FF] text-xs font-semibold text-white transition flex items-center gap-1.5"
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
            className="w-full max-w-md bg-[#0A0D12] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-bold text-base text-[#F5F7FA]">
                Submit Support Ticket
              </h3>
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="p-1 rounded-lg text-[#929BAA] hover:bg-[#10151D]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#C3CAD6] mb-1">
                Category
              </label>
              <select
                value={supportCategory}
                onChange={(e) => setSupportCategory(e.target.value as any)}
                className="w-full bg-[#10151D] border border-[rgba(255,255,255,0.08)] rounded-xl px-3 py-2 text-xs text-[#F5F7FA] outline-none"
              >
                <option value="PROFILE_CORRECTION">Profile Correction</option>
                <option value="ATTENDANCE_MISMATCH">Attendance Mismatch</option>
                <option value="PAYMENT_ISSUE">Payment / Fee Issue</option>
                <option value="ACADEMIC_HELP">Academic Assistance</option>
                <option value="TECHNICAL_SUPPORT">Technical Issue</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#C3CAD6] mb-1">
                Subject *
              </label>
              <input
                type="text"
                required
                value={supportSubject}
                onChange={(e) => setSupportSubject(e.target.value)}
                placeholder="Summary of issue..."
                className="w-full bg-[#10151D] border border-[rgba(255,255,255,0.08)] rounded-xl px-3 py-2 text-xs text-[#F5F7FA] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#C3CAD6] mb-1">
                Description *
              </label>
              <textarea
                rows={3}
                required
                value={supportDescription}
                onChange={(e) => setSupportDescription(e.target.value)}
                placeholder="Details of your request..."
                className="w-full bg-[#10151D] border border-[rgba(255,255,255,0.08)] rounded-xl p-3 text-xs text-[#F5F7FA] outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="px-4 py-2 rounded-xl bg-[#10151D] text-xs font-semibold text-[#929BAA]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingSupport}
                className="px-4 py-2 rounded-xl bg-[#1677FF] hover:bg-[#3395FF] text-xs font-semibold text-white transition flex items-center gap-1.5"
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
