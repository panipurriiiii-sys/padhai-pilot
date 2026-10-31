import {
  StudentAssessmentResult,
  InAppNotification,
  UserSession,
  StudyMaterialItem,
  StudentAnalyticsSummary,
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
  base = base.replace(/\/+$/, '');
  if (!base.endsWith('/api')) {
    base = `${base}/api`;
  }
  return base;
}

let cachedToken: string | null = null;
let cachedSession: UserSession | null = null;

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  if (!cachedToken) {
    cachedToken = localStorage.getItem('padhaipilot_student_token');
  }
  return cachedToken;
}

export function setAuthToken(token: string) {
  cachedToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('padhaipilot_student_token', token);
  }
}

export function clearAuthToken() {
  cachedToken = null;
  cachedSession = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('padhaipilot_student_token');
    localStorage.removeItem('padhaipilot_student_session');
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
    res = await fetch(url, { ...options, headers, credentials: 'include' });
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

/** Normalised API failure: status 0 means the server could not be reached. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface StudentProfileData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  role: string;
  rollNumber: string;
  instituteId: string;
  instituteName: string;
  batchId: string;
  batchName: string;
  subject: string;
  academicYear: string;
  joinedAt: string;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
    results: boolean;
    fees: boolean;
  };
}

export interface TeachingDiaryEntry {
  id: string;
  lessonDate: string;
  sessionTime?: string;
  subject: string;
  facultyName: string;
  batchName: string;
  chapterTitle: string;
  conceptsTaught: string;
  learningObjectives?: string;
  homeworkAssigned?: string;
  attachmentUrl?: string;
  referenceLinks?: string[];
  createdAt: string;
}

export interface TimetableDay {
  day: string;
  slots: Array<{
    time: string;
    subject: string;
    topic: string;
    room: string;
    faculty: string;
  }>;
}

export interface AssignmentItem {
  id: string;
  title: string;
  instructions: string;
  subject: string;
  dueDate: string;
  maxMarks: number;
  attachmentUrl?: string;
  status: 'PENDING' | 'SUBMITTED' | 'LATE' | 'GRADED' | 'RESUBMIT';
  submission?: {
    submittedAt: string;
    content?: string;
    attachmentUrl?: string;
    marksObtained?: number;
    feedback?: string;
  };
}

export interface TestItem {
  id: string;
  title: string;
  instructions?: string;
  subject: string;
  scheduledDate: string;
  durationMinutes: number;
  totalMarks: number;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  attempt?: {
    submittedAt: string;
    score: number;
    status: string;
    feedback?: string;
  };
}

export interface AcademicQuery {
  id: string;
  subject: string;
  topic?: string;
  questionText: string;
  attachmentUrl?: string;
  status: 'PENDING' | 'ANSWERED';
  facultyReply?: string;
  repliedAt?: string;
  facultyName?: string;
  createdAt: string;
}

export interface StudyTask {
  id: string;
  title: string;
  subject?: string;
  dueDate?: string;
  priority: 'NORMAL' | 'HIGH' | 'LOW';
  isCompleted: boolean;
  createdAt: string;
}

export interface OfficialDocument {
  id: string;
  title: string;
  category: 'REPORT_CARD' | 'FEE_RECEIPT' | 'STUDY_MATERIAL' | 'TIMETABLE_SCHEDULE' | 'CERTIFICATE';
  issueDate: string;
  academicPeriod: string;
  downloadUrl: string;
  fileSize?: string;
}

export const studentApi = {
  // Authentication & Onboarding
  async login(email: string, password: string): Promise<{ user: UserSession; token: string }> {
    const res = await request<{ user: UserSession; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) setAuthToken(res.token);
    if (res.user) {
      cachedSession = res.user;
      if (typeof window !== 'undefined') {
        localStorage.setItem('padhaipilot_student_session', JSON.stringify(res.user));
      }
    }
    return res;
  },

  async register(data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    invitationCode?: string;
  }): Promise<{ user: UserSession; token: string }> {
    const res = await request<{ user: UserSession; token: string }>('/auth/register-student', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) setAuthToken(res.token);
    if (res.user) {
      cachedSession = res.user;
      if (typeof window !== 'undefined') {
        localStorage.setItem('padhaipilot_student_session', JSON.stringify(res.user));
      }
    }
    return res;
  },

  /** Verifies the stored token with the server; returns null (and clears it) if it is no longer valid. */
  async verifySession(): Promise<UserSession | null> {
    if (!getAuthToken()) return null;
    const res = await request<{ authenticated: boolean; user: UserSession }>('/auth/me');
    if (!res.authenticated || !res.user) {
      clearAuthToken();
      return null;
    }
    cachedSession = res.user;
    if (typeof window !== 'undefined') localStorage.setItem('padhaipilot_student_session', JSON.stringify(res.user));
    return res.user;
  },

  getStudentSession(): UserSession | null {
    if (cachedSession) return cachedSession;
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('padhaipilot_student_session');
    if (stored) {
      cachedSession = JSON.parse(stored);
      return cachedSession;
    }
    return null;
  },

  // 1. Dashboard Overview
  async getDashboard(): Promise<any> {
    return await request('/student/dashboard');
  },

  // 2. Invitation & Batch Enrollment
  async validateInvitation(code: string): Promise<{
    valid: boolean;
    code: string;
    instituteName: string;
    batchName: string;
    subject: string;
    gradeLevel: string;
  }> {
    return await request('/student/validate-invitation', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  /** The API re-issues the session for the new tenant: store the fresh token and user. */
  async joinBatch(code: string): Promise<{ alreadyEnrolled: boolean; token: string; user: UserSession }> {
    const res = await request<{ alreadyEnrolled: boolean; token: string; user: UserSession }>('/student/join-batch', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    if (res.token) setAuthToken(res.token);
    if (res.user) {
      cachedSession = res.user;
      if (typeof window !== 'undefined') localStorage.setItem('padhaipilot_student_session', JSON.stringify(res.user));
    }
    return res;
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; user: UserSession; token: string }> {
    const res = await request<{ success: boolean; user: UserSession; token: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    if (res.token) setAuthToken(res.token);
    if (res.user) {
      cachedSession = res.user;
      if (typeof window !== 'undefined') localStorage.setItem('padhaipilot_student_session', JSON.stringify(res.user));
    }
    return res;
  },

  /** GET /analytics/student - null percentages mean no data. */
  async getAnalytics(): Promise<StudentAnalyticsSummary> {
    return request<StudentAnalyticsSummary>('/analytics/student');
  },

  // 3. Profile & Settings
  async getProfile(): Promise<StudentProfileData> {
    return await request('/student/profile');
  },

  async updateProfile(dto: { fullName?: string; phone?: string; avatarUrl?: string }): Promise<void> {
    await request('/student/profile', {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  // 4. Daily Teaching Diary
  async getTeachingDiaries(subject?: string, search?: string): Promise<TeachingDiaryEntry[]> {
    const params = new URLSearchParams();
    if (subject && subject !== 'ALL') params.set('subject', subject);
    if (search && search.trim()) params.set('search', search.trim());
    const q = params.toString() ? `?${params.toString()}` : '';
    return await request<TeachingDiaryEntry[]>(`/student/diary${q}`);
  },

  // 5. Timetable & Schedule
  async getTimetable(): Promise<TimetableDay[]> {
    return await request<TimetableDay[]>('/student/timetable');
  },

  // 6. Attendance & History
  async getAttendance(): Promise<{
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
  }> {
    return await request('/student/attendance');
  },

  async submitAttendanceCorrection(date: string, reason: string): Promise<{ success: boolean; message: string }> {
    return await request('/student/attendance/correction-request', {
      method: 'POST',
      body: JSON.stringify({ date, reason }),
    });
  },

  // 7. Homework & Assignments
  async getAssignments(): Promise<AssignmentItem[]> {
    return await request<AssignmentItem[]>('/student/assignments');
  },

  async submitAssignment(
    id: string,
    payload: { content?: string; attachmentUrl?: string; isDraft?: boolean },
  ): Promise<{ success: boolean; message: string; status: string }> {
    return await request(`/student/assignments/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // 8. Tests & Quizzes
  async getTests(): Promise<TestItem[]> {
    return await request<TestItem[]>('/student/tests');
  },

  async getTestDetails(id: string): Promise<any> {
    return await request(`/student/tests/${id}`);
  },

  async submitTestAttempt(
    testId: string,
    answers: Array<{ questionId: string; selectedOptionIndex?: number; textAnswer?: string }>,
  ): Promise<{ success: boolean; score: number; totalMarks: number; percentage: number; feedback: string }> {
    return await request(`/student/tests/${testId}/attempt`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },

  // 9. Published Results
  async getPublishedResults(): Promise<StudentAssessmentResult[]> {
    return await request<StudentAssessmentResult[]>('/assessment/student/results');
  },

  // 10. Study Materials Library
  async getStudyMaterials(batchId?: string, category?: string): Promise<StudyMaterialItem[]> {
    const params = new URLSearchParams();
    if (batchId && batchId !== 'ALL') params.set('batchId', batchId);
    if (category && category !== 'ALL') params.set('category', category);
    const query = params.toString() ? `?${params.toString()}` : '';
    return await request<StudyMaterialItem[]>(`/student/materials${query}`);
  },

  // 11. Fees & Receipts
  async getFees(): Promise<{
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
  }> {
    return await request('/student/fees');
  },

  // 12. Announcements
  async getAnnouncements(): Promise<Array<{
    id: string;
    title: string;
    content: string;
    date: string;
    priority: 'NORMAL' | 'URGENT';
    authorName?: string;
  }>> {
    return await request('/student/announcements');
  },

  // 13. Academic Queries (Student-to-Faculty)
  async getAcademicQueries(): Promise<AcademicQuery[]> {
    return await request<AcademicQuery[]>('/student/queries');
  },

  async submitAcademicQuery(dto: {
    subject: string;
    topic?: string;
    questionText: string;
    attachmentUrl?: string;
  }): Promise<{ success: boolean; message: string; query: AcademicQuery }> {
    return await request('/student/queries', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  // 14. Study Planner & Personal Tasks
  async getStudyTasks(): Promise<StudyTask[]> {
    return await request<StudyTask[]>('/student/study-tasks');
  },

  async createStudyTask(dto: {
    title: string;
    subject?: string;
    dueDate?: string;
    priority?: 'NORMAL' | 'HIGH' | 'LOW';
  }): Promise<StudyTask> {
    return await request('/student/study-tasks', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async updateStudyTask(taskId: string, isCompleted: boolean): Promise<StudyTask> {
    return await request(`/student/study-tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ isCompleted }),
    });
  },

  async deleteStudyTask(taskId: string): Promise<void> {
    await request(`/student/study-tasks/${taskId}`, { method: 'DELETE' });
  },

  // 15. Student Documents & PDF Center
  async getDocuments(): Promise<OfficialDocument[]> {
    return await request<OfficialDocument[]>('/student/documents');
  },

  // 16. Support Requests
  async submitSupportRequest(dto: {
    category: 'PROFILE_CORRECTION' | 'ATTENDANCE_MISMATCH' | 'PAYMENT_ISSUE' | 'ACADEMIC_HELP' | 'TECHNICAL_SUPPORT';
    subject: string;
    description: string;
  }): Promise<{ success: boolean; message: string; ticketId: string }> {
    return await request('/student/support-request', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  // 17. In-App Notifications
  async getNotifications(): Promise<InAppNotification[]> {
    return await request<InAppNotification[]>('/assessment/student/notifications');
  },

  async markNotificationRead(id: string): Promise<void> {
    await request(`/assessment/student/notifications/${id}/read`, { method: 'PUT' });
  },
};
