/**
 * PadhaiPilot Teacher Portal API Client
 * Centralized, typed, resilient communication with the NestJS API.
 * All dummy and static fallback data has been removed.
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
  FeatureKey,
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

const PRODUCTION_API_URL = 'https://padhai-pilot.vercel.app/api';

function getCleanApiBaseUrl(): string {
  let base = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!base) {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return 'http://localhost:3001/api';
    }
    // Each portal is its own Vercel project, so a relative '/api' would hit the portal itself.
    return PRODUCTION_API_URL;
  }
  // Strip trailing slashes
  base = base.replace(/\/+$/, '');
  // If base doesn't end with /api, ensure /api is included
  if (!base.endsWith('/api')) {
    base = `${base}/api`;
  }
  return base;
}

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

  const baseUrl = getCleanApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${cleanEndpoint}`;

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
    console.warn(`API call to ${endpoint} failed:`, (err as Error).message);
    throw err;
  }
}

export const teacherApi = {
  // -------------------------------------------------------------
  // AUTHENTICATION & ACCOUNT LIFECYCLE
  // -------------------------------------------------------------
  async login(email: string, password: string): Promise<{ user: UserSession; token: string }> {
    const res = await request<{ user: UserSession; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) setAuthToken(res.token);
    return res;
  },

  async loginDemoTeacher(): Promise<{ user: UserSession; token: string }> {
    const res = await request<{ user: UserSession; token: string }>('/auth/demo-teacher');
    if (res.token) setAuthToken(res.token);
    return res;
  },

  async loginDemoOwner(): Promise<{ user: UserSession; token: string }> {
    const res = await request<{ user: UserSession; token: string }>('/auth/demo-owner');
    if (res.token) setAuthToken(res.token);
    return res;
  },

  async loginDemoAdmin(): Promise<{ user: UserSession; token: string }> {
    const res = await request<{ user: UserSession; token: string }>('/auth/demo-admin');
    if (res.token) setAuthToken(res.token);
    return res;
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
    role?: 'TEACHER' | 'TUITION_OWNER';
  }): Promise<{ user: UserSession; token: string }> {
    const res = await request<{ user: UserSession; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) setAuthToken(res.token);
    return res;
  },

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string; debugToken?: string }> {
    return await request<{ success: boolean; message: string; debugToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return await request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
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
    return await request<{ authenticated: boolean; user: UserSession }>('/auth/me');
  },

  // -------------------------------------------------------------
  // DASHBOARD & BATCHES
  // -------------------------------------------------------------
  async getDashboard(): Promise<TeacherDashboardMetrics> {
    try {
      return await request<TeacherDashboardMetrics>('/teacher/dashboard');
    } catch {
      return {
        todayClassesCount: 0,
        assignedBatchesCount: 0,
        totalStudentsCount: 0,
        pendingAttendanceCount: 0,
        pendingReviewsCount: 0,
        todaySchedule: [],
        activeBatches: [],
        recentAnnouncements: [],
      };
    }
  },

  async getBatches(): Promise<BatchSummary[]> {
    try {
      return await request<BatchSummary[]>('/teacher/batches');
    } catch {
      return [];
    }
  },

  async getBatchRoster(batchId: string): Promise<{ batch: BatchSummary; students: StudentRosterItem[] }> {
    try {
      return await request<{ batch: BatchSummary; students: StudentRosterItem[] }>(
        `/teacher/batches/${batchId}/students`,
      );
    } catch {
      return {
        batch: {
          id: batchId,
          instituteId: '',
          teacherId: '',
          name: '',
          code: '',
          subject: '',
          gradeLevel: '',
          room: '',
          studentCount: 0,
          createdAt: '',
        },
        students: [],
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
      return [];
    }
  },

  async createInvitation(data: { batchId?: string; maxUses?: number; expiryDays?: number }): Promise<InvitationCode> {
    return await request<InvitationCode>('/teacher/invitations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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
        batchName: '',
        date,
        records: [],
      };
    }
  },

  async saveAttendance(data: {
    batchId: string;
    date: string;
    records: { studentId: string; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; note?: string }[];
  }): Promise<{ success: boolean; message: string; session: any }> {
    return await request<{ success: boolean; message: string; session: any }>('/teacher/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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
      return [];
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
    return await request<Assignment>('/teacher/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getSubmissions(assignmentId: string): Promise<{ assignment: Assignment; submissions: AssignmentSubmission[] }> {
    try {
      return await request<{ assignment: Assignment; submissions: AssignmentSubmission[] }>(
        `/teacher/assignments/${assignmentId}/submissions`,
      );
    } catch {
      return {
        assignment: {
          id: assignmentId,
          batchId: '',
          batchName: '',
          teacherId: '',
          title: '',
          instructions: '',
          subject: '',
          dueDate: '',
          maxMarks: 0,
          status: 'DRAFT',
          submissionCount: 0,
          totalStudents: 0,
          createdAt: '',
        },
        submissions: [],
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
      return [];
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
    return await request<TestQuiz>('/teacher/tests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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
      return [];
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
    return await request<LessonPlan>('/teacher/lesson-plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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
      return [];
    }
  },

  async getAnnouncements(): Promise<AnnouncementItem[]> {
    try {
      return await request<AnnouncementItem[]>('/teacher/announcements');
    } catch {
      return [];
    }
  },

  async createAnnouncement(data: {
    batchId?: string;
    title: string;
    content: string;
    priority?: 'NORMAL' | 'URGENT';
  }): Promise<AnnouncementItem> {
    return await request<AnnouncementItem>('/teacher/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // -------------------------------------------------------------
  // REPORTS
  // -------------------------------------------------------------
  async getReports(): Promise<TeacherReports> {
    try {
      return await request<TeacherReports>('/teacher/reports');
    } catch {
      return {
        summary: {
          totalBatches: 0,
          totalStudents: 0,
          averageClassAttendance: '0%',
          totalTestsConducted: 0,
        },
        attendanceTrends: [],
        batchPerformance: [],
        submissionMetrics: {
          totalAssigned: 0,
          submittedCount: 0,
          gradedCount: 0,
          pendingReviewCount: 0,
        },
      };
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
      return [];
    }
  },

  async getAssessmentDetails(id: string): Promise<{ assessment: ClassroomAssessment; roster: AssessmentMarkItem[] }> {
    try {
      return await request<{ assessment: ClassroomAssessment; roster: AssessmentMarkItem[] }>(`/assessment/${id}`);
    } catch {
      return {
        assessment: {
          id,
          batchId: '',
          batchName: '',
          instituteId: '',
          teacherId: '',
          teacherName: '',
          title: '',
          subject: '',
          category: 'UNIT_TEST',
          assessmentDate: new Date().toISOString(),
          maxMarks: 50,
          passingMarks: 20,
          instructions: '',
          status: 'DRAFT',
          gradingPrecision: 0.5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        roster: [],
      };
    }
  },

  async saveDraftMarks(payload: BulkMarksSaveDraftPayload): Promise<{ success: boolean; assessmentId: string; message: string; savedCount?: number }> {
    return await request<{ success: boolean; assessmentId: string; message: string; savedCount?: number }>('/assessment/draft', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getPublishReview(id: string): Promise<any> {
    return await request<any>(`/assessment/${id}/review`);
  },

  async publishAssessment(id: string): Promise<{ success: boolean; message: string; publishedCount: number }> {
    return await request<{ success: boolean; message: string; publishedCount: number }>(`/assessment/${id}/publish`, {
      method: 'POST',
    });
  },

  async correctMark(assessmentId: string, markId: string, data: { obtainedMarks: number; reason: string }): Promise<any> {
    return await request<any>(`/assessment/${assessmentId}/marks/${markId}/correct`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async exportResultSheetCsv(assessmentId: string): Promise<string> {
    const res = await fetch(`${getCleanApiBaseUrl()}/assessment/${assessmentId}/export`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    if (!res.ok) throw new Error('Failed to export CSV');
    return await res.text();
  },

  // -------------------------------------------------------------
  // GLOBAL FEATURE FLAGS & PLATFORM CONTROL PLANE
  // -------------------------------------------------------------
  async getFeatureRegistry(): Promise<FeatureDefinition[]> {
    try {
      const res = await request<{ success: boolean; data: FeatureDefinition[] }>('/features/registry');
      return res.data || [];
    } catch {
      return [];
    }
  },

  async getInstituteEffectiveFeatures(instituteId = ''): Promise<InstituteEffectiveFeatures> {
    try {
      const res = await request<{ success: boolean; data: InstituteEffectiveFeatures }>(`/features/institute/${instituteId}`);
      return res.data;
    } catch {
      return {
        instituteId,
        instituteName: '',
        plan: 'GROWTH',
        isInstituteActive: true,
        evaluatedFeatures: {} as any,
        evaluatedAt: new Date().toISOString(),
      };
    }
  },

  async updateGlobalFeature(data: UpdateGlobalFeatureFlagDto): Promise<{ success: boolean; message: string }> {
    return await request<{ success: boolean; message: string }>('/features/global', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async emergencyKillFeature(data: EmergencyKillSwitchDto): Promise<{ success: boolean; message: string }> {
    return await request<{ success: boolean; message: string }>('/features/emergency-kill', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async emergencyRestoreFeature(data: { featureKey: FeatureKey; reason: string }): Promise<{ success: boolean; message: string }> {
    return await request<{ success: boolean; message: string }>('/features/emergency-restore', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updatePlanEntitlements(data: UpdatePlanEntitlementDto): Promise<{ success: boolean; message: string }> {
    return await request<{ success: boolean; message: string }>('/features/plan-entitlements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateInstituteFeatureConfig(data: UpdateInstituteFeatureConfigDto): Promise<{ success: boolean; message: string }> {
    return await request<{ success: boolean; message: string }>('/features/institute-config', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getFeatureAuditLogs(params?: { featureKey?: string; instituteId?: string }): Promise<FeatureAuditLogItem[]> {
    try {
      const q = new URLSearchParams();
      if (params?.featureKey) q.set('featureKey', params.featureKey);
      if (params?.instituteId) q.set('instituteId', params.instituteId);
      const res = await request<{ success: boolean; data: FeatureAuditLogItem[] }>(`/features/audit-logs?${q.toString()}`);
      return res.data || [];
    } catch {
      return [];
    }
  },

  // -------------------------------------------------------------
  // ADVANCED TUITION MANAGEMENT & FACULTY METHODS
  // -------------------------------------------------------------
  async getTuitionProfile(): Promise<TuitionBrandingProfile> {
    try {
      return await request<TuitionBrandingProfile>('/tuition/profile');
    } catch {
      return {
        id: '',
        name: '',
        slug: '',
        logoUrl: '',
        primaryColor: '#1677FF',
        address: '',
        contactPhone: '',
        contactEmail: '',
        website: '',
        description: '',
        footerText: '',
        signatoryName: '',
        signatoryTitle: '',
        academicYear: '2026–2027',
        totalStudents: 0,
        totalFaculty: 0,
        totalBatches: 0,
      };
    }
  },

  async updateTuitionProfile(dto: UpdateTuitionBrandingDto): Promise<TuitionBrandingProfile> {
    return await request<TuitionBrandingProfile>('/tuition/profile', {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async getFaculties(): Promise<FacultyMember[]> {
    try {
      return await request<FacultyMember[]>('/tuition/faculties');
    } catch {
      return [];
    }
  },

  async createFaculty(dto: CreateFacultyDto): Promise<FacultyMember> {
    return await request<FacultyMember>('/tuition/faculties', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async updateFaculty(facultyId: string, dto: UpdateFacultyDto): Promise<FacultyMember> {
    return await request<FacultyMember>(`/tuition/faculties/${facultyId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async getSalaries(payPeriod?: string, facultyId?: string): Promise<SalaryStatementItem[]> {
    try {
      const q = new URLSearchParams();
      if (payPeriod) q.set('payPeriod', payPeriod);
      if (facultyId) q.set('facultyId', facultyId);
      return await request<SalaryStatementItem[]>(`/tuition/salaries?${q.toString()}`);
    } catch {
      return [];
    }
  },

  async generateSalary(dto: GenerateSalaryDto): Promise<SalaryStatementItem> {
    return await request<SalaryStatementItem>('/tuition/salaries/generate', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async recordSalaryPayment(salaryRecordId: string, dto: RecordSalaryPaymentDto): Promise<SalaryStatementItem> {
    return await request<SalaryStatementItem>(`/tuition/salaries/${salaryRecordId}/pay`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async getLeaves(facultyId?: string): Promise<FacultyLeaveItem[]> {
    try {
      const q = facultyId ? `?facultyId=${facultyId}` : '';
      return await request<FacultyLeaveItem[]>(`/tuition/leaves${q}`);
    } catch {
      return [];
    }
  },

  async applyLeave(dto: ApplyFacultyLeaveDto): Promise<FacultyLeaveItem> {
    return await request<FacultyLeaveItem>('/tuition/leaves/apply', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async reviewLeave(leaveId: string, dto: ReviewFacultyLeaveDto): Promise<FacultyLeaveItem> {
    return await request<FacultyLeaveItem>(`/tuition/leaves/${leaveId}/review`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async getDiaries(batchId?: string, facultyId?: string): Promise<DailyTeachingDiaryEntry[]> {
    try {
      const q = new URLSearchParams();
      if (batchId) q.set('batchId', batchId);
      if (facultyId) q.set('facultyId', facultyId);
      return await request<DailyTeachingDiaryEntry[]>(`/tuition/diaries?${q.toString()}`);
    } catch {
      return [];
    }
  },

  async getDiariesOverview(): Promise<TeachingDiaryOverview> {
    try {
      return await request<TeachingDiaryOverview>('/tuition/diaries/overview');
    } catch {
      return {
        totalEntriesThisMonth: 0,
        batchesCovered: 0,
        activeFacultyCount: 0,
        recentEntries: [],
        subjectCoverageMap: {},
      };
    }
  },

  async createDiary(dto: CreateTeachingDiaryDto): Promise<DailyTeachingDiaryEntry> {
    return await request<DailyTeachingDiaryEntry>('/tuition/diaries', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async updateDiary(diaryId: string, dto: UpdateTeachingDiaryDto): Promise<DailyTeachingDiaryEntry> {
    return await request<DailyTeachingDiaryEntry>(`/tuition/diaries/${diaryId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async getStudyMaterials(batchId?: string): Promise<StudyMaterialItem[]> {
    try {
      const q = batchId ? `?batchId=${batchId}` : '';
      return await request<StudyMaterialItem[]>(`/tuition/materials${q}`);
    } catch {
      return [];
    }
  },

  async createStudyMaterial(dto: CreateStudyMaterialDto): Promise<StudyMaterialItem> {
    return await request<StudyMaterialItem>('/tuition/materials', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async uploadMediaProxy(
    base64: string,
    fileName: string,
    mimeType?: string,
  ): Promise<{
    url: string;
    data: string;
    fileName: string;
    fileSize: string;
    rawSize: number;
    mediaType: string;
  }> {
    return await request('/tuition/media-upload', {
      method: 'POST',
      body: JSON.stringify({ base64, fileName, mimeType }),
    });
  },

  async getFeeRecords(batchId?: string): Promise<StudentFeeItem[]> {
    try {
      const q = batchId ? `?batchId=${batchId}` : '';
      return await request<StudentFeeItem[]>(`/tuition/fees${q}`);
    } catch {
      return [];
    }
  },

  async getFeeSummary(): Promise<FeeSummaryOverview> {
    try {
      return await request<FeeSummaryOverview>('/tuition/fees/summary');
    } catch {
      return {
        totalReceivable: 0,
        totalCollected: 0,
        totalPending: 0,
        overdueCount: 0,
        remindersSentThisMonth: 0,
      };
    }
  },

  async dispatchFeeReminder(dto: DispatchFeeReminderDto): Promise<{ success: boolean; message: string; reminderId: string }> {
    return await request<{ success: boolean; message: string; reminderId: string }>('/tuition/fees/remind', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },
};
