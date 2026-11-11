'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Sidebar, NavTab } from '../components/Sidebar';
// Default tab — eagerly loaded
import { DashboardView } from '../components/DashboardView';
// Always-visible chrome — eagerly loaded
import { LoadError } from '../components/LoadError';
import { AuthModal } from '../components/AuthModal';
import { AuthWelcomeScreen } from '../components/AuthWelcomeScreen';
import { GetStartedView } from '../components/GetStartedView';
import { NotificationDrawer } from '../components/NotificationDrawer';

// Non-default views — lazy loaded to reduce initial JS bundle
const BulkMarksEntryView = dynamic(
  () => import('../components/BulkMarksEntryView').then((m) => ({ default: m.BulkMarksEntryView })),
  { ssr: false },
);
const BatchesView = dynamic(
  () => import('../components/BatchesView').then((m) => ({ default: m.BatchesView })),
  { ssr: false },
);
const AttendanceView = dynamic(
  () => import('../components/AttendanceView').then((m) => ({ default: m.AttendanceView })),
  { ssr: false },
);
const AssignmentsView = dynamic(
  () => import('../components/AssignmentsView').then((m) => ({ default: m.AssignmentsView })),
  { ssr: false },
);
const TestsView = dynamic(
  () => import('../components/TestsView').then((m) => ({ default: m.TestsView })),
  { ssr: false },
);
const LessonPlansView = dynamic(
  () => import('../components/LessonPlansView').then((m) => ({ default: m.LessonPlansView })),
  { ssr: false },
);
const InvitationsView = dynamic(
  () => import('../components/InvitationsView').then((m) => ({ default: m.InvitationsView })),
  { ssr: false },
);
const TimetableView = dynamic(
  () => import('../components/TimetableView').then((m) => ({ default: m.TimetableView })),
  { ssr: false },
);
const AnnouncementsView = dynamic(
  () => import('../components/AnnouncementsView').then((m) => ({ default: m.AnnouncementsView })),
  { ssr: false },
);
const ReportsView = dynamic(
  () => import('../components/ReportsView').then((m) => ({ default: m.ReportsView })),
  { ssr: false },
);
const SettingsView = dynamic(
  () => import('../components/SettingsView').then((m) => ({ default: m.SettingsView })),
  { ssr: false },
);
const DailyTeachingDiaryView = dynamic(
  () => import('../components/DailyTeachingDiaryView').then((m) => ({ default: m.DailyTeachingDiaryView })),
  { ssr: false },
);
const FacultyManagementView = dynamic(
  () => import('../components/FacultyManagementView').then((m) => ({ default: m.FacultyManagementView })),
  { ssr: false },
);
const FacultySalaryView = dynamic(
  () => import('../components/FacultySalaryView').then((m) => ({ default: m.FacultySalaryView })),
  { ssr: false },
);
const FacultyLeaveView = dynamic(
  () => import('../components/FacultyLeaveView').then((m) => ({ default: m.FacultyLeaveView })),
  { ssr: false },
);
const StudyMaterialView = dynamic(
  () => import('../components/StudyMaterialView').then((m) => ({ default: m.StudyMaterialView })),
  { ssr: false },
);
const LibraryView = dynamic(
  () => import('../components/LibraryView').then((m) => ({ default: m.LibraryView })),
  { ssr: false },
);
const BatchFeesView = dynamic(
  () => import('../components/BatchFeesView').then((m) => ({ default: m.BatchFeesView })),
  { ssr: false },
);
const StudentLeavesView = dynamic(
  () => import('../components/StudentLeavesView').then((m) => ({ default: m.StudentLeavesView })),
  { ssr: false },
);
const TuitionBrandingView = dynamic(
  () => import('../components/TuitionBrandingView').then((m) => ({ default: m.TuitionBrandingView })),
  { ssr: false },
);
const SubscriptionView = dynamic(
  () => import('../components/SubscriptionView').then((m) => ({ default: m.SubscriptionView })),
  { ssr: false },
);
import { useWebPush } from '../hooks/useWebPush';
import { teacherApi, getAuthToken, clearAuthToken } from '../lib/api';
import { cached, invalidate } from '../lib/cache';
import type {
  TeacherDashboardMetrics,
  BatchSummary,
  StudentRosterItem,
  InvitationCode,
  Assignment,
  TestQuiz,
  LessonPlan,
  TimetableSlot,
  AnnouncementItem,
  TeacherReports,
  UserSession,
  TeacherAnalyticsSummary,
  InAppNotification,
} from '@padhai-pilot/shared';
import { Loader2, Menu, LayoutDashboard, NotebookPen, CalendarCheck, Users, Bell } from 'lucide-react';
import { MotionProvider, ToastProvider, DashboardSkeleton, OfflineBanner } from '@padhai-pilot/ui';

