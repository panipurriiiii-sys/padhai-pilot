import {
  StudentAssessmentResult,
  InAppNotification,
  UserSession,
  StudyMaterialItem,
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
    console.warn(`Student API call to ${endpoint} failed:`, (err as Error).message);
    throw err;
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

  async loginDemoStudent(): Promise<{ user: UserSession; token: string }> {
    const res = await request<{ user: UserSession; token: string }>('/auth/demo-student');
    if (res.token) setAuthToken(res.token);
    if (res.user) {
      cachedSession = res.user;
      if (typeof window !== 'undefined') {
        localStorage.setItem('padhaipilot_student_session', JSON.stringify(res.user));
      }
    }
    return res;
  },

  getStudentSession(): UserSession | null {
    if (cachedSession) return cachedSession;
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('padhaipilot_student_session');
    if (stored) {
      try {
        cachedSession = JSON.parse(stored);
        return cachedSession;
      } catch {
        return null;
      }
    }
    return null;
  },

  // 1. Dashboard Overview
  async getDashboard(): Promise<any> {
    try {
      return await request('/student/dashboard');
    } catch {
      return null;
    }
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

  async joinBatch(code: string): Promise<{ success: boolean; message: string; batchName: string }> {
    return await request('/student/join-batch', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
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
    try {
      const params = new URLSearchParams();
      if (subject && subject !== 'ALL') params.set('subject', subject);
      if (search && search.trim()) params.set('search', search.trim());
      const q = params.toString() ? `?${params.toString()}` : '';
      return await request<TeachingDiaryEntry[]>(`/student/diary${q}`);
    } catch {
      return [];
    }
  },

  // 5. Timetable & Schedule
  async getTimetable(): Promise<TimetableDay[]> {
    try {
      return await request<TimetableDay[]>('/student/timetable');
    } catch {
      return [];
    }
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
    try {
      return await request('/student/attendance');
    } catch {
      return { totalClasses: 0, attended: 0, absent: 0, late: 0, percentage: 0, records: [] };
    }
  },

  async submitAttendanceCorrection(date: string, reason: string): Promise<{ success: boolean; message: string }> {
    return await request('/student/attendance/correction-request', {
      method: 'POST',
      body: JSON.stringify({ date, reason }),
    });
  },

  // 7. Homework & Assignments
  async getAssignments(): Promise<AssignmentItem[]> {
    try {
      return await request<AssignmentItem[]>('/student/assignments');
    } catch {
      return [];
    }
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
    try {
      return await request<TestItem[]>('/student/tests');
    } catch {
      return [];
    }
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
    try {
      return await request<StudentAssessmentResult[]>('/assessment/student/results');
    } catch {
      return [];
    }
  },

  // 10. Study Materials Library
  async getStudyMaterials(batchId?: string, category?: string): Promise<StudyMaterialItem[]> {
    try {
      const params = new URLSearchParams();
      if (batchId && batchId !== 'ALL') params.set('batchId', batchId);
      if (category && category !== 'ALL') params.set('category', category);
      const query = params.toString() ? `?${params.toString()}` : '';
      return await request<StudyMaterialItem[]>(`/student/materials${query}`);
    } catch {
      return [];
    }
  },

  // 11. Fees & Receipts
  async getFees(): Promise<{
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
  }> {
    try {
      return await request('/student/fees');
    } catch {
      return { totalFees: 0, paidAmount: 0, balanceDue: 0, status: 'PAID', receipts: [] };
    }
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
    try {
      return await request('/student/announcements');
    } catch {
      return [];
    }
  },

  // 13. Academic Queries (Student-to-Faculty)
  async getAcademicQueries(): Promise<AcademicQuery[]> {
    try {
      return await request<AcademicQuery[]>('/student/queries');
    } catch {
      return [];
    }
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
    try {
      return await request<StudyTask[]>('/student/study-tasks');
    } catch {
      return [];
    }
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
    try {
      return await request<OfficialDocument[]>('/student/documents');
    } catch {
      return [];
    }
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
    try {
      return await request<InAppNotification[]>('/assessment/student/notifications');
    } catch {
      return [];
    }
  },

  async markNotificationRead(id: string): Promise<void> {
    try {
      await request(`/assessment/student/notifications/${id}/read`, { method: 'PUT' });
    } catch {
      // Ignored
    }
  },
};
