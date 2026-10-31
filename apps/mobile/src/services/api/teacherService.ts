import { apiClient } from './client';
import type {
  AnnouncementItem,
  ApplyFacultyLeaveDto,
  Assignment,
  AssignmentSubmission,
  AttendanceSession,
  AttendanceStatus,
  BatchSummary,
  BulkMarksSaveDraftPayload,
  ClassroomAssessment,
  CreateStudyMaterialDto,
  CreateTeachingDiaryDto,
  DailyTeachingDiaryEntry,
  FacultyLeaveItem,
  InvitationCode,
  LessonPlan,
  SalaryStatementItem,
  StudentRosterItem,
  StudyMaterialCategory,
  StudyMaterialItem,
  TeacherDashboardMetrics,
  TestQuiz,
  TimetableSlot,
  BatchRoster,
  BroadcastItem,
  CreateBatchPayload,
  CreateBroadcastPayload,
  CreateBroadcastResult,
  CreateEnrollmentCodePayload,
  CreateTimetableSlotPayload,
  EnrollmentCode,
  PromoteBatchPayload,
  PromoteBatchResult,
  TeacherBatch,
  TimetableSlotItem,
  UpdateBatchPayload,
  UpdateEnrollmentCodePayload,
  UpdateTimetableSlotPayload,
} from '@padhai-pilot/shared';

export type {
  AnnouncementItem,
  ApplyFacultyLeaveDto,
  Assignment,
  AssignmentSubmission,
  AttendanceSession,
  AttendanceStatus,
  BatchSummary,
  BulkMarksSaveDraftPayload,
  ClassroomAssessment,
  CreateStudyMaterialDto,
  CreateTeachingDiaryDto,
  DailyTeachingDiaryEntry,
  FacultyLeaveItem,
  InvitationCode,
  LessonPlan,
  SalaryStatementItem,
  StudentRosterItem,
  StudyMaterialCategory,
  StudyMaterialItem,
  TeacherDashboardMetrics,
  TestQuiz,
  TimetableSlot,
  BatchRoster,
  BroadcastItem,
  CreateBatchPayload,
  CreateBroadcastPayload,
  CreateBroadcastResult,
  CreateEnrollmentCodePayload,
  CreateTimetableSlotPayload,
  EnrollmentCode,
  PromoteBatchPayload,
  PromoteBatchResult,
  TeacherBatch,
  TimetableSlotItem,
  UpdateBatchPayload,
  UpdateEnrollmentCodePayload,
  UpdateTimetableSlotPayload,
};

const list = <T>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : []);

/**
 * Teacher / faculty API client. Maps 1:1 onto TeacherController, AssessmentController and the
 * faculty-facing TuitionController routes. No client-side fallbacks: errors reach the screen.
 * Owner-only operations (faculty roster, payroll generation, leave approval, fees) are intentionally
 * not exposed on mobile.
 */