type ResourceKey = 'dashboard' | 'batches' | 'invitations' | 'assignments' | 'tests' | 'lessonPlans' | 'timetable' | 'announcements' | 'reports' | 'analytics';
const ALL_RESOURCES: ResourceKey[] = ['dashboard', 'batches', 'invitations', 'assignments', 'tests', 'lessonPlans', 'timetable', 'announcements', 'reports', 'analytics'];
/** Resources each tab cannot render without. A failure shows an error state with Retry, never empty data. */
const TAB_RESOURCES: Partial<Record<NavTab, ResourceKey[]>> = {
  dashboard: ['dashboard'],
  batches: ['batches'],
  attendance: ['batches'],
  bulkMarks: ['batches'],
  assignments: ['batches', 'assignments'],
  tests: ['batches', 'tests'],
  lessonPlans: ['batches', 'lessonPlans'],
  invitations: ['batches'],
  announcements: ['batches', 'announcements'],
  reports: ['reports'],
  studentFees: ['batches'],
};

function TeacherApp() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentTab, setCurrentTabState] = useState<NavTab>(() => {
    const t = searchParams.get('tab') as NavTab | null;
    return t || 'dashboard';
  });

  // Sync state when user navigates back/forward
  useEffect(() => {
    const t = searchParams.get('tab') as NavTab | null;
    const next = t || 'dashboard';
    if (next !== currentTab) setCurrentTabState(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const setCurrentTab = useCallback(
    (tab: NavTab) => {
      setCurrentTabState(tab);
      router.replace(`?tab=${tab}`, { scroll: false });
    },
    [router],
  );
  const [user, setUser] = useState<UserSession | null>(null);
  const [metrics, setMetrics] = useState<TeacherDashboardMetrics | null>(null);
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [students, setStudents] = useState<StudentRosterItem[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [invitations, setInvitations] = useState<InvitationCode[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tests, setTests] = useState<TestQuiz[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [reports, setReports] = useState<TeacherReports | null>(null);
  const [analytics, setAnalytics] = useState<TeacherAnalyticsSummary | null>(null);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isSubscribed, subscribeToPush, isRegistering: isPushRegistering } = useWebPush(!!user);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [showGetStarted, setShowGetStarted] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('padhai_teacher_onboarded');
    }
    return false;
  });

  const [loadErrors, setLoadErrors] = useState<Partial<Record<ResourceKey, string>>>({});

  const loadResource = useCallback(async (key: ResourceKey) => {
    try {
      switch (key) {
        case 'dashboard': setMetrics(await cached('teacher:dashboard', 3 * 60 * 1000, () => teacherApi.getDashboard())); break;
        case 'batches': {
          const list = await cached('teacher:batches', 5 * 60 * 1000, () => teacherApi.getBatches());
          setBatches(list);
          setSelectedBatchId((cur) => (cur && list.some((b) => b.id === cur) ? cur : list[0]?.id ?? ''));
          if (list.length > 0) {
            const rosterRes = await cached(`teacher:roster:${list[0].id}`, 3 * 60 * 1000, () => teacherApi.getBatchRoster(list[0].id));
            setStudents(rosterRes.students);
          } else {
            setStudents([]);
          }
          break;
        }
        case 'invitations': setInvitations(await cached('teacher:invitations', 5 * 60 * 1000, () => teacherApi.getInvitations())); break;
        case 'assignments': setAssignments(await cached('teacher:assignments', 3 * 60 * 1000, () => teacherApi.getAssignments())); break;
        case 'tests': setTests(await cached('teacher:tests', 3 * 60 * 1000, () => teacherApi.getTests())); break;
        case 'lessonPlans': setLessonPlans(await cached('teacher:lessonPlans', 5 * 60 * 1000, () => teacherApi.getLessonPlans())); break;
        case 'timetable': setTimetable(await cached('teacher:timetable', 10 * 60 * 1000, () => teacherApi.getTimetable())); break;
        case 'announcements': setAnnouncements(await cached('teacher:announcements', 3 * 60 * 1000, () => teacherApi.getAnnouncements())); break;
        case 'reports': setReports(await cached('teacher:reports', 5 * 60 * 1000, () => teacherApi.getReports())); break;
        case 'analytics': setAnalytics(await cached('teacher:analytics', 10 * 60 * 1000, () => teacherApi.getAnalytics())); break;
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
  }, []);

  const loadUserData = useCallback(async () => {
    // Dashboard first — user sees useful content immediately
    await loadResource('dashboard');
    // Remaining resources load in background; UI shows each as it arrives
    Promise.all(
      ALL_RESOURCES.filter((k) => k !== 'dashboard').map((k) => loadResource(k)),
    ).catch(() => undefined);
    try {
      const notifs = await teacherApi.getNotifications();
      setNotifications(notifs);
    } catch {
      // safe fallback
    }
  }, [loadResource]);

  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      setSessionNotice('Your session expired. Please sign in again.');
    };
    window.addEventListener('pp:unauthorized', onUnauthorized);
    return () => window.removeEventListener('pp:unauthorized', onUnauthorized);
  }, []);

  // Initialize teacher authentication and load core data
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      const token = getAuthToken();
      if (!token) {
        setUser(null);
        setIsLoading(false);
        setShowAuthModal(true);
        return;
      }

      try {
        const auth = await cached('teacher:currentUser', 5 * 60 * 1000, () => teacherApi.getCurrentUser());
        if (auth && auth.user) {
          setUser(auth.user);
          await loadUserData();
        } else {
          clearAuthToken();
          invalidate('teacher:currentUser');
          setUser(null);
          setShowAuthModal(true);
        }
      } catch (err) {
        console.warn('Session verification failed, prompting login:', err);
        clearAuthToken();
        invalidate('teacher:currentUser');
        setUser(null);
        setShowAuthModal(true);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, [loadUserData]);

  const handleSelectBatch = async (batchId: string) => {
    setSelectedBatchId(batchId);
    try {
      const res = await teacherApi.getBatchRoster(batchId);
      setStudents(res.students);
    } catch (err) {
      console.error('Failed to load roster:', err);
    }
  };

  const handleCreateBatch = async (data: {
    name: string;
    code: string;
    subject: string;
    gradeLevel: string;
    room?: string;
  }) => {
    const newBatch = await teacherApi.createBatch(data);
    invalidate('teacher:batches');
    setBatches((prev) => [...prev, newBatch]);
    setSelectedBatchId(newBatch.id);
  };

  const handleSaveAttendance = async (data: {
    batchId: string;
    date: string;
    records: { studentId: string; status: any; note?: string }[];
  }) => {
    await teacherApi.saveAttendance(data);
    invalidate('teacher:dashboard');
    const updatedMetrics = await teacherApi.getDashboard();
    setMetrics(updatedMetrics);
  };

  const handleCreateAssignment = async (data: any) => {
    const newAsg = await teacherApi.createAssignment(data);
    setAssignments((prev) => [newAsg, ...prev]);
  };

  const handleGradeSubmission = async (
    submissionId: string,
    data: { marksObtained: number; feedback?: string; resubmit?: boolean },
  ) => {
    await teacherApi.gradeSubmission(submissionId, data);
  };

  const handleCreateTest = async (data: any) => {
    const newTest = await teacherApi.createTest(data);
    setTests((prev) => [newTest, ...prev]);
  };

  const handleToggleTestResults = async (testId: string) => {
    const res = await teacherApi.releaseTestResults(testId);
    setTests((prev) =>
      prev.map((t) => (t.id === testId ? { ...t, resultsReleased: res.resultsReleased } : t)),
    );
  };

  const handleCreateLessonPlan = async (data: any) => {
    const newPlan = await teacherApi.createLessonPlan(data);
    setLessonPlans((prev) => [...prev, newPlan]);
  };

  const handleToggleLessonPlan = async (planId: string) => {
    const res = await teacherApi.toggleLessonPlan(planId);
    setLessonPlans((prev) =>
      prev.map((lp) => (lp.id === planId ? { ...lp, isCompleted: res.isCompleted } : lp)),
    );
  };

  const handleCreateInvitation = async (data: {
    batchId?: string;
    maxUses?: number;
    expiryDays?: number;
  }) => {
    const newInv = await teacherApi.createInvitation(data);
    setInvitations((prev) => [newInv, ...prev]);
    return newInv;
  };

  const handleRevokeInvitation = async (code: string) => {
    await teacherApi.revokeInvitation(code);
    setInvitations((prev) =>
      prev.map((i) => (i.code === code ? { ...i, isRevoked: true, status: 'REVOKED' } : i)),
    );
  };

  const handleCreateAnnouncement = async (data: {
    batchId?: string;
    title: string;
    content: string;
    priority?: 'NORMAL' | 'URGENT';
  }) => {
    const newAnn = await teacherApi.createAnnouncement(data);
    invalidate('teacher:announcements');
    setAnnouncements((prev) => [newAnn, ...prev]);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await teacherApi.deleteBroadcast(id);
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  const handleQuickAttendance = (batchId: string) => {
    setSelectedBatchId(batchId);
    setCurrentTab('attendance');
  };

  const handleLogout = async () => {
    ['teacher:currentUser','teacher:dashboard','teacher:batches','teacher:assignments','teacher:tests','teacher:lessonPlans','teacher:timetable','teacher:announcements','teacher:reports','teacher:analytics','teacher:invitations'].forEach(invalidate);
    try {
      await teacherApi.logout();
    } catch {
      clearAuthToken();
    }
    setUser(null);
    setMetrics(null);
    setBatches([]);
    setStudents([]);
    setInvitations([]);
    setAssignments([]);
    setTests([]);
    setLessonPlans([]);
    setTimetable([]);
    setAnnouncements([]);
    setReports(null);
    setAnalytics(null);
    setLoadErrors({});
    setShowAuthModal(true);
  };

  const handleAuthSuccess = async (authenticatedUser: UserSession) => {
    if (authenticatedUser.role === 'SUPER_ADMIN') {
      // Platform administration lives in the separate Admin console, never in the faculty studio.
      clearAuthToken();
      setUser(null);
      setSessionNotice('Platform administrator accounts sign in to the Admin console, not the Teacher Portal.');
      return;
    }
    setUser(authenticatedUser);
    setShowAuthModal(false);
    if (authenticatedUser.role === 'TUITION_OWNER') {
      setCurrentTab('tuitionBranding');
    } else {
      setCurrentTab('dashboard');
    }
    setIsLoading(true);
    await loadUserData();
    setIsLoading(false);
  };

  const blockingErrors = (TAB_RESOURCES[currentTab] ?? []).filter((k) => loadErrors[k]);

  if (isLoading) {
    return (
      <div className="min-h-screen ak-desk-surface flex flex-col p-6 lg:p-10 max-w-7xl mx-auto w-full">
        <DashboardSkeleton cards={4} />
      </div>
    );
  }

  // If user is not authenticated, present the Master Welcome & Auth screen
  if (!user) {
    return (
      <AuthWelcomeScreen
        onAuthSuccess={handleAuthSuccess}
        notice={sessionNotice}
      />
    );
  }

  return (
    <div className="min-h-screen ak-desk-surface flex flex-col lg:flex-row relative text-[var(--ink-primary)]">
      <OfflineBanner />
      {/* Mobile Top Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-[var(--bg-paper)]/95 backdrop-blur-md border-b border-[var(--border-paper)] px-4 py-2.5 flex items-center justify-between w-full">
        <div className="flex items-center gap-2.5 min-w-0">
          <img src="/logo.png" alt="PadhaiPilot" className="w-8 h-8 rounded-xl object-contain" />
          <div className="min-w-0">
            <h1 className="font-['Playfair_Display'] font-bold text-sm text-[var(--ink-primary)] truncate">
              {user?.instituteName || 'Teacher Portal'}
            </h1>
            <p className="font-['Raleway'] text-[10px] text-[var(--brand-electric)] font-semibold truncate capitalize">
              {({
                dashboard: 'Overview',
                bulkMarks: 'Bulk Marks',
                batches: 'Batches',
                attendance: 'Attendance',
                assignments: 'Assignments',
                tests: 'Tests & Quizzes',
                lessonPlans: 'Lesson Plans',
                invitations: 'Invitations',
                timetable: 'Timetable',
                announcements: 'Announcements',
                teachingDiary: 'Teaching Diary',
                studyMaterials: 'Study Materials',
                library: 'Library',
                facultyRoster: 'Faculty Roster',
                facultySalary: 'Salary Slips',
                facultyLeave: 'Leave',
                studentFees: 'Student Fees',
                studentLeaves: 'Student Leave',
                tuitionBranding: 'Branding',
                reports: 'Reports',
                subscription: 'Subscription',
                settings: 'Settings',
              } as Record<string, string>)[currentTab] ?? currentTab.replace(/([A-Z])/g, ' $1').trim()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotifications(true)}
            className="relative p-2 rounded-xl bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {notifications.filter((n) => !n.isRead).length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                {notifications.filter((n) => !n.isRead).length > 9 ? '9+' : notifications.filter((n) => !n.isRead).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-[var(--bg-paper-warm)] border border-[var(--border-paper)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Primary Sidebar & Mobile Drawer */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        teacherName={user?.fullName}
        instituteName={user?.instituteName}
        userRole={user?.role}
        onOpenAuthModal={() => setShowAuthModal(true)}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onOpenNotifications={() => setShowNotifications(true)}
        unreadNotificationCount={notifications.filter((n) => !n.isRead).length}
      />


      {/* Main View Area */}
      <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-10 pb-24 lg:pb-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {blockingErrors.length > 0 ? (
            <LoadError
              message={blockingErrors.map((k) => loadErrors[k]).join("; ")}
              onRetry={() => blockingErrors.forEach((k) => loadResource(k))}
            />
          ) : (
          <>
          {currentTab === 'dashboard' && metrics && (
            <DashboardView
              metrics={metrics}
              reports={reports}
              analytics={analytics}
              reportsError={loadErrors.reports}
              analyticsError={loadErrors.analytics}
              onNavigate={setCurrentTab}
              onQuickAttendance={handleQuickAttendance}
            />
          )}

          {currentTab === 'bulkMarks' && (
            <BulkMarksEntryView
              instituteName={user?.instituteName}
              batches={batches}
              selectedBatchId={selectedBatchId}
              onSelectBatch={setSelectedBatchId}
            />
          )}

          {currentTab === 'batches' && (
            <BatchesView
              batches={batches}
              students={students}
              selectedBatchId={selectedBatchId}
              onSelectBatch={handleSelectBatch}
              onCreateBatch={handleCreateBatch}
              onBatchChanged={() => loadResource('batches')}
            />
          )}

          {currentTab === 'attendance' && (
            <AttendanceView
              batches={batches}
              selectedBatchId={selectedBatchId}
              onSaveAttendance={handleSaveAttendance}
              loadSession={(bId, date) => teacherApi.getAttendanceSession(bId, date)}
              trends={reports?.attendanceTrends}
            />
          )}

          {currentTab === 'assignments' && (
            <AssignmentsView
              batches={batches}
              assignments={assignments}
              onCreateAssignment={handleCreateAssignment}
              loadSubmissions={(id) => teacherApi.getSubmissions(id)}
              onGradeSubmission={handleGradeSubmission}
            />
          )}

          {currentTab === 'tests' && (
            <TestsView
              batches={batches}
              tests={tests}
              onCreateTest={handleCreateTest}
              onToggleResults={handleToggleTestResults}
            />
          )}

          {currentTab === 'lessonPlans' && (
            <LessonPlansView
              batches={batches}
              lessonPlans={lessonPlans}
              onCreatePlan={handleCreateLessonPlan}
              onToggleStatus={handleToggleLessonPlan}
            />
          )}

          {currentTab === 'invitations' && (
            <InvitationsView
              batches={batches}
            />
          )}

          {currentTab === 'timetable' && <TimetableView batches={batches} />}

          {currentTab === 'announcements' && (
            <AnnouncementsView
              batches={batches}
              announcements={announcements}
              onCreateAnnouncement={handleCreateAnnouncement}
              onDeleteAnnouncement={handleDeleteAnnouncement}
            />
          )}

          {currentTab === 'teachingDiary' && (
            <DailyTeachingDiaryView
              batches={batches}
              teacherName={user?.fullName}
              instituteName={user?.instituteName}
              isOwner={user?.role === 'TUITION_OWNER' || user?.role === 'INSTITUTE_ADMIN'}
            />
          )}

          {currentTab === 'studyMaterials' && (
            <StudyMaterialView
              batches={batches}
              teacherName={user?.fullName}
            />
          )}

          {currentTab === 'library' && (
            <LibraryView userRole={user?.role} />
          )}

          {currentTab === 'facultyRoster' && (
            <FacultyManagementView
              batches={batches}
              instituteName={user?.instituteName}
            />
          )}

          {currentTab === 'facultySalary' && (
            <FacultySalaryView
              instituteName={user?.instituteName}
              isOwner={user?.role === 'TUITION_OWNER' || user?.role === 'INSTITUTE_ADMIN'}
            />
          )}

          {currentTab === 'facultyLeave' && (
            <FacultyLeaveView
              currentUserId={user?.id}
              isOwnerOrManager={user?.role === 'TUITION_OWNER' || user?.role === 'INSTITUTE_ADMIN'}
            />
          )}

          {currentTab === 'studentFees' && (
            <BatchFeesView batches={batches} />
          )}

          {currentTab === 'studentLeaves' && (
            <StudentLeavesView />
          )}

          {currentTab === 'tuitionBranding' && (
            <TuitionBrandingView />
          )}

          {currentTab === 'reports' && reports && <ReportsView reports={reports} />}

          {currentTab === 'subscription' && (
            <SubscriptionView
              instituteName={user?.instituteName || 'Your Institute'}
              instituteId={user?.instituteId}
              userRole={user?.role}
            />
          )}

          {currentTab === 'settings' && user && (
            <SettingsView
              user={user}
              onUpdateUser={setUser}
              onLogout={handleLogout}
            />
          )}
          </>
          )}
        </div>
      </main>



      
      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-paper)]/95 backdrop-blur-md border-t border-[var(--border-paper)] py-1 px-2 flex items-center justify-around shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        {[
          { id: 'dashboard' as NavTab, label: 'Overview', icon: LayoutDashboard },
          { id: 'teachingDiary' as NavTab, label: 'Diary', icon: NotebookPen },
          { id: 'attendance' as NavTab, label: 'Attendance', icon: CalendarCheck },
          { id: 'batches' as NavTab, label: 'Batches', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setCurrentTab(tab.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-['Raleway'] font-semibold transition ${
                isActive ? 'text-[var(--brand-electric)]' : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-['Raleway'] font-semibold text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition"
        >
          <Menu className="w-4 h-4" />
          <span>More</span>
        </button>
      </nav>

      {/* Interactive Notification Drawer */}
      <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkRead={async (id) => {
          await teacherApi.markNotificationRead(id);
          setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
        }}
        onMarkAllRead={async () => {
          await teacherApi.markAllNotificationsRead();
          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        }}
        onNavigate={(url) => {
          const tab = url.replace(/^\//, '');
          if (tab) {
            setCurrentTab(tab as any);
          }
        }}
        isSubscribedToPush={isSubscribed}
        onEnablePush={subscribeToPush}
        isPushRegistering={isPushRegistering}
      />

      {/* Authentication & Profile Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

/** Shared motion + toast context (reduced-motion aware). */
export default function TeacherPortalRoot() {
  return (
    <MotionProvider>
      <ToastProvider>
        <Suspense>
          <TeacherApp />
        </Suspense>
      </ToastProvider>
    </MotionProvider>
  );
}
