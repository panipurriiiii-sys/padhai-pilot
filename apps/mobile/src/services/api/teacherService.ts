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
  SalaryStatementItem,
  StudentRosterItem,
  StudyMaterialCategory,
  StudyMaterialItem,
  TeacherDashboardMetrics,
  TimetableSlot,
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
  SalaryStatementItem,
  StudentRosterItem,
  StudyMaterialCategory,
  StudyMaterialItem,
  TeacherDashboardMetrics,
  TimetableSlot,
};

export interface BatchRoster {
  batch: BatchSummary;
  students: StudentRosterItem[];
}

const list = <T>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : []);

/**
 * Teacher / faculty API client. Maps 1:1 onto TeacherController, AssessmentController and the
 * faculty-facing TuitionController routes. No client-side fallbacks: errors reach the screen.
 * Owner-only operations (faculty roster, payroll generation, leave approval, fees) are intentionally
 * not exposed on mobile.
 */
export const teacherService = {
  getDashboard: () => apiClient.get<TeacherDashboardMetrics>('/teacher/dashboard'),
  getBatches: async () => list(await apiClient.get<BatchSummary[]>('/teacher/batches')),
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
  }) => apiClient.post<Assignment>('/teacher/assignments', data),
  getSubmissions: async (assignmentId: string) =>
    list(await apiClient.get<AssignmentSubmission[]>(`/teacher/assignments/${assignmentId}/submissions`)),
  gradeSubmission: (submissionId: string, data: { marksObtained: number; feedback?: string; resubmit?: boolean }) =>
    apiClient.post<AssignmentSubmission>(`/teacher/assignments/submissions/${submissionId}/grade`, data),

  // Invitations
  getInvitations: async () => list(await apiClient.get<InvitationCode[]>('/teacher/invitations')),
  createInvitation: (data: { batchId?: string; maxUses?: number; expiryDays?: number }) =>
    apiClient.post<InvitationCode>('/teacher/invitations', data),
  revokeInvitation: (code: string) => apiClient.post<unknown>(`/teacher/invitations/${encodeURIComponent(code)}/revoke`, {}),

  // Timetable & announcements
  getTimetable: async () => list(await apiClient.get<TimetableSlot[]>('/teacher/timetable')),
  getAnnouncements: async () => list(await apiClient.get<AnnouncementItem[]>('/teacher/announcements')),
  createAnnouncement: (data: { batchId?: string; title: string; content: string; priority?: 'NORMAL' | 'URGENT' }) =>
    apiClient.post<AnnouncementItem>('/teacher/announcements', data),

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
