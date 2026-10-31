import { apiClient } from './client';
import type {
  AcademicQueryItem,
  InAppNotification,
  PersonalStudyTaskItem,
  StudentAnnouncementItem,
  StudentAssessmentResult,
  StudentAssignmentItem,
  StudentAttendanceSummary,
  StudentDashboard,
  StudentDocumentItem,
  StudentFeeSummary,
  StudentProfile,
  StudentTeachingDiaryItem,
  StudentTestDetails,
  StudentTestAttemptResult,
  StudentTestItem,
  StudentTimetableDay,
  StudyMaterialItem,
} from '@padhai-pilot/shared';

export type {
  AcademicQueryItem,
  InAppNotification,
  PersonalStudyTaskItem,
  StudentAnnouncementItem,
  StudentAssessmentResult,
  StudentAssignmentItem,
  StudentAttendanceSummary,
  StudentDashboard,
  StudentDocumentItem,
  StudentFeeSummary,
  StudentProfile,
  StudentTeachingDiaryItem,
  StudentTestDetails,
  StudentTestAttemptResult,
  StudentTestItem,
  StudentTimetableDay,
  StudyMaterialItem,
};

interface Ack {
  success: boolean;
  message: string;
}

const list = <T>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : []);

/**
 * Student API client. Every method maps 1:1 onto a route in StudentController (or the assessment
 * student routes) and returns the server's shared contract types. There are deliberately no
 * client-side fallbacks: failures propagate so screens can show an error state with retry.
 */
export const studentService = {
  getDashboard: () => apiClient.get<StudentDashboard>('/student/dashboard'),
  getProfile: () => apiClient.get<StudentProfile>('/student/profile'),
  updateProfile: (data: { fullName?: string; phone?: string }) =>
    apiClient.put<StudentProfile>('/student/profile', data),

  validateInvitation: (code: string) =>
    apiClient.post<{ valid: boolean; instituteName: string; batchName: string; subject: string; gradeLevel: string }>(
      '/student/validate-invitation',
      { code },
    ),
  joinBatch: (code: string) =>
    apiClient.post<Ack & { instituteName: string; batchName: string }>('/student/join-batch', { code }),

  getDiary: async (subject?: string) =>
    list(
      await apiClient.get<StudentTeachingDiaryItem[]>(
        `/student/diary${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`,
      ),
    ),
  getTimetable: async () => list(await apiClient.get<StudentTimetableDay[]>('/student/timetable')),

  getAttendance: () => apiClient.get<StudentAttendanceSummary>('/student/attendance'),
  requestAttendanceCorrection: (data: { date: string; reason: string }) =>
    apiClient.post<Ack>('/student/attendance/correction-request', data),

  getAssignments: async () => list(await apiClient.get<StudentAssignmentItem[]>('/student/assignments')),
  submitAssignment: (id: string, data: { content?: string; attachmentUrl?: string; isDraft?: boolean }) =>
    apiClient.post<Ack & { status: string }>(`/student/assignments/${id}/submit`, data),

  getTests: async () => list(await apiClient.get<StudentTestItem[]>('/student/tests')),
  getTestDetails: (id: string) => apiClient.get<StudentTestDetails>(`/student/tests/${id}`),
  submitTest: (id: string, answers: Array<{ questionId: string; selectedOptionIndex?: number }>) =>
    apiClient.post<StudentTestAttemptResult>(`/student/tests/${id}/attempt`, { answers }),

  getResults: async () => list(await apiClient.get<StudentAssessmentResult[]>('/student/results')),
  getMaterials: async () => list(await apiClient.get<StudyMaterialItem[]>('/student/materials')),
  getFees: () => apiClient.get<StudentFeeSummary>('/student/fees'),
  getAnnouncements: async () => list(await apiClient.get<StudentAnnouncementItem[]>('/student/announcements')),

  getQueries: async () => list(await apiClient.get<AcademicQueryItem[]>('/student/queries')),
  askQuery: (data: { subject: string; topic?: string; questionText: string }) =>
    apiClient.post<Ack & { query: AcademicQueryItem }>('/student/queries', data),

  getStudyTasks: async () => list(await apiClient.get<PersonalStudyTaskItem[]>('/student/study-tasks')),
  createStudyTask: (data: { title: string; subject?: string; dueDate?: string; priority?: 'NORMAL' | 'HIGH' | 'LOW' }) =>
    apiClient.post<PersonalStudyTaskItem>('/student/study-tasks', data),
  updateStudyTask: (id: string, data: { isCompleted?: boolean; title?: string }) =>
    apiClient.put<PersonalStudyTaskItem>(`/student/study-tasks/${id}`, data),
  deleteStudyTask: (id: string) => apiClient.delete<Ack>(`/student/study-tasks/${id}`),

  getDocuments: async () => list(await apiClient.get<StudentDocumentItem[]>('/student/documents')),
  submitSupportRequest: (data: {
    category: 'PROFILE_CORRECTION' | 'ATTENDANCE_MISMATCH' | 'PAYMENT_ISSUE' | 'ACADEMIC_HELP' | 'TECHNICAL_SUPPORT';
    subject: string;
    description: string;
  }) => apiClient.post<Ack>('/student/support-request', data),

  getNotifications: async () =>
    list(await apiClient.get<InAppNotification[]>('/assessment/student/notifications')),
  markNotificationRead: (id: string) => apiClient.put<unknown>(`/assessment/student/notifications/${id}/read`, {}),
};