export const teacherService = {
  getDashboard: () => apiClient.get<TeacherDashboardMetrics>('/teacher/dashboard'),
  getBatches: async () => list(await apiClient.get<TeacherBatch[]>('/teacher/batches')),
  createBatch: (data: CreateBatchPayload) => apiClient.post<TeacherBatch>('/teacher/batches', data),
  updateBatch: (batchId: string, data: UpdateBatchPayload) => apiClient.patch<TeacherBatch>(`/teacher/batches/${batchId}`, data),
  promoteBatch: (batchId: string, data: PromoteBatchPayload) =>
    apiClient.post<PromoteBatchResult>(`/teacher/batches/${batchId}/promote`, data),
  getRoster: (batchId: string) => apiClient.get<BatchRoster>(`/teacher/batches/${batchId}/students`),

  // Attendance
  getAttendance: (batchId: string, date: string) =>
    apiClient.get<AttendanceSession>(`/teacher/attendance/${batchId}/${date}`),
  saveAttendance: (data: {
    batchId: string;
    date: string;
    records: Array<{ studentId: string; status: AttendanceStatus; note?: string }>;
  }) => apiClient.post<AttendanceSession>('/teacher/attendance', data),

  // Marks & results
  getAssessments: async (batchId?: string) =>
    list(await apiClient.get<ClassroomAssessment[]>(`/assessment${batchId ? `?batchId=${batchId}` : ''}`)),
  saveMarksDraft: (payload: BulkMarksSaveDraftPayload) =>
    apiClient.post<{ success: boolean; assessmentId: string; message: string; savedCount: number }>('/assessment/draft', payload),
  publishAssessment: (id: string) => apiClient.post<unknown>(`/assessment/${id}/publish`, {}),

  // Assignments
  getAssignments: async () => list(await apiClient.get<Assignment[]>('/teacher/assignments')),
  createAssignment: (data: {
    batchId: string;
    title: string;
    instructions: string;
    subject: string;
    dueDate: string;
    maxMarks?: number;
    attachmentUrl?: string;
  }) => apiClient.post<Assignment>('/teacher/assignments', data),
  getSubmissions: async (assignmentId: string) =>
    list(await apiClient.get<AssignmentSubmission[]>(`/teacher/assignments/${assignmentId}/submissions`)),
  gradeSubmission: (submissionId: string, data: { marksObtained: number; feedback?: string; resubmit?: boolean }) =>
    apiClient.post<AssignmentSubmission>(`/teacher/assignments/submissions/${submissionId}/grade`, data),

  // Tests & quizzes (creation with question editing stays on the web portal)
  getTests: async () => list(await apiClient.get<TestQuiz[]>('/teacher/tests')),
  toggleTestResults: (testId: string) => apiClient.post<TestQuiz>(`/teacher/tests/${testId}/release-results`, {}),

  // Curriculum plans
  getLessonPlans: async () => list(await apiClient.get<LessonPlan[]>('/teacher/lesson-plans')),
  createLessonPlan: (data: { batchId: string; title: string; topic: string; subject: string; weekNumber: number; content: string }) =>
    apiClient.post<LessonPlan>('/teacher/lesson-plans', data),
  toggleLessonPlan: (planId: string) => apiClient.put<LessonPlan>(`/teacher/lesson-plans/${planId}/toggle`, {}),

  // Enrolment codes (no default expiry; share text/link come from the server)
  getInvitations: async (batchId?: string) =>
    list(await apiClient.get<EnrollmentCode[]>(`/teacher/invitations${batchId ? `?batchId=${batchId}` : ''}`)),
  createInvitation: (data: CreateEnrollmentCodePayload) => apiClient.post<EnrollmentCode>('/teacher/invitations', data),
  updateInvitation: (id: string, data: UpdateEnrollmentCodePayload) =>
    apiClient.patch<EnrollmentCode>(`/teacher/invitations/${id}`, data),
  revokeInvitation: (id: string) => apiClient.post<unknown>(`/teacher/invitations/${encodeURIComponent(id)}/revoke`, {}),
  reactivateInvitation: (id: string) => apiClient.post<EnrollmentCode>(`/teacher/invitations/${id}/reactivate`, {}),
  regenerateInvitation: (id: string) => apiClient.post<EnrollmentCode>(`/teacher/invitations/${id}/regenerate`, {}),

  // Weekly timetable CRUD (per batch)
  getTimetable: async (batchId?: string) =>
    list(await apiClient.get<TimetableSlotItem[]>(`/teacher/timetable${batchId ? `?batchId=${batchId}` : ''}`)),
  createSlot: (batchId: string, data: CreateTimetableSlotPayload) =>
    apiClient.post<TimetableSlotItem>(`/teacher/batches/${batchId}/timetable`, data),
  updateSlot: (slotId: string, data: UpdateTimetableSlotPayload) =>
    apiClient.patch<TimetableSlotItem>(`/teacher/timetable/${slotId}`, data),
  deleteSlot: (slotId: string) => apiClient.delete<{ success: boolean }>(`/teacher/timetable/${slotId}`),

  // Academic broadcast
  getAnnouncements: async (batchId?: string) =>
    list(await apiClient.get<BroadcastItem[]>(`/teacher/announcements${batchId ? `?batchId=${batchId}` : ''}`)),
  createAnnouncement: (data: CreateBroadcastPayload) => apiClient.post<CreateBroadcastResult>('/teacher/announcements', data),
  deleteAnnouncement: (id: string) => apiClient.delete<{ success: boolean }>(`/teacher/announcements/${id}`),

  // Daily teaching diary & study material (tuition module)
  getDiaries: async () => list(await apiClient.get<DailyTeachingDiaryEntry[]>('/tuition/diaries')),
  createDiary: (dto: CreateTeachingDiaryDto) => apiClient.post<DailyTeachingDiaryEntry>('/tuition/diaries', dto),
  getMaterials: async () => list(await apiClient.get<StudyMaterialItem[]>('/tuition/materials')),
  createMaterial: (dto: CreateStudyMaterialDto) => apiClient.post<StudyMaterialItem>('/tuition/materials', dto),

  // Own HR records (the server pins these to the signed-in faculty member)
  getLeaves: async () => list(await apiClient.get<FacultyLeaveItem[]>('/tuition/leaves')),
  applyLeave: (dto: ApplyFacultyLeaveDto) => apiClient.post<FacultyLeaveItem>('/tuition/leaves/apply', dto),
  getSalaries: async () => list(await apiClient.get<SalaryStatementItem[]>('/tuition/salaries')),
};
