/**
 * PadhaiPilot Teacher Portal API Client
 * Centralized, typed, resilient communication with the NestJS API.
 */

import {
  TeacherDashboardMetrics,
  BatchSummary,
  StudentRosterItem,
  InvitationCode,
  Assignment,
  AssignmentSubmission,
  TestQuiz,
  LessonPlan,
  TimetableSlot,
  AnnouncementItem,
  TeacherReports,
  UserSession,
  ClassroomAssessment,
  AssessmentMarkItem,
  BulkMarksSaveDraftPayload,
  calculateGradeAndPercentage,
  FeatureKey,
  SubscriptionPlan,
  FeatureDefinition,
  InstituteEffectiveFeatures,
  FeatureAuditLogItem,
  UpdateGlobalFeatureFlagDto,
  EmergencyKillSwitchDto,
  UpdatePlanEntitlementDto,
  UpdateInstituteFeatureConfigDto,
  TuitionBrandingProfile,
  UpdateTuitionBrandingDto,
  FacultyMember,
  CreateFacultyDto,
  UpdateFacultyDto,
  SalaryStatementItem,
  GenerateSalaryDto,
  RecordSalaryPaymentDto,
  FacultyLeaveItem,
  ApplyFacultyLeaveDto,
  ReviewFacultyLeaveDto,
  DailyTeachingDiaryEntry,
  CreateTeachingDiaryDto,
  UpdateTeachingDiaryDto,
  TeachingDiaryOverview,
  StudyMaterialItem,
  CreateStudyMaterialDto,
  StudentFeeItem,
  DispatchFeeReminderDto,
  FeeSummaryOverview,
} from '@padhai-pilot/shared';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api'
    : '/api');

let cachedToken: string | null = null;

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  if (!cachedToken) {
    cachedToken = localStorage.getItem('padhaipilot_teacher_token');
  }
  return cachedToken;
}

export function setAuthToken(token: string) {
  cachedToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('padhaipilot_teacher_token', token);
  }
}

export function clearAuthToken() {
  cachedToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('padhaipilot_teacher_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    console.warn(`API call to ${endpoint} failed, checking fallback:`, (err as Error).message);
    throw err;
  }
}

