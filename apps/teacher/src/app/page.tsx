'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavTab } from '../components/Sidebar';
import { DashboardView } from '../components/DashboardView';
import { BulkMarksEntryView } from '../components/BulkMarksEntryView';
import { BatchesView } from '../components/BatchesView';
import { AttendanceView } from '../components/AttendanceView';
import { AssignmentsView } from '../components/AssignmentsView';
import { TestsView } from '../components/TestsView';
import { LessonPlansView } from '../components/LessonPlansView';
import { InvitationsView } from '../components/InvitationsView';
import { TimetableView } from '../components/TimetableView';
import { AnnouncementsView } from '../components/AnnouncementsView';
import { ReportsView } from '../components/ReportsView';
import { SettingsView } from '../components/SettingsView';
import { DailyTeachingDiaryView } from '../components/DailyTeachingDiaryView';
import { FacultyManagementView } from '../components/FacultyManagementView';
import { FacultySalaryView } from '../components/FacultySalaryView';
import { FacultyLeaveView } from '../components/FacultyLeaveView';
import { StudyMaterialView } from '../components/StudyMaterialView';
import { BatchFeesView } from '../components/BatchFeesView';
import { StudentLeavesView } from '../components/StudentLeavesView';
import { TuitionBrandingView } from '../components/TuitionBrandingView';
import { LoadError } from '../components/LoadError';
import { AuthModal } from '../components/AuthModal';
import { AuthWelcomeScreen } from '../components/AuthWelcomeScreen';
import { teacherApi, getAuthToken, clearAuthToken } from '../lib/api';
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
} from '@padhai-pilot/shared';
import { Loader2 } from 'lucide-react';
import { MotionProvider, ToastProvider } from '@padhai-pilot/ui';

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
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
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

  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  const [loadErrors, setLoadErrors] = useState<Partial<Record<ResourceKey, string>>>({});

  const loadResource = useCallback(async (key: ResourceKey) => {
    try {
      switch (key) {
        case 'dashboard': setMetrics(await teacherApi.getDashboard()); break;
        case 'batches': {
          const list = await teacherApi.getBatches();
          setBatches(list);
          setSelectedBatchId((cur) => (cur && list.some((b) => b.id === cur) ? cur : list[0]?.id ?? ''));
          if (list.length > 0) {
            const rosterRes = await teacherApi.getBatchRoster(list[0].id);
            setStudents(rosterRes.students);
          } else {
            setStudents([]);
          }
          break;
        }
        case 'invitations': setInvitations(await teacherApi.getInvitations()); break;
        case 'assignments': setAssignments(await teacherApi.getAssignments()); break;
        case 'tests': setTests(await teacherApi.getTests()); break;
        case 'lessonPlans': setLessonPlans(await teacherApi.getLessonPlans()); break;
        case 'timetable': setTimetable(await teacherApi.getTimetable()); break;
        case 'announcements': setAnnouncements(await teacherApi.getAnnouncements()); break;
        case 'reports': setReports(await teacherApi.getReports()); break;
        case 'analytics': setAnalytics(await teacherApi.getAnalytics()); break;
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
    await Promise.all(ALL_RESOURCES.map((k) => loadResource(k)));
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
        const auth = await teacherApi.getCurrentUser();
        if (auth && auth.user) {
          setUser(auth.user);
          await loadUserData();
        } else {
          clearAuthToken();
          setUser(null);
          setShowAuthModal(true);
        }
      } catch (err) {
        console.warn('Session verification failed, prompting login:', err);
        clearAuthToken();
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
    setBatches((prev) => [...prev, newBatch]);
    setSelectedBatchId(newBatch.id);
  };

  const handleSaveAttendance = async (data: {
    batchId: string;
    date: string;
    records: { studentId: string; status: any; note?: string }[];
  }) => {
    await teacherApi.saveAttendance(data);
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
    setAnnouncements((prev) => [newAnn, ...prev]);
  };

  const handleQuickAttendance = (batchId: string) => {
    setSelectedBatchId(batchId);
    setCurrentTab('attendance');
  };

  const handleLogout = async () => {
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
      <div className="min-h-screen ak-desk-surface flex flex-col items-center justify-center text-[var(--ink-primary)]">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--brand-electric)]" />
          <span className="font-['Playfair_Display'] text-xl font-bold">
            PadhaiPilot <span className="text-sm font-['Raleway'] font-normal text-[var(--ink-muted)]">Faculty Studio</span>
          </span>
        </div>
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
    <div className="min-h-screen ak-desk-surface flex relative text-[var(--ink-primary)]">
      {/* Primary Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        teacherName={user?.fullName}
        instituteName={user?.instituteName}
        userRole={user?.role}
        onOpenAuthModal={() => setShowAuthModal(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 min-w-0 p-6 md:p-10 overflow-y-auto">
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
            />
          )}

          {currentTab === 'teachingDiary' && (
            <DailyTeachingDiaryView
              batches={batches}
              teacherName={user?.fullName}
              instituteName={user?.instituteName}
            />
          )}

          {currentTab === 'studyMaterials' && (
            <StudyMaterialView
              batches={batches}
              teacherName={user?.fullName}
            />
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
        <TeacherApp />
      </ToastProvider>
    </MotionProvider>
  );
}
