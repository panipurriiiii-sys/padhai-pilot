import {
  StudentAssessmentResult,
  InAppNotification,
  UserSession,
  StudyMaterialItem,
} from '@padhai-pilot/shared';

function getCleanApiBaseUrl(): string {
  let base = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!base) {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return 'http://localhost:3001/api';
    }
    return '/api';
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

export const studentApi = {
  // Authentication
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

  // 1. Published Results for Current Student
  async getPublishedResults(): Promise<StudentAssessmentResult[]> {
    try {
      return await request<StudentAssessmentResult[]>('/assessment/student/results');
    } catch {
      return [];
    }
  },

  // 2. In-App Notifications
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

  // 3. Study Materials & Notes (Served directly from Cloudflare Media Host CDN)
  async getStudyMaterials(batchId?: string, category?: string): Promise<StudyMaterialItem[]> {
    try {
      const params = new URLSearchParams();
      if (batchId && batchId !== 'ALL') params.set('batchId', batchId);
      if (category && category !== 'ALL') params.set('category', category);
      const query = params.toString() ? `?${params.toString()}` : '';
      return await request<StudyMaterialItem[]>(`/student/materials${query}`);
    } catch {
      // Fallback try tuition endpoint
      try {
        const query = batchId && batchId !== 'ALL' ? `?batchId=${batchId}` : '';
        return await request<StudyMaterialItem[]>(`/assessment/student/materials${query}`);
      } catch {
        return [];
      }
    }
  },

  // 4. Attendance
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

  // 5. Fees & Receipts
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

  // 6. Announcements
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

  // 7. Dashboard Overview
  async getDashboard(): Promise<any> {
    try {
      return await request('/student/dashboard');
    } catch {
      return null;
    }
  },
};