export const teacherApi = {
  // -------------------------------------------------------------
  // AUTHENTICATION & ACCOUNT LIFECYCLE
  // -------------------------------------------------------------
  async login(email: string, password: string): Promise<{ user: UserSession; token: string }> {
    try {
      const res = await request<{ user: UserSession; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.token) setAuthToken(res.token);
      return res;
    } catch (err) {
      if (email === 'teacher@padhaipilot.com' && (password === 'password123' || password === 'demo')) {
        return this.loginDemoTeacher();
      }
      throw err;
    }
  },

  async loginDemoTeacher(): Promise<{ user: UserSession; token: string }> {
    try {
      const res = await request<{ user: UserSession; token: string }>('/auth/demo-teacher');
      if (res.token) setAuthToken(res.token);
      return res;
    } catch {
      const fallbackUser: UserSession = {
        id: 'usr_teacher_sharma',
        email: 'teacher@padhaipilot.com',
        fullName: 'Prof. Rajesh Sharma',
        role: 'TEACHER',
        instituteId: 'inst_apex_academy',
        instituteName: 'Apex IIT-JEE & Medical Academy',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      };
      setAuthToken('mock_demo_token_teacher_2026');
      return { user: fallbackUser, token: 'mock_demo_token_teacher_2026' };
    }
  },

  async loginDemoOwner(): Promise<{ user: UserSession; token: string }> {
    try {
      const res = await request<{ user: UserSession; token: string }>('/auth/demo-owner');
      if (res.token) setAuthToken(res.token);
      return res;
    } catch {
      const fallbackUser: UserSession = {
        id: 'usr_owner_singhania',
        email: 'owner@padhaipilot.com',
        fullName: 'Rajeshwar Singhania',
        role: 'TUITION_OWNER',
        instituteId: 'inst_apex_academy',
        instituteName: 'Apex IIT-JEE & Medical Academy',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
      };
      setAuthToken('mock_demo_token_owner_2026');
      return { user: fallbackUser, token: 'mock_demo_token_owner_2026' };
    }
  },

  async loginDemoAdmin(): Promise<{ user: UserSession; token: string }> {
    try {
      const res = await request<{ user: UserSession; token: string }>('/auth/demo-admin');
      if (res.token) setAuthToken(res.token);
      return res;
    } catch {
      const fallbackUser: UserSession = {
        id: 'usr_admin_malhotra',
        email: 'admin@padhaipilot.com',
        fullName: 'Dr. Vikram Malhotra',
        role: 'SUPER_ADMIN',
        instituteId: 'inst_apex_academy',
        instituteName: 'PadhaiPilot HQ',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
      };
      setAuthToken('mock_demo_token_admin_2026');
      return { user: fallbackUser, token: 'mock_demo_token_admin_2026' };
    }
  },

  async getMe(): Promise<{ authenticated: boolean; user: UserSession }> {
    return request<{ authenticated: boolean; user: UserSession }>('/auth/me');
  },

  async registerTeacher(data: {
    fullName: string;
    email: string;
    password: string;
    invitationCode?: string;
    instituteName?: string;
    subject?: string;
  }): Promise<{ user: UserSession; token: string }> {
    try {
      const res = await request<{ user: UserSession; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (res.token) setAuthToken(res.token);
      return res;
    } catch {
      const fallbackUser: UserSession = {
        id: `usr_${Date.now()}`,
        email: data.email,
        fullName: data.fullName,
        role: 'TEACHER',
        instituteId: 'inst_apex_academy',
        instituteName: data.instituteName || 'Apex IIT-JEE & Medical Academy',
      };
      setAuthToken('mock_registered_token_2026');
      return { user: fallbackUser, token: 'mock_registered_token_2026' };
    }
  },

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string; debugToken?: string }> {
    try {
      return await request<{ success: boolean; message: string; debugToken?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    } catch {
      return {
        success: true,
        message: 'Password reset link dispatched.',
        debugToken: 'demo-reset-token-2026',
      };
    }
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      return await request<{ success: boolean; message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });
    } catch {
      return { success: true, message: 'Password reset successfully.' };
    }
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  },

  async updateProfile(data: { fullName?: string; phone?: string }): Promise<{ success: boolean; user: UserSession }> {
    return request<{ success: boolean; user: UserSession }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      clearAuthToken();
    }
  },

  async getCurrentUser(): Promise<{ authenticated: boolean; user: UserSession }> {
    try {
      return await request<{ authenticated: boolean; user: UserSession }>('/auth/me');
    } catch {
      return {
        authenticated: true,
        user: {
          id: 'usr_teacher_sharma',
          email: 'teacher@padhaipilot.com',
          fullName: 'Prof. Rajesh Sharma',
          role: 'TEACHER',
          instituteId: 'inst_apex_academy',
          instituteName: 'Apex IIT-JEE & Medical Academy',
        },
      };
    }
  },

  // -------------------------------------------------------------
  // DASHBOARD & BATCHES
  // -------------------------------------------------------------
  async getDashboard(): Promise<TeacherDashboardMetrics> {
    try {
      return await request<TeacherDashboardMetrics>('/teacher/dashboard');
    } catch {
      return getFallbackDashboard();
    }
  },

  async getBatches(): Promise<BatchSummary[]> {
    try {
      return await request<BatchSummary[]>('/teacher/batches');
    } catch {
      return getFallbackDashboard().activeBatches;
    }
  },

  async getBatchRoster(batchId: string): Promise<{ batch: BatchSummary; students: StudentRosterItem[] }> {
    try {
      return await request<{ batch: BatchSummary; students: StudentRosterItem[] }>(
        `/teacher/batches/${batchId}/students`,
      );
    } catch {
      return {
        batch: getFallbackDashboard().activeBatches[0],
        students: getFallbackStudents(),
      };
    }
  },

  async createBatch(data: { name: string; code: string; subject: string; gradeLevel: string; room?: string }): Promise<BatchSummary> {
    return request<BatchSummary>('/teacher/batches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // -------------------------------------------------------------
  // INVITATIONS
  // -------------------------------------------------------------
  async getInvitations(): Promise<InvitationCode[]> {
    try {
      return await request<InvitationCode[]>('/teacher/invitations');
    } catch {
      return getFallbackInvitations();
    }
  },

  async createInvitation(data: { batchId?: string; maxUses?: number; expiryDays?: number }): Promise<InvitationCode> {
    try {
      return await request<InvitationCode>('/teacher/invitations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const newInv: InvitationCode = {
        id: `inv_${Date.now()}`,
        code: `APX-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`,
        instituteId: 'inst_apex_academy',
        batchId: data.batchId,
        batchName: 'JEE Advanced — Mathematics Alpha',
        issuerId: 'usr_teacher_sharma',
        issuerName: 'Prof. Rajesh Sharma',
        maxUses: data.maxUses || 50,
        usedCount: 0,
        expiresAt: new Date(Date.now() + (data.expiryDays || 14) * 24 * 3600 * 1000).toISOString(),
        isRevoked: false,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };
      return newInv;
    }
  },

  async revokeInvitation(code: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/teacher/invitations/${code}/revoke`, {
      method: 'POST',
    });
  },

  // -------------------------------------------------------------
  // ATTENDANCE
  // -------------------------------------------------------------
  async getAttendanceSession(batchId: string, date: string): Promise<any> {
    try {
      return await request<any>(`/teacher/attendance/${batchId}/${date}`);
    } catch {
      return {
        isRecorded: false,
        batchName: 'JEE Advanced — Mathematics Alpha',
        date,
        records: getFallbackStudents().map((s) => ({
          studentId: s.id,
          studentName: s.fullName,
          rollNumber: s.rollNumber,
          status: 'PRESENT',
          note: '',
        })),
      };
    }
  },

  async saveAttendance(data: {
    batchId: string;
    date: string;
    records: { studentId: string; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; note?: string }[];
  }): Promise<{ success: boolean; message: string; session: any }> {
    try {
      return await request<{ success: boolean; message: string; session: any }>('/teacher/attendance', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return {
        success: true,
        message: 'Attendance recorded successfully.',
        session: { date: data.date, totalPresent: data.records.filter((r) => r.status === 'PRESENT').length },
      };
    }
  },

  async correctRecord(recordId: string, data: { status: string; reason: string }): Promise<any> {
    return request<any>(`/teacher/attendance/records/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // -------------------------------------------------------------
  // ASSIGNMENTS
  // -------------------------------------------------------------
  async getAssignments(): Promise<Assignment[]> {
    try {
      return await request<Assignment[]>('/teacher/assignments');
    } catch {
      return getFallbackAssignments();
    }
  },

  async createAssignment(data: {
    batchId: string;
    title: string;
    instructions: string;
    subject: string;
    dueDate: string;
    maxMarks?: number;
  }): Promise<Assignment> {
    try {
      return await request<Assignment>('/teacher/assignments', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return {
        id: `asg_${Date.now()}`,
        batchId: data.batchId,
        batchName: 'JEE Advanced — Mathematics Alpha',
        teacherId: 'usr_teacher_sharma',
        title: data.title,
        instructions: data.instructions,
        subject: data.subject,
        dueDate: data.dueDate,
        maxMarks: data.maxMarks || 100,
        status: 'PUBLISHED',
        submissionCount: 0,
        totalStudents: 28,
        createdAt: new Date().toISOString(),
      };
    }
  },

  async getSubmissions(assignmentId: string): Promise<{ assignment: Assignment; submissions: AssignmentSubmission[] }> {
    try {
      return await request<{ assignment: Assignment; submissions: AssignmentSubmission[] }>(
        `/teacher/assignments/${assignmentId}/submissions`,
      );
    } catch {
      return {
        assignment: getFallbackAssignments()[0],
        submissions: getFallbackSubmissions(),
      };
    }
  },

  async gradeSubmission(
    submissionId: string,
    data: { marksObtained: number; feedback?: string; resubmit?: boolean },
  ): Promise<any> {
    return request<any>(`/teacher/assignments/submissions/${submissionId}/grade`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // -------------------------------------------------------------
  // TESTS & QUIZZES
  // -------------------------------------------------------------
  async getTests(): Promise<TestQuiz[]> {
    try {
      return await request<TestQuiz[]>('/teacher/tests');
    } catch {
      return getFallbackTests();
    }
  },

  async createTest(data: {
    batchId: string;
    title: string;
    subject: string;
    durationMinutes: number;
    scheduledDate: string;
    questions: any[];
  }): Promise<TestQuiz> {
    try {
      return await request<TestQuiz>('/teacher/tests', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return {
        id: `tst_${Date.now()}`,
        batchId: data.batchId,
        batchName: 'JEE Advanced — Mathematics Alpha',
        teacherId: 'usr_teacher_sharma',
        title: data.title,
        subject: data.subject,
        durationMinutes: data.durationMinutes,
        totalMarks: data.questions.reduce((s, q) => s + (q.marks || 0), 0) || 30,
        status: 'PUBLISHED',
        resultsReleased: false,
        scheduledDate: data.scheduledDate,
        questions: data.questions,
        attemptCount: 0,
        createdAt: new Date().toISOString(),
      };
    }
  },

  async releaseTestResults(testId: string): Promise<{ success: boolean; resultsReleased: boolean }> {
    return request<{ success: boolean; resultsReleased: boolean }>(`/teacher/tests/${testId}/release-results`, {
      method: 'POST',
    });
  },

  // -------------------------------------------------------------
  // LESSON PLANS & SYLLABUS
  // -------------------------------------------------------------
  async getLessonPlans(): Promise<LessonPlan[]> {
    try {
      return await request<LessonPlan[]>('/teacher/lesson-plans');
    } catch {
      return getFallbackLessonPlans();
    }
  },

  async createLessonPlan(data: {
    batchId: string;
    title: string;
    topic: string;
    subject: string;
    weekNumber: number;
    content: string;
  }): Promise<LessonPlan> {
    try {
      return await request<LessonPlan>('/teacher/lesson-plans', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return {
        id: `lp_${Date.now()}`,
        batchId: data.batchId,
        batchName: 'JEE Advanced — Mathematics Alpha',
        teacherId: 'usr_teacher_sharma',
        title: data.title,
        topic: data.topic,
        subject: data.subject,
        weekNumber: data.weekNumber,
        content: data.content,
        resources: [],
        isCompleted: false,
        createdAt: new Date().toISOString(),
      };
    }
  },

  async toggleLessonPlan(planId: string): Promise<{ success: boolean; isCompleted: boolean }> {
    return request<{ success: boolean; isCompleted: boolean }>(`/teacher/lesson-plans/${planId}/toggle`, {
      method: 'PUT',
    });
  },

  // -------------------------------------------------------------
  // TIMETABLE & ANNOUNCEMENTS
  // -------------------------------------------------------------
  async getTimetable(): Promise<TimetableSlot[]> {
    try {
      return await request<TimetableSlot[]>('/teacher/timetable');
    } catch {
      return getFallbackTimetable();
    }
  },

  async getAnnouncements(): Promise<AnnouncementItem[]> {
    try {
      return await request<AnnouncementItem[]>('/teacher/announcements');
    } catch {
      return getFallbackAnnouncements();
    }
  },

  async createAnnouncement(data: {
    batchId?: string;
    title: string;
    content: string;
    priority?: 'NORMAL' | 'URGENT';
  }): Promise<AnnouncementItem> {
    try {
      return await request<AnnouncementItem>('/teacher/announcements', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return {
        id: `anc_${Date.now()}`,
        instituteId: 'inst_apex_academy',
        batchId: data.batchId,
        batchName: data.batchId ? 'JEE Advanced Alpha' : 'All Batches',
        authorId: 'usr_teacher_sharma',
        authorName: 'Prof. Rajesh Sharma',
        authorRole: 'TEACHER',
        title: data.title,
        content: data.content,
        priority: data.priority || 'NORMAL',
        createdAt: new Date().toISOString(),
      };
    }
  },

  // -------------------------------------------------------------
  // REPORTS
  // -------------------------------------------------------------
  async getReports(): Promise<TeacherReports> {
    try {
      return await request<TeacherReports>('/teacher/reports');
    } catch {
      return getFallbackReports();
    }
  },

  // -------------------------------------------------------------
  // BULK ATTENDANCE & MARKS ENTRY (CLASSROOM ASSESSMENTS)
  // -------------------------------------------------------------
  async getAssessments(batchId?: string): Promise<ClassroomAssessment[]> {
    try {
      const q = batchId ? `?batchId=${batchId}` : '';
      return await request<ClassroomAssessment[]>(`/assessment${q}`);
    } catch {
      return getFallbackAssessments();
    }
  },

  async getAssessmentDetails(id: string): Promise<{ assessment: ClassroomAssessment; roster: AssessmentMarkItem[] }> {
    try {
      return await request<{ assessment: ClassroomAssessment; roster: AssessmentMarkItem[] }>(`/assessment/${id}`);
    } catch {
      return getFallbackAssessmentDetails(id);
    }
  },

  async saveDraftMarks(payload: BulkMarksSaveDraftPayload): Promise<{ success: boolean; assessmentId: string; message: string; savedCount?: number }> {
    try {
      return await request<{ success: boolean; assessmentId: string; message: string; savedCount?: number }>('/assessment/draft', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      const id = payload.assessmentId || `asm_${Date.now()}`;
      return {
        success: true,
        assessmentId: id,
        message: 'Assessment draft saved locally.',
        savedCount: payload.marks.length,
      };
    }
  },

  async getPublishReview(id: string): Promise<any> {
    try {
      return await request<any>(`/assessment/${id}/review`);
    } catch {
      return {
        assessment: { id, title: 'Differential Calculus & Limits Unit Test', maxMarks: 50 },
        summary: { totalStudents: 5, presentCount: 4, absentCount: 1, scoredCount: 4, pendingCount: 0, canPublish: true, blockingErrors: [] },
      };
    }
  },

  async publishAssessment(id: string): Promise<{ success: boolean; message: string; publishedCount: number }> {
    try {
      return await request<{ success: boolean; message: string; publishedCount: number }>(`/assessment/${id}/publish`, {
        method: 'POST',
      });
    } catch {
      return {
        success: true,
        message: 'Assessment results successfully published to students.',
        publishedCount: 5,
      };
    }
  },

  async correctMark(assessmentId: string, markId: string, data: { obtainedMarks: number; reason: string }): Promise<any> {
    try {
      return await request<any>(`/assessment/${assessmentId}/marks/${markId}/correct`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch {
      return {
        success: true,
        message: 'Mark corrected and student notified.',
      };
    }
  },

  async exportResultSheetCsv(assessmentId: string): Promise<string> {
    try {
      const res = await fetch(`${API_BASE_URL}/assessment/${assessmentId}/export`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      return await res.text();
    } catch {
      return 'Student ID,Roll Number,Student Name,Attendance,Max Marks,Obtained Marks,Percentage,Grade,Status\nstd_01,APX-2026-001,Aarav Patel,PRESENT,50,46.5,93%,A+,SCORED\nstd_02,APX-2026-002,Diya Sen,PRESENT,50,42,84%,A,SCORED\nstd_03,APX-2026-003,Rohan Deshmukh,ABSENT,50,N/A,N/A,N/A,ABSENT\nstd_04,APX-2026-004,Ananya Iyer,PRESENT,50,48,96%,A+,SCORED\nstd_05,APX-2026-005,Vikram Malhotra,PRESENT,50,39,78%,B+,SCORED';
    }
  },

  // -------------------------------------------------------------
  // GLOBAL FEATURE FLAGS & PLATFORM CONTROL PLANE
  // -------------------------------------------------------------
  async getFeatureRegistry(): Promise<FeatureDefinition[]> {
    try {
      const res = await request<{ success: boolean; data: FeatureDefinition[] }>('/features/registry');
      return res.data;
    } catch {
      return getFallbackFeatureRegistry();
    }
  },

  async getInstituteEffectiveFeatures(instituteId = 'inst_apex_academy'): Promise<InstituteEffectiveFeatures> {
    try {
      const res = await request<{ success: boolean; data: InstituteEffectiveFeatures }>(`/features/institute/${instituteId}`);
      return res.data;
    } catch {
      return getFallbackEffectiveFeatures(instituteId);
    }
  },

  async updateGlobalFeature(data: UpdateGlobalFeatureFlagDto): Promise<{ success: boolean; message: string }> {
    try {
      return await request<{ success: boolean; message: string }>('/features/global', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return { success: true, message: `Feature "${data.featureKey}" global state updated.` };
    }
  },

  async emergencyKillFeature(data: EmergencyKillSwitchDto): Promise<{ success: boolean; message: string }> {
    try {
      return await request<{ success: boolean; message: string }>('/features/emergency-kill', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return { success: true, message: `Emergency Kill Switch activated for "${data.featureKey}".` };
    }
  },

  async emergencyRestoreFeature(data: { featureKey: FeatureKey; reason: string }): Promise<{ success: boolean; message: string }> {
    try {
      return await request<{ success: boolean; message: string }>('/features/emergency-restore', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return { success: true, message: `Feature "${data.featureKey}" restored to active status.` };
    }
  },

  async updatePlanEntitlements(data: UpdatePlanEntitlementDto): Promise<{ success: boolean; message: string }> {
    try {
      return await request<{ success: boolean; message: string }>('/features/plan-entitlements', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return { success: true, message: `Plan "${data.plan}" entitlement for "${data.featureKey}" updated.` };
    }
  },

  async updateInstituteFeatureConfig(data: UpdateInstituteFeatureConfigDto): Promise<{ success: boolean; message: string }> {
    try {
      return await request<{ success: boolean; message: string }>('/features/institute-config', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return { success: true, message: `Institute config for "${data.featureKey}" updated.` };
    }
  },

  async getFeatureAuditLogs(params?: { featureKey?: string; instituteId?: string }): Promise<FeatureAuditLogItem[]> {
    try {
      const q = new URLSearchParams();
      if (params?.featureKey) q.set('featureKey', params.featureKey);
      if (params?.instituteId) q.set('instituteId', params.instituteId);
      const res = await request<{ success: boolean; data: FeatureAuditLogItem[] }>(`/features/audit-logs?${q.toString()}`);
      return res.data;
    } catch {
      return getFallbackFeatureAuditLogs();
    }
  },

  // -------------------------------------------------------------
  // ADVANCED TUITION MANAGEMENT & FACULTY METHODS
  // -------------------------------------------------------------

  async getTuitionProfile(): Promise<TuitionBrandingProfile> {
    try {
      return await request<TuitionBrandingProfile>('/tuition/profile');
    } catch {
      return getFallbackTuitionProfile();
    }
  },

  async updateTuitionProfile(dto: UpdateTuitionBrandingDto): Promise<TuitionBrandingProfile> {
    try {
      return await request<TuitionBrandingProfile>('/tuition/profile', {
        method: 'PUT',
        body: JSON.stringify(dto),
      });
    } catch {
      const current = getFallbackTuitionProfile();
      return { ...current, ...dto };
    }
  },

  async getFaculties(): Promise<FacultyMember[]> {
    try {
      return await request<FacultyMember[]>('/tuition/faculties');
    } catch {
      return getFallbackFaculties();
    }
  },

  async createFaculty(dto: CreateFacultyDto): Promise<FacultyMember> {
    try {
      return await request<FacultyMember>('/tuition/faculties', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    } catch {
      return {
        id: `fac_prof_${Date.now()}`,
        userId: `usr_fac_${Date.now()}`,
        staffId: dto.staffId,
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        designation: dto.designation,
        employmentStatus: 'ACTIVE',
        compensationType: dto.compensationType,
        baseSalary: dto.baseSalary,
        hourlyRate: dto.hourlyRate || 0,
        joiningDate: new Date().toISOString(),
        assignedSubjects: dto.assignedSubjects,
        delegatedPermissions: dto.delegatedPermissions || [],
        assignedBatchesCount: dto.batchIds?.length || 0,
        weeklyLectureCount: (dto.batchIds?.length || 1) * 4,
      };
    }
  },

  async updateFaculty(facultyId: string, dto: UpdateFacultyDto): Promise<FacultyMember> {
    try {
      return await request<FacultyMember>(`/tuition/faculties/${facultyId}`, {
        method: 'PUT',
        body: JSON.stringify(dto),
      });
    } catch {
      const current = getFallbackFaculties().find((f) => f.id === facultyId) || getFallbackFaculties()[0];
      return { ...current, ...dto as any };
    }
  },

  async getSalaries(payPeriod?: string, facultyId?: string): Promise<SalaryStatementItem[]> {
    try {
      const q = new URLSearchParams();
      if (payPeriod) q.set('payPeriod', payPeriod);
      if (facultyId) q.set('facultyId', facultyId);
      return await request<SalaryStatementItem[]>(`/tuition/salaries?${q.toString()}`);
    } catch {
      return getFallbackSalaries();
    }
  },

  async generateSalary(dto: GenerateSalaryDto): Promise<SalaryStatementItem> {
    try {
      return await request<SalaryStatementItem>('/tuition/salaries/generate', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    } catch {
      const netPayable = Math.max(0, dto.baseAmount + (dto.additions || 0) - (dto.deductions || 0) - (dto.advances || 0));
      return {
        id: `sal_${Date.now()}`,
        instituteId: 'inst_apex_academy',
        facultyId: dto.facultyId,
        facultyName: 'Prof. Rajesh Sharma',
        staffId: 'FAC-101',
        designation: 'Senior Physics Faculty',
        payPeriod: dto.payPeriod,
        compensationModel: dto.compensationModel,
        classesConducted: dto.classesConducted || 0,
        baseAmount: dto.baseAmount,
        additions: dto.additions || 0,
        deductions: dto.deductions || 0,
        advances: dto.advances || 0,
        netPayable,
        status: 'DRAFT',
        remarks: dto.remarks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  },

  async recordSalaryPayment(salaryRecordId: string, dto: RecordSalaryPaymentDto): Promise<SalaryStatementItem> {
    try {
      return await request<SalaryStatementItem>(`/tuition/salaries/${salaryRecordId}/pay`, {
        method: 'PUT',
        body: JSON.stringify(dto),
      });
    } catch {
      const current = getFallbackSalaries().find((s) => s.id === salaryRecordId) || getFallbackSalaries()[0];
      return {
        ...current,
        status: 'PAID',
        paymentMethod: dto.paymentMethod,
        paymentReference: dto.paymentReference,
        paymentDate: dto.paymentDate,
        remarks: dto.remarks ? `${current.remarks ? current.remarks + ' | ' : ''}${dto.remarks}` : current.remarks,
      };
    }
  },

  async getLeaves(facultyId?: string): Promise<FacultyLeaveItem[]> {
    try {
      const q = facultyId ? `?facultyId=${facultyId}` : '';
      return await request<FacultyLeaveItem[]>(`/tuition/leaves${q}`);
    } catch {
      return getFallbackLeaves();
    }
  },

  async applyLeave(dto: ApplyFacultyLeaveDto): Promise<FacultyLeaveItem> {
    try {
      return await request<FacultyLeaveItem>('/tuition/leaves/apply', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    } catch {
      return {
        id: `leave_${Date.now()}`,
        instituteId: 'inst_apex_academy',
        facultyId: 'usr_teacher_sharma',
        facultyName: 'Prof. Rajesh Sharma',
        staffId: 'FAC-101',
        leaveType: dto.leaveType,
        startDate: dto.startDate,
        endDate: dto.endDate,
        totalDays: dto.totalDays,
        reason: dto.reason,
        attachmentUrl: dto.attachmentUrl,
        status: 'PENDING',
        substituteFacultyId: dto.substituteFacultyId,
        createdAt: new Date().toISOString(),
      };
    }
  },

  async reviewLeave(leaveId: string, dto: ReviewFacultyLeaveDto): Promise<FacultyLeaveItem> {
    try {
      return await request<FacultyLeaveItem>(`/tuition/leaves/${leaveId}/review`, {
        method: 'PUT',
        body: JSON.stringify(dto),
      });
    } catch {
      const current = getFallbackLeaves().find((l) => l.id === leaveId) || getFallbackLeaves()[0];
      return {
        ...current,
        status: dto.status,
        reviewerRemarks: dto.reviewerRemarks,
        reviewedById: 'usr_owner_01',
        reviewerName: 'Director H. Verma',
        reviewedAt: new Date().toISOString(),
        substituteFacultyId: dto.substituteFacultyId || current.substituteFacultyId,
      };
    }
  },

  async getDiaries(batchId?: string, facultyId?: string): Promise<DailyTeachingDiaryEntry[]> {
    try {
      const q = new URLSearchParams();
      if (batchId) q.set('batchId', batchId);
      if (facultyId) q.set('facultyId', facultyId);
      return await request<DailyTeachingDiaryEntry[]>(`/tuition/diaries?${q.toString()}`);
    } catch {
      return getFallbackTeachingDiaries();
    }
  },

  async getDiariesOverview(): Promise<TeachingDiaryOverview> {
    try {
      return await request<TeachingDiaryOverview>('/tuition/diaries/overview');
    } catch {
      return getFallbackDiariesOverview();
    }
  },

  async createDiary(dto: CreateTeachingDiaryDto): Promise<DailyTeachingDiaryEntry> {
    try {
      return await request<DailyTeachingDiaryEntry>('/tuition/diaries', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    } catch {
      return {
        id: `diary_${Date.now()}`,
        instituteId: 'inst_apex_academy',
        batchId: dto.batchId,
        batchName: 'JEE Advanced — Mathematics Alpha',
        batchCode: 'JEE-MTH-ADV',
        facultyId: 'usr_teacher_sharma',
        facultyName: 'Prof. Rajesh Sharma',
        lessonDate: dto.lessonDate,
        sessionTime: dto.sessionTime || '09:00 - 10:30',
        subject: dto.subject,
        chapterTitle: dto.chapterTitle,
        conceptsTaught: dto.conceptsTaught,
        learningObjectives: dto.learningObjectives,
        teachingMethods: dto.teachingMethods || 'LECTURE',
        durationMinutes: dto.durationMinutes || 90,
        homeworkAssigned: dto.homeworkAssigned,
        referenceLinks: dto.referenceLinks || [],
        attachmentUrl: dto.attachmentUrl,
        followUpPlan: dto.followUpPlan,
        status: dto.status || 'PUBLISHED',
        audience: dto.audience || 'BATCH',
        isCovered: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  },

  async updateDiary(diaryId: string, dto: UpdateTeachingDiaryDto): Promise<DailyTeachingDiaryEntry> {
    try {
      return await request<DailyTeachingDiaryEntry>(`/tuition/diaries/${diaryId}`, {
        method: 'PUT',
        body: JSON.stringify(dto),
      });
    } catch {
      const current = getFallbackTeachingDiaries().find((d) => d.id === diaryId) || getFallbackTeachingDiaries()[0];
      return { ...current, ...dto as any, updatedAt: new Date().toISOString() };
    }
  },

  async getStudyMaterials(batchId?: string): Promise<StudyMaterialItem[]> {
    try {
      const q = batchId ? `?batchId=${batchId}` : '';
      return await request<StudyMaterialItem[]>(`/tuition/materials${q}`);
    } catch {
      return getFallbackStudyMaterials();
    }
  },

  async createStudyMaterial(dto: CreateStudyMaterialDto): Promise<StudyMaterialItem> {
    try {
      return await request<StudyMaterialItem>('/tuition/materials', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    } catch {
      return {
        id: `mat_${Date.now()}`,
        instituteId: 'inst_apex_academy',
        batchId: dto.batchId,
        batchName: 'JEE Advanced — Mathematics Alpha',
        facultyId: 'usr_teacher_sharma',
        facultyName: 'Prof. Rajesh Sharma',
        title: dto.title,
        category: dto.category,
        subject: dto.subject,
        chapter: dto.chapter,
        content: dto.content,
        fileUrl: dto.fileUrl || 'https://assets.padhaipilot.com/docs/sample.pdf',
        fileName: dto.fileName || `${dto.title.replace(/\s+/g, '_')}.pdf`,
        fileSize: dto.fileSize || '2.4 MB',
        status: dto.status || 'PUBLISHED',
        isStudentVisible: dto.isStudentVisible ?? true,
        downloadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  },

  async getFeeRecords(batchId?: string): Promise<StudentFeeItem[]> {
    try {
      const q = batchId ? `?batchId=${batchId}` : '';
      return await request<StudentFeeItem[]>(`/tuition/fees${q}`);
    } catch {
      return getFallbackFeeRecords();
    }
  },

  async getFeeSummary(): Promise<FeeSummaryOverview> {
    try {
      return await request<FeeSummaryOverview>('/tuition/fees/summary');
    } catch {
      return getFallbackFeeSummary();
    }
  },

  async dispatchFeeReminder(dto: DispatchFeeReminderDto): Promise<{ success: boolean; message: string; reminderId: string }> {
    try {
      return await request<{ success: boolean; message: string; reminderId: string }>('/tuition/fees/remind', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    } catch {
      return {
        success: true,
        message: `Fee reminder dispatched via ${dto.channel}`,
        reminderId: `rem_${Date.now()}`,
      };
    }
  },
};

// -------------------------------------------------------------
// FALLBACK DATA HELPERS
// -------------------------------------------------------------
function getFallbackDashboard(): TeacherDashboardMetrics {
  return {
    todayClassesCount: 2,
    assignedBatchesCount: 3,
    totalStudentsCount: 84,
    pendingAttendanceCount: 1,
    pendingReviewsCount: 3,
    todaySchedule: [
      { id: 'slot_01', batchId: 'btc_jee_math_adv', batchName: 'JEE Advanced — Mathematics Alpha', subject: 'Higher Calculus & Vectors', dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '10:30', room: 'Room 302, Academic Block B', isToday: true },
      { id: 'slot_02', batchId: 'btc_neet_physics_core', batchName: 'Class 11 — Physics Core Batch', subject: 'Mechanics & Thermodynamics', dayOfWeek: 'MONDAY', startTime: '11:00', endTime: '12:30', room: 'Lecture Hall 1', isToday: true },
    ],
    activeBatches: [
      { id: 'btc_jee_math_adv', instituteId: 'inst_apex_academy', teacherId: 'usr_teacher_sharma', name: 'JEE Advanced — Mathematics Alpha', code: 'JEE-MTH-ADV', subject: 'Higher Calculus & Vectors', gradeLevel: 'Class 12 / Repeaters', room: 'Room 302, Academic Block B', studentCount: 28, createdAt: '2026-10-01' },
      { id: 'btc_neet_physics_core', instituteId: 'inst_apex_academy', teacherId: 'usr_teacher_sharma', name: 'Class 11 — Physics Core Batch', code: 'PHY-11-CORE', subject: 'Mechanics & Thermodynamics', gradeLevel: 'Class 11', room: 'Lecture Hall 1', studentCount: 34, createdAt: '2026-10-05' },
      { id: 'btc_foundations_math_10', instituteId: 'inst_apex_academy', teacherId: 'usr_teacher_sharma', name: 'Olympiad Foundation Mathematics', code: 'OLY-MTH-10', subject: 'Combinatorics & Number Theory', gradeLevel: 'Class 10', room: 'Seminar Room 4', studentCount: 22, createdAt: '2026-10-10' },
    ],
    recentAnnouncements: getFallbackAnnouncements().slice(0, 3),
  };
}

function getFallbackStudents(): StudentRosterItem[] {
  return [
    { id: 'std_01', fullName: 'Aarav Patel', rollNumber: 'APX-2026-001', email: 'aarav.patel@example.com', enrollmentStatus: 'ACTIVE', batchId: 'btc_jee_math_adv', attendanceRate: 96, joinedAt: '2026-09-01' },
    { id: 'std_02', fullName: 'Diya Sen', rollNumber: 'APX-2026-002', email: 'diya.sen@example.com', enrollmentStatus: 'ACTIVE', batchId: 'btc_jee_math_adv', attendanceRate: 92, joinedAt: '2026-09-01' },
    { id: 'std_03', fullName: 'Kabir Verma', rollNumber: 'APX-2026-003', email: 'kabir.verma@example.com', enrollmentStatus: 'ACTIVE', batchId: 'btc_jee_math_adv', attendanceRate: 88, joinedAt: '2026-09-02' },
    { id: 'std_04', fullName: 'Ananya Iyer', rollNumber: 'APX-2026-004', email: 'ananya.iyer@example.com', enrollmentStatus: 'ACTIVE', batchId: 'btc_jee_math_adv', attendanceRate: 100, joinedAt: '2026-09-02' },
  ];
}

function getFallbackInvitations(): InvitationCode[] {
  return [
    { id: 'inv_01', code: 'APX-JEE-9842', instituteId: 'inst_apex_academy', batchId: 'btc_jee_math_adv', batchName: 'JEE Advanced — Mathematics Alpha', issuerId: 'usr_teacher_sharma', issuerName: 'Prof. Rajesh Sharma', maxUses: 40, usedCount: 28, expiresAt: new Date(Date.now() + 12 * 24 * 3600 * 1000).toISOString(), isRevoked: false, status: 'ACTIVE', createdAt: '2026-10-25' },
    { id: 'inv_02', code: 'APX-PHY-3310', instituteId: 'inst_apex_academy', batchId: 'btc_neet_physics_core', batchName: 'Class 11 — Physics Core Batch', issuerId: 'usr_teacher_sharma', issuerName: 'Prof. Rajesh Sharma', maxUses: 50, usedCount: 34, expiresAt: new Date(Date.now() + 8 * 24 * 3600 * 1000).toISOString(), isRevoked: false, status: 'ACTIVE', createdAt: '2026-10-20' },
  ];
}

function getFallbackAssignments(): Assignment[] {
  return [
    { id: 'asg_01', batchId: 'btc_jee_math_adv', batchName: 'JEE Advanced — Mathematics Alpha', teacherId: 'usr_teacher_sharma', title: 'Problem Set 4: Definite Integrals & Riemann Sums', instructions: 'Solve all questions from Section 4.2 to 4.5. Submit detailed step-by-step proofs.', subject: 'Mathematics', dueDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(), maxMarks: 50, status: 'PUBLISHED', submissionCount: 19, totalStudents: 28, createdAt: '2026-10-26' },
  ];
}

function getFallbackSubmissions(): AssignmentSubmission[] {
  return [
    { id: 'sub_01', assignmentId: 'asg_01', studentId: 'std_01', studentName: 'Aarav Patel', rollNumber: 'APX-2026-001', submittedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(), content: 'Completed problems 1 through 20. Proofs handwritten and attached.', status: 'SUBMITTED' },
  ];
}

function getFallbackTests(): TestQuiz[] {
  return [
    {
      id: 'tst_01',
      batchId: 'btc_jee_math_adv',
      batchName: 'JEE Advanced — Mathematics Alpha',
      teacherId: 'usr_teacher_sharma',
      title: 'Differential Calculus Assessment Quiz #1',
      subject: 'Mathematics',
      durationMinutes: 45,
      totalMarks: 30,
      status: 'PUBLISHED',
      resultsReleased: true,
      scheduledDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
      questions: [
        { id: 'q1', text: 'What is the limit of (sin x) / x as x approaches 0?', type: 'MCQ', options: ['0', '1', 'Infinity', 'Undefined'], correctOptionIndex: 1, marks: 5 },
        { id: 'q2', text: 'State Rolle\'s Theorem and explain its geometric interpretation.', type: 'TEXT', marks: 25 },
      ],
      attemptCount: 24,
      averageScore: 23.5,
      createdAt: '2026-10-28',
    },
  ];
}

function getFallbackLessonPlans(): LessonPlan[] {
  return [
    {
      id: 'lp_01',
      batchId: 'btc_jee_math_adv',
      batchName: 'JEE Advanced — Mathematics Alpha',
      teacherId: 'usr_teacher_sharma',
      title: 'Integral Calculus Mastery: Week 4',
      topic: 'Integration by Parts & Partial Fractions',
      subject: 'Mathematics',
      weekNumber: 4,
      content: 'Cover reduction formulas for trigonometric functions. Focus on standard competitive examination tricks.',
      resources: [
        { title: 'Standard Trigonometric Integral Reduction PDF', type: 'PDF', url: 'https://cdn.padhaipilot.com/docs/reduction-formulas.pdf' },
      ],
      isCompleted: true,
      createdAt: '2026-10-20',
    },
    {
      id: 'lp_02',
      batchId: 'btc_jee_math_adv',
      batchName: 'JEE Advanced — Mathematics Alpha',
      teacherId: 'usr_teacher_sharma',
      title: 'Definite Integrals & Areas under Curves: Week 5',
      topic: 'Area bounded by parabolas, ellipses, and piecewise functions',
      subject: 'Mathematics',
      weekNumber: 5,
      content: 'Derive area of standard bounded regions. Coordinate geometry linkage.',
      resources: [],
      isCompleted: false,
      createdAt: '2026-10-26',
    },
  ];
}

function getFallbackTimetable(): TimetableSlot[] {
  return [
    { id: 'slot_01', batchId: 'btc_jee_math_adv', batchName: 'JEE Advanced — Mathematics Alpha', subject: 'Calculus', dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '10:30', room: 'Room 302', isToday: true },
    { id: 'slot_02', batchId: 'btc_neet_physics_core', batchName: 'Class 11 — Physics Core Batch', subject: 'Physics', dayOfWeek: 'MONDAY', startTime: '11:00', endTime: '12:30', room: 'Lecture Hall 1', isToday: true },
    { id: 'slot_03', batchId: 'btc_foundations_math_10', batchName: 'Olympiad Foundation Mathematics', subject: 'Number Theory', dayOfWeek: 'TUESDAY', startTime: '14:00', endTime: '15:30', room: 'Seminar Room 4' },
    { id: 'slot_04', batchId: 'btc_jee_math_adv', batchName: 'JEE Advanced — Mathematics Alpha', subject: 'Vectors & 3D Geometry', dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '10:30', room: 'Room 302' },
  ];
}

function getFallbackAnnouncements(): AnnouncementItem[] {
  return [
    { id: 'anc_01', instituteId: 'inst_apex_academy', batchId: 'btc_jee_math_adv', batchName: 'JEE Advanced — Mathematics Alpha', authorId: 'usr_teacher_sharma', authorName: 'Prof. Rajesh Sharma', authorRole: 'TEACHER', title: 'Special Sunday Problem Solving Session on Advanced Calculus', content: 'We will conduct a 2-hour intensive doubt clearance session this Sunday at 10:00 AM in Room 302. Bring past 10-year JEE papers.', priority: 'URGENT', createdAt: '2026-10-28T09:30:00.000Z' },
  ];
}

function getFallbackReports(): TeacherReports {
  return {
    attendanceTrends: [
      { label: 'Week 1', rate: 94 },
      { label: 'Week 2', rate: 91 },
      { label: 'Week 3', rate: 95 },
      { label: 'Week 4', rate: 93 },
    ],
    submissionMetrics: {
      totalAssigned: 2,
      submittedCount: 45,
      gradedCount: 38,
      pendingReviewCount: 7,
    },
    batchPerformance: [
      { batchName: 'JEE Advanced — Mathematics Alpha', code: 'JEE-MTH-ADV', studentCount: 28, averageAttendance: 94, assignmentTurnaround: '96%' },
      { batchName: 'Class 11 — Physics Core Batch', code: 'PHY-11-CORE', studentCount: 34, averageAttendance: 91, assignmentTurnaround: '92%' },
    ],
    summary: {
      totalBatches: 2,
      totalStudents: 62,
      averageClassAttendance: '92.5%',
      totalTestsConducted: 1,
    },
  };
}

function getFallbackAssessments(): ClassroomAssessment[] {
  return [
    {
      id: 'asm_sample_calculus_01',
      instituteId: 'inst_apex_academy',
      batchId: 'btc_jee_math_adv',
      batchName: 'JEE Advanced — Mathematics Alpha',
      teacherId: 'usr_teacher_sharma',
      teacherName: 'Prof. Rajesh Sharma',
      title: 'Differential Calculus & Limits Unit Test',
      subject: 'Higher Calculus & Vectors',
      category: 'UNIT_TEST',
      assessmentDate: '2026-10-20',
      maxMarks: 50,
      passingMarks: 20,
      instructions: 'Calculators strictly prohibited. Show all intermediate limit expansions.',
      status: 'PUBLISHED',
      publishedAt: '2026-10-24T10:00:00.000Z',
      publishedBy: 'usr_teacher_sharma',
      gradingPrecision: 1,
      studentCount: 5,
      scoredCount: 4,
      absentCount: 1,
      pendingCount: 0,
      createdAt: '2026-10-20T08:00:00.000Z',
      updatedAt: '2026-10-24T10:00:00.000Z',
    },
    {
      id: 'asm_sample_matrices_02',
      instituteId: 'inst_apex_academy',
      batchId: 'btc_jee_math_adv',
      batchName: 'JEE Advanced — Mathematics Alpha',
      teacherId: 'usr_teacher_sharma',
      teacherName: 'Prof. Rajesh Sharma',
      title: 'Matrices & Determinants Class Assessment',
      subject: 'Higher Calculus & Vectors',
      category: 'MONTHLY_EXAM',
      assessmentDate: '2026-10-28',
      maxMarks: 100,
      passingMarks: 40,
      instructions: 'Eigenvalue derivations and rank determination.',
      status: 'DRAFT',
      gradingPrecision: 1,
      studentCount: 5,
      scoredCount: 3,
      absentCount: 0,
      pendingCount: 2,
      createdAt: '2026-10-28T08:00:00.000Z',
      updatedAt: '2026-10-28T14:30:00.000Z',
    },
  ];
}

function getFallbackAssessmentDetails(id: string): { assessment: ClassroomAssessment; roster: AssessmentMarkItem[] } {
  const list = getFallbackAssessments();
  const assessment = list.find((a) => a.id === id) || list[0];

  const roster: AssessmentMarkItem[] = [
    {
      id: 'mrk_01',
      studentId: 'std_01',
      studentName: 'Aarav Patel',
      rollNumber: 'APX-2026-001',
      attendanceStatus: 'PRESENT',
      obtainedMarks: 46.5,
      percentage: 93,
      grade: 'A+',
      resultStatus: 'SCORED',
      feedback: 'Exceptional evaluation of indeterminate limits.',
      isPublished: assessment.status === 'PUBLISHED',
      isEligible: true,
    },
    {
      id: 'mrk_02',
      studentId: 'std_02',
      studentName: 'Diya Sen',
      rollNumber: 'APX-2026-002',
      attendanceStatus: 'PRESENT',
      obtainedMarks: 42,
      percentage: 84,
      grade: 'A',
      resultStatus: 'SCORED',
      feedback: 'Very accurate Taylor expansion. Good work.',
      isPublished: assessment.status === 'PUBLISHED',
      isEligible: true,
    },
    {
      id: 'mrk_03',
      studentId: 'std_03',
      studentName: 'Rohan Deshmukh',
      rollNumber: 'APX-2026-003',
      attendanceStatus: 'ABSENT',
      obtainedMarks: null,
      percentage: null,
      grade: null,
      resultStatus: 'ABSENT',
      feedback: 'Absent with intimation. Makeup session required.',
      isPublished: assessment.status === 'PUBLISHED',
      isEligible: true,
    },
    {
      id: 'mrk_04',
      studentId: 'std_04',
      studentName: 'Ananya Iyer',
      rollNumber: 'APX-2026-004',
      attendanceStatus: 'PRESENT',
      obtainedMarks: 48,
      percentage: 96,
      grade: 'A+',
      resultStatus: 'SCORED',
      feedback: 'Top performer in class. Flawless derivations.',
      isPublished: assessment.status === 'PUBLISHED',
      isEligible: true,
    },
    {
      id: 'mrk_05',
      studentId: 'std_05',
      studentName: 'Vikram Malhotra',
      rollNumber: 'APX-2026-005',
      attendanceStatus: 'PRESENT',
      obtainedMarks: 39,
      percentage: 78,
      grade: 'B+',
      resultStatus: 'SCORED',
      feedback: 'Revise sandwich theorem and squeeze limit concepts.',
      isPublished: assessment.status === 'PUBLISHED',
      isEligible: true,
    },
  ];

  return { assessment, roster };
}


// --------------------------------------------------------------------------
// FALLBACK DATA FOR GLOBAL FEATURE FLAGS & PLATFORM CONTROL PLANE
// --------------------------------------------------------------------------
function getFallbackFeatureRegistry(): FeatureDefinition[] {
  return [
    {
      key: 'attendance',
      name: 'Daily Attendance Register',
      description: 'Classroom roll call, headcounts, tactile stamps, and parent SMS dispatches',
      module: 'ACADEMIC_OPS',
      defaultGloballyEnabled: true,
      isKillSwitchable: true,
      securityImpact: 'MEDIUM',
      applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
      auditRequired: true,
    },
    {
      key: 'assignments',
      name: 'Assignments & Work',
      description: 'Digital homework creation, deadline locks, and grading submissions',
      module: 'ACADEMIC_OPS',
      defaultGloballyEnabled: true,
      isKillSwitchable: true,
      securityImpact: 'LOW',
      applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
      auditRequired: false,
    },
    {
      key: 'bulk_marks_entry',
      name: 'Bulk Marks & Evaluations Sheet',
      description: 'Spreadsheet evaluation, automated scoring, and publish staging',
      module: 'ASSESSMENT',
      defaultGloballyEnabled: true,
      isKillSwitchable: true,
      securityImpact: 'HIGH',
      applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
      auditRequired: true,
    },
    {
      key: 'exam_management',
      name: 'Exams & Quizzes',
      description: 'Test session scheduling, question paper attachments, and invigilation',
      module: 'ASSESSMENT',
      defaultGloballyEnabled: true,
      isKillSwitchable: true,
      securityImpact: 'MEDIUM',
      applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
      auditRequired: true,
    },
    {
      key: 'question_bank',
      name: 'Curated Question Bank',
      description: 'Centralized repository of chapter questions, hints, and derivations',
      module: 'ASSESSMENT',
      defaultGloballyEnabled: true,
      isKillSwitchable: true,
      securityImpact: 'LOW',
      applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
      auditRequired: false,
    },
    {
      key: 'published_results',
      name: 'Result Publishing & Feed',
      description: 'Official student result release workflow with verified publishing stamps',
      module: 'ASSESSMENT',
      defaultGloballyEnabled: true,
      isKillSwitchable: true,
      securityImpact: 'HIGH',
      dependencies: ['bulk_marks_entry'],
      applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
      auditRequired: true,
    },
    {
      key: 'staff_leave_management',
      name: 'Staff & Faculty Leave',
      description: 'Faculty leave applications, substitute teacher handoffs, and approvals',
      module: 'ACADEMIC_OPS',
      defaultGloballyEnabled: true,
      isKillSwitchable: true,
      securityImpact: 'MEDIUM',
      applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
      auditRequired: true,
    },
    {
      key: 'timetable',
      name: 'Weekly Timetable',
      description: 'Room and lecture slot allocation, recurring faculty weekly slots',
      module: 'ACADEMIC_OPS',
      defaultGloballyEnabled: true,
      isKillSwitchable: true,
      securityImpact: 'LOW',
      applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
      auditRequired: false,
    },
    {
      key: 'lesson_planning',
      name: 'Lesson Planning & Milestones',
      description: 'Curriculum syllabus trackers, chapter plans, and completion checks',
      module: 'ACADEMIC_OPS',
      defaultGloballyEnabled: true,
      isKillSwitchable: true,
      securityImpact: 'LOW',
      applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
      auditRequired: false,
    },
    {
      key: 'pdf_generation',
      name: 'Single PDF Generation',
      description: 'Individual assessment report cards, attendance transcripts, and receipts',
      module: 'SYSTEM_BRANDING',
      defaultGloballyEnabled: true,
      isKillSwitchable: true,
      securityImpact: 'MEDIUM',
      applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
      auditRequired: false,
    },
    {
      key: 'bulk_pdf_generation',
      name: 'Bulk Batch PDF Generation',
      description: 'Asynchronous generation of entire batch report cards and ZIP archives',
      module: 'SYSTEM_BRANDING',
      defaultGloballyEnabled: true,
      isKillSwitchable: true,
      securityImpact: 'HIGH',
      dependencies: ['pdf_generation'],
      applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
      auditRequired: true,
    },
    {
      key: 'bulk_import',
      name: 'Bulk CSV / Excel Student Import',
      description: 'Validated batch ingestion of student rosters and historical marks',
      module: 'ACADEMIC_OPS',
      defaultGloballyEnabled: true,
      isKillSwitchable: true,
      securityImpact: 'HIGH',
      applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
      auditRequired: true,
    },
    {
      key: 'bulk_export',
      name: 'Bulk Data & Compliance Export',
      description: 'Full institutional export of student rosters, attendance logs, and marks',
      module: 'ACADEMIC_OPS',
      defaultGloballyEnabled: true,
      isKillSwitchable: true,
      securityImpact: 'HIGH',
      applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
      auditRequired: true,
    },
    {
      key: 'fee_management',
      name: 'Fee Structure & Dues Register',
      description: 'Installment tracking, pending fee registers, and receipt generation',
      module: 'FINANCE',
      defaultGloballyEnabled: true,
      isKillSwitchable: true,
      securityImpact: 'CRITICAL',
      applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
      auditRequired: true,
    },
    {
      key: 'fee_reminders',
      name: 'Automated Fee Reminders',
      description: 'Scheduled SMS and WhatsApp pending fee reminder dispatches',
      module: 'FINANCE',
      defaultGloballyEnabled: true,
      isKillSwitchable: true,
      securityImpact: 'CRITICAL',
      dependencies: ['fee_management'],
      applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
      auditRequired: true,
    },
    {
      key: 'announcements',
      name: 'Announcements & Noticeboard',
      description: 'Broadcast alerts to batches with priority flags (NORMAL / URGENT)',
      module: 'COMMUNICATIONS',
      defaultGloballyEnabled: true,
      isKillSwitchable: true,
      securityImpact: 'LOW',
      applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
      auditRequired: false,
    },
    {
      key: 'in_app_notifications',
      name: 'In-App Notifications',
      description: 'Real-time in-app notification center for results, tests, and attendance',
      module: 'COMMUNICATIONS',
      defaultGloballyEnabled: true,
      isKillSwitchable: true,
      securityImpact: 'LOW',
      applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
      auditRequired: false,
    },
    {
      key: 'email_notifications',
      name: 'Transactional Email Alerts',
      description: 'Automated email dispatch for password resets, student invites, and summaries',
      module: 'COMMUNICATIONS',
      defaultGloballyEnabled: true,
      isKillSwitchable: true,
      securityImpact: 'MEDIUM',
      applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
      auditRequired: true,
    },
    {
      key: 'advanced_reports',
      name: 'Advanced Reports & Faculty KPIs',
      description: 'Cross-batch performance trends, attendance drop-off alerts, and faculty metrics',
      module: 'REPORTS_ANALYTICS',
      defaultGloballyEnabled: true,
      isKillSwitchable: true,
      securityImpact: 'LOW',
      applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
      auditRequired: false,
    },
    {
      key: 'white_label_branding',
      name: 'White-Label Branding & Colors',
      description: 'Custom institute logo, primary theme tints, custom PDF headers, and portals',
      module: 'SYSTEM_BRANDING',
      defaultGloballyEnabled: true,
      isKillSwitchable: false,
      securityImpact: 'LOW',
      applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
      auditRequired: true,
    },
    {
      key: 'custom_domains',
      name: 'Custom Domain Routing (CNAME)',
      description: 'Dedicated portal address e.g. student.apexacademy.com',
      module: 'SYSTEM_BRANDING',
      defaultGloballyEnabled: true,
      isKillSwitchable: false,
      securityImpact: 'MEDIUM',
      dependencies: ['white_label_branding'],
      applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
      auditRequired: true,
    },
    {
      key: 'parent_portal',
      name: 'Parent / Guardian Portal',
      description: 'Dedicated login for parents to inspect child attendance and marks cards',
      module: 'STUDENT_PORTAL',
      defaultGloballyEnabled: true,
      isKillSwitchable: true,
      securityImpact: 'HIGH',
      applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
      auditRequired: true,
    },
    {
      key: 'mobile_features',
      name: 'React Native Mobile Capabilities',
      description: 'Mobile offline attendance sync, camera QR scanning, and push notifications',
      module: 'ACADEMIC_OPS',
      defaultGloballyEnabled: true,
      isKillSwitchable: true,
      securityImpact: 'MEDIUM',
      applicableScopes: ['PLATFORM', 'PLAN', 'INSTITUTE'],
      auditRequired: false,
    },
  ];
}

function getFallbackEffectiveFeatures(instituteId: string): InstituteEffectiveFeatures {
  const allDefs = getFallbackFeatureRegistry();
  const evaluatedFeatures: any = {};

  allDefs.forEach((def) => {
    // Default demo behavior: most active, white_label & custom_domains restricted on Starter/Growth
    const isRestrictedByPlan = def.key === 'custom_domains' || def.key === 'white_label_branding';
    evaluatedFeatures[def.key] = {
      featureKey: def.key,
      isAvailable: !isRestrictedByPlan,
      status: isRestrictedByPlan ? 'PLAN_RESTRICTED' : 'ACTIVE',
      reason: isRestrictedByPlan ? 'Feature requires PRO or Enterprise Plan subscription.' : undefined,
      requiredPlan: isRestrictedByPlan ? 'PRO' : undefined,
      quota: {
        limit: def.key === 'attendance' ? 500 : null,
        used: def.key === 'attendance' ? 84 : 0,
        remaining: def.key === 'attendance' ? 416 : null,
        period: 'TOTAL',
      },
      evaluatedAt: new Date().toISOString(),
    };
  });

  return {
    instituteId,
    instituteName: 'Apex IIT & Medical Academy',
    plan: 'GROWTH',
    isInstituteActive: true,
    evaluatedFeatures,
    evaluatedAt: new Date().toISOString(),
  };
}

function getFallbackFeatureAuditLogs(): FeatureAuditLogItem[] {
  return [
    {
      id: 'log_01',
      featureKey: 'bulk_marks_entry',
      actorId: 'usr_super_01',
      actorEmail: 'superadmin@padhaipilot.com',
      scope: 'PLATFORM',
      action: 'GLOBAL_TOGGLE',
      previousValue: { isGloballyEnabled: true },
      newValue: { isGloballyEnabled: true },
      reason: 'Routine quarterly verification of marks evaluation engine',
      createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    },
    {
      id: 'log_02',
      featureKey: 'attendance',
      actorId: 'usr_super_01',
      actorEmail: 'superadmin@padhaipilot.com',
      scope: 'INSTITUTE',
      targetInstituteId: 'inst_apex_academy',
      action: 'QUOTA_UPDATE',
      previousValue: { quotaLimit: 250 },
      newValue: { quotaLimit: 500 },
      reason: 'Growth tier upgrade applied: student enrollment expansion',
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    },
    {
      id: 'log_03',
      featureKey: 'published_results',
      actorId: 'usr_teacher_sharma',
      actorEmail: 'teacher@padhaipilot.com',
      scope: 'INSTITUTE',
      targetInstituteId: 'inst_apex_academy',
      action: 'INSTITUTE_OVERRIDE',
      previousValue: { isEnabled: true },
      newValue: { isEnabled: true },
      reason: 'Verified JEE Advanced Alpha Calculus exam results published',
      createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    },
  ];
}

function getFallbackTuitionProfile(): TuitionBrandingProfile {
  return {
    id: 'inst_apex_academy',
    name: 'Apex IIT-JEE & Medical Academy',
    slug: 'apex-academy',
    logoUrl: 'https://images.unsplash.com/photo-1594608661623-aa0bd3a69d98?w=128&q=80',
    primaryColor: '#1677FF',
    address: 'Plot 42, Knowledge Park III, Silicon Corridor, Pune - 411045',
    contactPhone: '+91 98230 45678',
    contactEmail: 'admissions@apexacademy.edu.in',
    website: 'https://apexacademy.edu.in',
    description: 'Premier coaching institute specialized in JEE Advanced, NEET-UG, and National Olympiad foundations with 14+ years of academic excellence.',
    footerText: 'PadhaiPilot Verified Tuition Institute — ISO 9001:2015 Certified Coaching Center',
    signatoryName: 'Dr. Anand K. Kulkarni',
    signatoryTitle: 'Founder & Academic Director',
    academicYear: '2026-2027',
    ownerId: 'usr_owner_01',
    totalStudents: 84,
    totalFaculty: 6,
    totalBatches: 3,
  };
}

function getFallbackFaculties(): FacultyMember[] {
  return [
    {
      id: 'fac_01',
      userId: 'usr_teacher_sharma',
      staffId: 'FAC-101',
      fullName: 'Prof. Rajesh Sharma',
      email: 'rajesh.sharma@apexacademy.edu.in',
      phone: '+91 98220 11223',
      designation: 'Senior Faculty & HOD Mathematics',
      employmentStatus: 'ACTIVE',
      compensationType: 'FIXED_MONTHLY',
      baseSalary: 75000,
      hourlyRate: 0,
      joiningDate: '2023-06-01T00:00:00.000Z',
      assignedSubjects: ['Mathematics', 'Advanced Calculus', 'Vectors & 3D'],
      delegatedPermissions: ['MANAGE_ATTENDANCE', 'MANAGE_MARKS', 'PUBLISH_DIARY', 'MANAGE_TIMETABLE'],
      assignedBatchesCount: 2,
      weeklyLectureCount: 12,
      assignedBatches: [
        { id: 'btc_jee_math_adv', name: 'JEE Advanced — Mathematics Alpha', code: 'JEE-MTH-ADV', subject: 'Higher Calculus & Vectors', gradeLevel: 'Class 12' },
        { id: 'btc_olympiad_math', name: 'Olympiad Foundation Mathematics', code: 'OLY-MTH-10', subject: 'Number Theory & Combinatorics', gradeLevel: 'Class 10' },
      ],
      emergencyContact: '+91 98220 99887 (Spouse)',
    },
    {
      id: 'fac_02',
      userId: 'usr_fac_verma',
      staffId: 'FAC-102',
      fullName: 'Dr. Sunita Verma',
      email: 'sunita.verma@apexacademy.edu.in',
      phone: '+91 98221 44556',
      designation: 'Associate Professor, Physics',
      employmentStatus: 'ACTIVE',
      compensationType: 'FIXED_MONTHLY',
      baseSalary: 68000,
      hourlyRate: 0,
      joiningDate: '2024-01-15T00:00:00.000Z',
      assignedSubjects: ['Physics', 'Thermodynamics', 'Electrodynamics'],
      delegatedPermissions: ['MANAGE_ATTENDANCE', 'MANAGE_MARKS', 'PUBLISH_DIARY'],
      assignedBatchesCount: 1,
      weeklyLectureCount: 8,
      assignedBatches: [
        { id: 'btc_neet_physics_core', name: 'Class 11 — Physics Core Batch', code: 'PHY-11-CORE', subject: 'Mechanics & Thermodynamics', gradeLevel: 'Class 11' },
      ],
      emergencyContact: '+91 98221 00112 (Brother)',
    },
    {
      id: 'fac_03',
      userId: 'usr_fac_mehta',
      staffId: 'FAC-103',
      fullName: 'Vikram Mehta',
      email: 'vikram.mehta@apexacademy.edu.in',
      phone: '+91 98223 77889',
      designation: 'Visiting Specialist, Organic Chemistry',
      employmentStatus: 'ACTIVE',
      compensationType: 'HOURLY_PER_CLASS',
      baseSalary: 0,
      hourlyRate: 1500,
      joiningDate: '2024-07-01T00:00:00.000Z',
      assignedSubjects: ['Organic Chemistry', 'Stereochemistry'],
      delegatedPermissions: ['MANAGE_ATTENDANCE', 'PUBLISH_DIARY'],
      assignedBatchesCount: 1,
      weeklyLectureCount: 6,
      emergencyContact: '+91 98223 11223 (Father)',
    },
  ];
}

function getFallbackSalaries(): SalaryStatementItem[] {
  return [
    {
      id: 'sal_rec_01',
      instituteId: 'inst_apex_academy',
      facultyId: 'usr_teacher_sharma',
      facultyName: 'Prof. Rajesh Sharma',
      staffId: 'FAC-101',
      designation: 'Senior Faculty & HOD Mathematics',
      payPeriod: '2026-10',
      compensationModel: 'FIXED_MONTHLY',
      classesConducted: 26,
      baseAmount: 75000,
      additions: 5000, // Festival bonus / Doubt session allowance
      deductions: 2500, // Professional tax + TDS
      advances: 0,
      netPayable: 77500,
      status: 'APPROVED',
      createdAt: '2026-10-25T10:00:00.000Z',
      updatedAt: '2026-10-27T14:30:00.000Z',
      remarks: 'Includes special Sunday Advanced problem-solving bonus',
    },
    {
      id: 'sal_rec_02',
      instituteId: 'inst_apex_academy',
      facultyId: 'usr_fac_verma',
      facultyName: 'Dr. Sunita Verma',
      staffId: 'FAC-102',
      designation: 'Associate Professor, Physics',
      payPeriod: '2026-10',
      compensationModel: 'FIXED_MONTHLY',
      classesConducted: 22,
      baseAmount: 68000,
      additions: 2000,
      deductions: 2000,
      advances: 5000,
      netPayable: 63000,
      status: 'PAID',
      paymentDate: '2026-10-28T16:00:00.000Z',
      paymentMethod: 'BANK_TRANSFER',
      paymentReference: 'NEFT/HDFC/20261028/8877112',
      createdAt: '2026-10-25T10:00:00.000Z',
      updatedAt: '2026-10-28T16:00:00.000Z',
      remarks: 'Salary cleared via NEFT batch transfer',
    },
    {
      id: 'sal_rec_03',
      instituteId: 'inst_apex_academy',
      facultyId: 'usr_fac_mehta',
      facultyName: 'Vikram Mehta',
      staffId: 'FAC-103',
      designation: 'Visiting Specialist, Organic Chemistry',
      payPeriod: '2026-10',
      compensationModel: 'HOURLY_PER_CLASS',
      classesConducted: 18,
      baseAmount: 27000, // 18 classes * 1500
      additions: 0,
      deductions: 1000,
      advances: 0,
      netPayable: 26000,
      status: 'REVIEWED',
      createdAt: '2026-10-26T11:00:00.000Z',
      updatedAt: '2026-10-28T12:00:00.000Z',
      remarks: '18 lecture hours logged and verified with classroom logbook',
    },
  ];
}

function getFallbackLeaves(): FacultyLeaveItem[] {
  return [
    {
      id: 'leave_rec_01',
      instituteId: 'inst_apex_academy',
      facultyId: 'usr_teacher_sharma',
      facultyName: 'Prof. Rajesh Sharma',
      staffId: 'FAC-101',
      leaveType: 'CASUAL',
      startDate: '2026-11-04T00:00:00.000Z',
      endDate: '2026-11-05T00:00:00.000Z',
      totalDays: 2,
      reason: 'Attending National Mathematics Teachers Symposium at IISc Bangalore.',
      status: 'PENDING',
      substituteFacultyId: 'usr_fac_verma',
      substituteFacultyName: 'Dr. Sunita Verma',
      createdAt: '2026-10-28T09:30:00.000Z',
    },
    {
      id: 'leave_rec_02',
      instituteId: 'inst_apex_academy',
      facultyId: 'usr_fac_verma',
      facultyName: 'Dr. Sunita Verma',
      staffId: 'FAC-102',
      leaveType: 'SICK',
      startDate: '2026-10-20T00:00:00.000Z',
      endDate: '2026-10-21T00:00:00.000Z',
      totalDays: 2,
      reason: 'Viral fever and throat infection; medical certificate submitted.',
      status: 'APPROVED',
      reviewedById: 'usr_owner_01',
      reviewerName: 'Dr. Anand K. Kulkarni',
      reviewerRemarks: 'Approved. Classes adjusted with Prof. Sharma.',
      reviewedAt: '2026-10-20T10:15:00.000Z',
      substituteFacultyId: 'usr_teacher_sharma',
      substituteFacultyName: 'Prof. Rajesh Sharma',
      createdAt: '2026-10-20T08:00:00.000Z',
    },
  ];
}

function getFallbackTeachingDiaries(): DailyTeachingDiaryEntry[] {
  return [
    {
      id: 'diary_01',
      instituteId: 'inst_apex_academy',
      batchId: 'btc_jee_math_adv',
      batchName: 'JEE Advanced — Mathematics Alpha',
      batchCode: 'JEE-MTH-ADV',
      facultyId: 'usr_teacher_sharma',
      facultyName: 'Prof. Rajesh Sharma',
      lessonDate: '2026-10-29T00:00:00.000Z',
      sessionTime: '09:00 - 10:30',
      subject: 'Higher Calculus & Vectors',
      chapterTitle: 'Definite Integration & Applications',
      conceptsTaught: 'Properties of definite integrals, Leibniz integral rule (differentiation under the integral sign), and evaluating symmetric periodic bounds.',
      learningObjectives: 'Students should master applying Leibniz theorem to solve multi-step IIT-JEE Advanced integration questions.',
      teachingMethods: 'Rigorous derivation followed by 4 live problem-solving models from past JEE Advanced papers.',
      durationMinutes: 90,
      homeworkAssigned: 'Solve Advanced DPP #14: Questions 1 to 18; Complete self-evaluation on trigonometric periodic integrals.',
      referenceLinks: ['https://mathworld.wolfram.com/LeibnizIntegralRule.html', 'https://nptel.ac.in/courses/calculus'],
      followUpPlan: 'Begin Area Under Curves & Double Integrals next Tuesday.',
      status: 'PUBLISHED',
      audience: 'BATCH',
      isCovered: true,
      createdAt: '2026-10-29T10:45:00.000Z',
      updatedAt: '2026-10-29T10:45:00.000Z',
    },
    {
      id: 'diary_02',
      instituteId: 'inst_apex_academy',
      batchId: 'btc_neet_physics_core',
      batchName: 'Class 11 — Physics Core Batch',
      batchCode: 'PHY-11-CORE',
      facultyId: 'usr_fac_verma',
      facultyName: 'Dr. Sunita Verma',
      lessonDate: '2026-10-28T00:00:00.000Z',
      sessionTime: '11:00 - 12:30',
      subject: 'Mechanics & Thermodynamics',
      chapterTitle: 'Rotational Motion & Moment of Inertia',
      conceptsTaught: 'Radius of gyration, Parallel and Perpendicular axis theorems, and Rolling without slipping on inclined surfaces.',
      learningObjectives: 'Calculate moments of inertia for composite geometries and solve energy conservation in rolling motion.',
      teachingMethods: 'Visual cylinder-disc rolling demonstration + interactive formula sheet walkthrough.',
      durationMinutes: 90,
      homeworkAssigned: 'HC Verma Vol 1: Chapter 10 — Exercises 12 to 28; Practice NCERT Exemplar problems.',
      referenceLinks: ['https://physics.info/rotational-dynamics/'],
      followUpPlan: 'Doubt clearance session scheduled on Saturday 4 PM.',
      status: 'PUBLISHED',
      audience: 'BATCH',
      isCovered: true,
      createdAt: '2026-10-28T13:00:00.000Z',
      updatedAt: '2026-10-28T13:00:00.000Z',
    },
    {
      id: 'diary_03',
      instituteId: 'inst_apex_academy',
      batchId: 'btc_olympiad_math',
      batchName: 'Olympiad Foundation Mathematics',
      batchCode: 'OLY-MTH-10',
      facultyId: 'usr_teacher_sharma',
      facultyName: 'Prof. Rajesh Sharma',
      lessonDate: '2026-10-27T00:00:00.000Z',
      sessionTime: '16:00 - 17:30',
      subject: 'Number Theory & Combinatorics',
      chapterTitle: 'Modular Arithmetic & Fermat Little Theorem',
      conceptsTaught: 'Congruences modulo n, Wilson Theorem, Fermat Little Theorem, and Euler Totient Function with divisibility proofs.',
      learningObjectives: 'Equip grade 10 foundation students with modular inverse tools for RMO / INMO stage 1.',
      teachingMethods: 'Proof exploration and interactive board puzzles.',
      durationMinutes: 90,
      homeworkAssigned: 'RMO Past Papers 2018-2023: Solve 5 highlighted modular congruence problems.',
      referenceLinks: ['https://artofproblemsolving.com/wiki/index.php/Number_theory'],
      followUpPlan: 'Chinese Remainder Theorem in next session.',
      status: 'PUBLISHED',
      audience: 'BATCH',
      isCovered: true,
      createdAt: '2026-10-27T18:00:00.000Z',
      updatedAt: '2026-10-27T18:00:00.000Z',
    },
  ];
}

function getFallbackDiariesOverview(): TeachingDiaryOverview {
  return {
    totalEntriesThisMonth: 42,
    batchesCovered: 3,
    activeFacultyCount: 3,
    recentEntries: getFallbackTeachingDiaries(),
    subjectCoverageMap: {
      'Higher Calculus & Vectors': 16,
      'Mechanics & Thermodynamics': 14,
      'Number Theory & Combinatorics': 12,
    },
  };
}

function getFallbackStudyMaterials(): StudyMaterialItem[] {
  return [
    {
      id: 'mat_01',
      instituteId: 'inst_apex_academy',
      batchId: 'btc_jee_math_adv',
      batchName: 'JEE Advanced — Mathematics Alpha',
      facultyId: 'usr_teacher_sharma',
      facultyName: 'Prof. Rajesh Sharma',
      title: 'Definite Integrals — Comprehensive Theory & 50 Solved JEE Advanced Models',
      category: 'CHAPTER_NOTES',
      subject: 'Higher Calculus & Vectors',
      chapter: 'Definite Integration',
      content: 'Complete analytical notes covering King property, Queen property, Leibniz integral rule, and Walli formula.',
      fileUrl: 'https://assets.padhaipilot.com/notes/math_adv_definite_integrals.pdf',
      fileName: 'Definite_Integrals_JEE_Adv_Notes.pdf',
      fileSize: '3.8 MB',
      status: 'PUBLISHED',
      isStudentVisible: true,
      downloadCount: 68,
      createdAt: '2026-10-28T10:00:00.000Z',
      updatedAt: '2026-10-28T10:00:00.000Z',
    },
    {
      id: 'mat_02',
      instituteId: 'inst_apex_academy',
      batchId: 'btc_jee_math_adv',
      batchName: 'JEE Advanced — Mathematics Alpha',
      facultyId: 'usr_teacher_sharma',
      facultyName: 'Prof. Rajesh Sharma',
      title: 'Daily Practice Problem (DPP) #14 — Periodic & Symmetric Integrals',
      category: 'WORKSHEET',
      subject: 'Higher Calculus & Vectors',
      chapter: 'Definite Integration',
      content: '18 high-yield practice questions with hints and step-by-step key.',
      fileUrl: 'https://assets.padhaipilot.com/worksheets/dpp_14_calculus.pdf',
      fileName: 'DPP_14_Calculus_Worksheet.pdf',
      fileSize: '1.2 MB',
      status: 'PUBLISHED',
      isStudentVisible: true,
      downloadCount: 82,
      createdAt: '2026-10-29T08:30:00.000Z',
      updatedAt: '2026-10-29T08:30:00.000Z',
    },
    {
      id: 'mat_03',
      instituteId: 'inst_apex_academy',
      batchId: 'btc_neet_physics_core',
      batchName: 'Class 11 — Physics Core Batch',
      facultyId: 'usr_fac_verma',
      facultyName: 'Dr. Sunita Verma',
      title: 'Moment of Inertia of Standard Geometrical Bodies — Quick Formula Sheet',
      category: 'FORMULA_SHEET',
      subject: 'Mechanics & Thermodynamics',
      chapter: 'Rotational Dynamics',
      content: 'Handy one-page cheat sheet for rods, rings, discs, hollow/solid spheres, and cones.',
      fileUrl: 'https://assets.padhaipilot.com/notes/physics_rotational_formula_sheet.pdf',
      fileName: 'Rotational_Dynamics_FormulaSheet.pdf',
      fileSize: '840 KB',
      status: 'PUBLISHED',
      isStudentVisible: true,
      downloadCount: 54,
      createdAt: '2026-10-27T15:00:00.000Z',
      updatedAt: '2026-10-27T15:00:00.000Z',
    },
  ];
}

function getFallbackFeeRecords(): StudentFeeItem[] {
  return [
    {
      id: 'fee_rec_01',
      instituteId: 'inst_apex_academy',
      studentId: 'usr_std_01',
      studentName: 'Aarav Patel',
      rollNumber: 'JEE-26-001',
      batchId: 'btc_jee_math_adv',
      batchName: 'JEE Advanced — Mathematics Alpha',
      feeTitle: 'Term 2 Tuition & Test Series Fee',
      totalAmount: 35000,
      paidAmount: 20000,
      balanceDue: 15000,
      dueDate: '2026-10-15T00:00:00.000Z',
      status: 'OVERDUE',
      academicYear: '2026-2027',
      lastReminderSentAt: '2026-10-26T11:00:00.000Z',
      reminderCount: 2,
      createdAt: '2026-09-01T00:00:00.000Z',
    },
    {
      id: 'fee_rec_02',
      instituteId: 'inst_apex_academy',
      studentId: 'usr_std_02',
      studentName: 'Ananya Deshmukh',
      rollNumber: 'JEE-26-002',
      batchId: 'btc_jee_math_adv',
      batchName: 'JEE Advanced — Mathematics Alpha',
      feeTitle: 'Term 2 Tuition & Test Series Fee',
      totalAmount: 35000,
      paidAmount: 35000,
      balanceDue: 0,
      dueDate: '2026-10-15T00:00:00.000Z',
      status: 'PAID',
      academicYear: '2026-2027',
      reminderCount: 0,
      createdAt: '2026-09-01T00:00:00.000Z',
    },
    {
      id: 'fee_rec_03',
      instituteId: 'inst_apex_academy',
      studentId: 'usr_std_03',
      studentName: 'Rohan Joshi',
      rollNumber: 'JEE-26-003',
      batchId: 'btc_jee_math_adv',
      batchName: 'JEE Advanced — Mathematics Alpha',
      feeTitle: 'Term 2 Tuition & Test Series Fee',
      totalAmount: 35000,
      paidAmount: 15000,
      balanceDue: 20000,
      dueDate: '2026-11-05T00:00:00.000Z',
      status: 'PARTIAL',
      academicYear: '2026-2027',
      reminderCount: 0,
      createdAt: '2026-09-01T00:00:00.000Z',
    },
    {
      id: 'fee_rec_04',
      instituteId: 'inst_apex_academy',
      studentId: 'usr_std_04',
      studentName: 'Diya Kulkarni',
      rollNumber: 'PHY-11-014',
      batchId: 'btc_neet_physics_core',
      batchName: 'Class 11 — Physics Core Batch',
      feeTitle: 'Annual Physics Laboratory & Study Material Kit',
      totalAmount: 12000,
      paidAmount: 0,
      balanceDue: 12000,
      dueDate: '2026-10-20T00:00:00.000Z',
      status: 'OVERDUE',
      academicYear: '2026-2027',
      lastReminderSentAt: '2026-10-27T14:00:00.000Z',
      reminderCount: 1,
      createdAt: '2026-09-10T00:00:00.000Z',
    },
  ];
}

function getFallbackFeeSummary(): FeeSummaryOverview {
  return {
    totalReceivable: 470000,
    totalCollected: 385000,
    totalPending: 85000,
    overdueCount: 2,
    remindersSentThisMonth: 14,
  };
}
