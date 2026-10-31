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
  TeacherAnalyticsSummary,
  TeacherBatch,
  CreateBatchPayload,
  UpdateBatchPayload,
  PromoteBatchPayload,
  PromoteBatchResult,
  EnrollmentCode,
  CreateEnrollmentCodePayload,
  UpdateEnrollmentCodePayload,
  TimetableSlotItem,
  CreateTimetableSlotPayload,
  UpdateTimetableSlotPayload,
  BroadcastItem,
  CreateBroadcastPayload,
  CreateBroadcastResult,
  CreateBatchFeeStructureRequest,
  BatchFeeStructureItem,
  FeeLedgerItem,
  BatchFeeSummary,
  RecordFeePaymentRequest,
  FeePaymentItem,
  SendFeeRemindersRequest,
  SendFeeRemindersResult,
  StudentLeaveItem,
  ReviewStudentLeaveRequest,
  InstituteLetterhead,
  UpdateInstituteLetterheadRequest,
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

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const raw = (errorData as { message?: string | string[] }).message;
    const message = Array.isArray(raw) ? raw.join(', ') : raw || `Request failed (${res.status})`;
    if (res.status === 401 && token && !endpoint.startsWith('/auth/')) {
      clearAuthToken();
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('pp:unauthorized'));
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Fetches a server-rendered PDF (document routes need the bearer token) and returns it as a Blob. */
export async function fetchDocumentBlob(path: string): Promise<Blob> {
  const token = getAuthToken();
  let res: Response;
  try {
    res = await fetch(`${getCleanApiBaseUrl()}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError((body as { message?: string }).message || `Could not generate the document (${res.status})`, res.status);
  }
  return res.blob();
}

/** Opens a PDF blob in a new tab (or downloads it when popups are blocked). */
export function openBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank');
  if (!w) {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Normalised API failure: `status` 0 means the server could not be reached. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
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

  /** The API rotates the session on password change: it returns a fresh token that replaces the old one. */
  async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; user: UserSession; token: string }> {
    const res = await request<{ success: boolean; user: UserSession; token: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    if (res.token) setAuthToken(res.token);
    return res;
  },

  // -------------------------------------------------------------
  // ANALYTICS (null values mean "no data": render an empty state, never zero)
  // -------------------------------------------------------------
  async getAnalytics(): Promise<TeacherAnalyticsSummary> {
    return request<TeacherAnalyticsSummary>('/analytics/teacher');
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
    return await request<TeacherDashboardMetrics>('/teacher/dashboard');
  },

  async getBatches(): Promise<BatchSummary[]> {
    return await request<BatchSummary[]>('/teacher/batches');
  },

  async getBatchRoster(batchId: string): Promise<{ batch: BatchSummary; students: StudentRosterItem[] }> {
    return await request<{ batch: BatchSummary; students: StudentRosterItem[] }>(
      `/teacher/batches/${batchId}/students`,
    );
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
    return await request<InvitationCode[]>('/teacher/invitations');
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
    return await request<any>(`/teacher/attendance/${batchId}/${date}`);
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
    return await request<Assignment[]>('/teacher/assignments');
  },

  async createAssignment(data: {
    batchId: string;
    title: string;
    instructions: string;
    subject: string;
    dueDate: string;
    maxMarks?: number;
    attachmentUrl?: string;
  }): Promise<Assignment> {
    return await request<Assignment>('/teacher/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getSubmissions(assignmentId: string): Promise<{ assignment: Assignment; submissions: AssignmentSubmission[] }> {
    return await request<{ assignment: Assignment; submissions: AssignmentSubmission[] }>(
      `/teacher/assignments/${assignmentId}/submissions`,
    );
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
    return await request<TestQuiz[]>('/teacher/tests');
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
    return await request<LessonPlan[]>('/teacher/lesson-plans');
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
    return await request<TimetableSlot[]>('/teacher/timetable');
  },

  async getAnnouncements(): Promise<AnnouncementItem[]> {
    return await request<AnnouncementItem[]>('/teacher/announcements');
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
    return await request<TeacherReports>('/teacher/reports');
  },

  // -------------------------------------------------------------
  // BULK ATTENDANCE & MARKS ENTRY (CLASSROOM ASSESSMENTS)
  // -------------------------------------------------------------
  async getAssessments(batchId?: string): Promise<ClassroomAssessment[]> {
    const q = batchId ? `?batchId=${batchId}` : '';
    return await request<ClassroomAssessment[]>(`/assessment${q}`);
  },

  async getAssessmentDetails(id: string): Promise<{ assessment: ClassroomAssessment; roster: AssessmentMarkItem[] }> {
    return await request<{ assessment: ClassroomAssessment; roster: AssessmentMarkItem[] }>(`/assessment/${id}`);
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
  // ACADEMIC CORE (batch edit/promote, enrolment codes, timetable CRUD, broadcast)
  // -------------------------------------------------------------
  async listBatches(includeArchived = false): Promise<TeacherBatch[]> {
    return request<TeacherBatch[]>(`/teacher/batches?includeArchived=${includeArchived}`);
  },
  async createBatchV2(data: CreateBatchPayload): Promise<TeacherBatch> {
    return request<TeacherBatch>('/teacher/batches', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateBatch(batchId: string, data: UpdateBatchPayload): Promise<TeacherBatch> {
    return request<TeacherBatch>(`/teacher/batches/${batchId}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  async archiveBatch(batchId: string, archive: boolean): Promise<TeacherBatch> {
    return request<TeacherBatch>(`/teacher/batches/${batchId}/${archive ? 'archive' : 'unarchive'}`, { method: 'POST' });
  },
  async promoteBatch(batchId: string, data: PromoteBatchPayload): Promise<PromoteBatchResult> {
    return request<PromoteBatchResult>(`/teacher/batches/${batchId}/promote`, { method: 'POST', body: JSON.stringify(data) });
  },

  async listEnrollmentCodes(batchId?: string): Promise<EnrollmentCode[]> {
    return request<EnrollmentCode[]>(`/teacher/invitations${batchId ? `?batchId=${batchId}` : ''}`);
  },
  async createEnrollmentCode(data: CreateEnrollmentCodePayload): Promise<EnrollmentCode> {
    return request<EnrollmentCode>('/teacher/invitations', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateEnrollmentCode(id: string, data: UpdateEnrollmentCodePayload): Promise<EnrollmentCode> {
    return request<EnrollmentCode>(`/teacher/invitations/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  async revokeEnrollmentCode(id: string): Promise<{ success: boolean; message: string; code: string }> {
    return request(`/teacher/invitations/${id}/revoke`, { method: 'POST' });
  },
  async reactivateEnrollmentCode(id: string): Promise<EnrollmentCode> {
    return request<EnrollmentCode>(`/teacher/invitations/${id}/reactivate`, { method: 'POST' });
  },
  async regenerateEnrollmentCode(id: string): Promise<EnrollmentCode> {
    return request<EnrollmentCode>(`/teacher/invitations/${id}/regenerate`, { method: 'POST' });
  },

  async listTimetable(batchId?: string): Promise<TimetableSlotItem[]> {
    return request<TimetableSlotItem[]>(`/teacher/timetable${batchId ? `?batchId=${batchId}` : ''}`);
  },
  async createTimetableSlot(batchId: string, data: CreateTimetableSlotPayload): Promise<TimetableSlotItem> {
    return request<TimetableSlotItem>(`/teacher/batches/${batchId}/timetable`, { method: 'POST', body: JSON.stringify(data) });
  },
  async updateTimetableSlot(slotId: string, data: UpdateTimetableSlotPayload): Promise<TimetableSlotItem> {
    return request<TimetableSlotItem>(`/teacher/timetable/${slotId}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  async deleteTimetableSlot(slotId: string): Promise<{ success: boolean }> {
    return request(`/teacher/timetable/${slotId}`, { method: 'DELETE' });
  },

  async listBroadcasts(batchId?: string): Promise<BroadcastItem[]> {
    return request<BroadcastItem[]>(`/teacher/announcements${batchId ? `?batchId=${batchId}` : ''}`);
  },
  async createBroadcast(data: CreateBroadcastPayload): Promise<CreateBroadcastResult> {
    return request<CreateBroadcastResult>('/teacher/announcements', { method: 'POST', body: JSON.stringify(data) });
  },
  async deleteBroadcast(id: string): Promise<{ success: boolean }> {
    return request(`/teacher/announcements/${id}`, { method: 'DELETE' });
  },

  // -------------------------------------------------------------
  // FINANCE (batch fees, payments, receipts, reminders, student leave)
  // -------------------------------------------------------------
  async createFeeStructure(batchId: string, data: CreateBatchFeeStructureRequest): Promise<BatchFeeStructureItem> {
    return request<BatchFeeStructureItem>(`/finance/batches/${batchId}/structures`, { method: 'POST', body: JSON.stringify(data) });
  },
  async listFeeStructures(batchId: string): Promise<BatchFeeStructureItem[]> {
    return request<BatchFeeStructureItem[]>(`/finance/batches/${batchId}/structures`);
  },
  async voidFeeStructure(id: string): Promise<{ success: boolean }> {
    return request(`/finance/structures/${id}/void`, { method: 'POST' });
  },
  async listBatchFees(batchId: string): Promise<FeeLedgerItem[]> {
    return request<FeeLedgerItem[]>(`/finance/batches/${batchId}/fees`);
  },
  async getBatchFeeSummary(batchId: string): Promise<BatchFeeSummary> {
    return request<BatchFeeSummary>(`/finance/batches/${batchId}/summary`);
  },
  async recordFeePayment(feeRecordId: string, data: RecordFeePaymentRequest): Promise<FeePaymentItem> {
    return request<FeePaymentItem>(`/finance/fees/${feeRecordId}/payments`, { method: 'POST', body: JSON.stringify(data) });
  },
  async voidFeePayment(paymentId: string, reason: string): Promise<{ success: boolean }> {
    return request(`/finance/payments/${paymentId}/void`, { method: 'POST', body: JSON.stringify({ reason }) });
  },
  async sendFeeReminders(data: SendFeeRemindersRequest): Promise<SendFeeRemindersResult> {
    return request<SendFeeRemindersResult>('/finance/reminders/send', { method: 'POST', body: JSON.stringify(data) });
  },
  async listStudentLeaves(): Promise<StudentLeaveItem[]> {
    return request<StudentLeaveItem[]>('/finance/leaves');
  },
  async reviewStudentLeave(id: string, data: ReviewStudentLeaveRequest): Promise<StudentLeaveItem> {
    return request<StudentLeaveItem>(`/finance/leaves/${id}/review`, { method: 'PUT', body: JSON.stringify(data) });
  },

  // Branding / letterhead and server-rendered PDFs (institute name and logo, never the platform's)
  async getLetterhead(): Promise<InstituteLetterhead> {
    return request<InstituteLetterhead>('/branding');
  },
  async updateLetterhead(data: UpdateInstituteLetterheadRequest): Promise<InstituteLetterhead> {
    return request<InstituteLetterhead>('/branding', { method: 'PUT', body: JSON.stringify(data) });
  },
  async openFeeReceipt(paymentId: string) {
    openBlob(await fetchDocumentBlob(`/documents/fee-receipt/${paymentId}`), 'fee-receipt.pdf');
  },
  async openReportCard(studentId: string, batchId: string) {
    openBlob(await fetchDocumentBlob(`/documents/report-card/${studentId}?batchId=${batchId}`), 'report-card.pdf');
  },
  async openSalarySlip(recordId: string) {
    openBlob(await fetchDocumentBlob(`/documents/salary-slip/${recordId}`), 'salary-slip.pdf');
  },
  async openAttendanceReport(params: { batchId?: string; studentId?: string; from?: string; to?: string }) {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
    openBlob(await fetchDocumentBlob(`/documents/attendance-report?${q.toString()}`), 'attendance-report.pdf');
  },
  async openResultSheet(assessmentId: string) {
    openBlob(await fetchDocumentBlob(`/documents/result-sheet/${assessmentId}`), 'result-sheet.pdf');
  },

  // -------------------------------------------------------------
  // ADVANCED TUITION MANAGEMENT & FACULTY METHODS
  // -------------------------------------------------------------
  async getTuitionProfile(): Promise<TuitionBrandingProfile> {
    return await request<TuitionBrandingProfile>('/tuition/profile');
  },

  async updateTuitionProfile(dto: UpdateTuitionBrandingDto): Promise<TuitionBrandingProfile> {
    return await request<TuitionBrandingProfile>('/tuition/profile', {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async getFaculties(): Promise<FacultyMember[]> {
    return await request<FacultyMember[]>('/tuition/faculties');
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
    const q = new URLSearchParams();
    if (payPeriod) q.set('payPeriod', payPeriod);
    if (facultyId) q.set('facultyId', facultyId);
    return await request<SalaryStatementItem[]>(`/tuition/salaries?${q.toString()}`);
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
    const q = facultyId ? `?facultyId=${facultyId}` : '';
    return await request<FacultyLeaveItem[]>(`/tuition/leaves${q}`);
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
    const q = new URLSearchParams();
    if (batchId) q.set('batchId', batchId);
    if (facultyId) q.set('facultyId', facultyId);
    return await request<DailyTeachingDiaryEntry[]>(`/tuition/diaries?${q.toString()}`);
  },

  async getDiariesOverview(): Promise<TeachingDiaryOverview> {
    return await request<TeachingDiaryOverview>('/tuition/diaries/overview');
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
    const q = batchId ? `?batchId=${batchId}` : '';
    return await request<StudyMaterialItem[]>(`/tuition/materials${q}`);
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
    const q = batchId ? `?batchId=${batchId}` : '';
    return await request<StudentFeeItem[]>(`/tuition/fees${q}`);
  },

  async getFeeSummary(): Promise<FeeSummaryOverview> {
    return await request<FeeSummaryOverview>('/tuition/fees/summary');
  },

  async dispatchFeeReminder(dto: DispatchFeeReminderDto): Promise<{ success: boolean; message: string; reminderId: string }> {
    return await request<{ success: boolean; message: string; reminderId: string }>('/tuition/fees/remind', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },
};
