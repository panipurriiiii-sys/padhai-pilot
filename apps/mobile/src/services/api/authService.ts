import { apiClient } from './client';

export interface MobileUserSession {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    fullName?: string;
    role: 'STUDENT' | 'TEACHER' | 'TUITION_OWNER' | 'FACULTY' | 'INSTITUTE_MANAGER';
    instituteId: string;
    instituteName?: string;
    rollNumber?: string;
    batchName?: string;
    batchId?: string;
    phone?: string;
    avatarUrl?: string;
  };
}

export interface LoginPayload {
  email?: string;
  phone?: string;
  password?: string;
  instituteCode?: string;
}

export interface StudentRegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  invitationCode?: string;
}

export interface TeacherRegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  subject?: string;
  invitationCode?: string;
}

const MOBILE_ROLES = ['STUDENT', 'TEACHER', 'FACULTY', 'TUITION_OWNER', 'INSTITUTE_MANAGER', 'INSTITUTE_ADMIN'];

/** The mobile app serves students and faculty only. Platform administration is web-only. */
function acceptSession(data: MobileUserSession): MobileUserSession {
  if (!data?.token || !MOBILE_ROLES.includes(data.user?.role)) {
    apiClient.setAuthToken(null);
    throw new Error('This app is for students and faculty. Platform administration is available on the web.');
  }
  apiClient.setAuthToken(data.token);
  return data;
}

export const authService = {
  async login(payload: LoginPayload): Promise<MobileUserSession> {
    const data = await apiClient.post<MobileUserSession>('/auth/login', payload);
    return acceptSession(data);
  },

  async registerStudent(payload: StudentRegisterPayload): Promise<MobileUserSession> {
    const data = await apiClient.post<MobileUserSession>('/auth/register-student', payload);
    return acceptSession(data);
  },

  async registerTeacher(payload: TeacherRegisterPayload): Promise<MobileUserSession> {
    const data = await apiClient.post<MobileUserSession>('/auth/register', payload);
    return acceptSession(data);
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string; resetToken?: string }> {
    return apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/auth/reset-password', { token, newPassword });
  },

  async joinInstitute(invitationCode: string): Promise<{ success: boolean; message: string; batchName?: string }> {
    return apiClient.post('/student/join-institute', { invitationCode });
  },

  // Development-only convenience. The server answers 404 in production, and there is deliberately no
  // client-side fallback: a failed login must never produce a fabricated session.
  async loginDemoStudent(): Promise<MobileUserSession> {
    if (!__DEV__) throw new Error('Demo access is not available.');
    return acceptSession(await apiClient.post<MobileUserSession>('/auth/demo-student', {}));
  },

  async loginDemoTeacher(): Promise<MobileUserSession> {
    if (!__DEV__) throw new Error('Demo access is not available.');
    return acceptSession(await apiClient.post<MobileUserSession>('/auth/demo-teacher', {}));
  },

  async getProfile(): Promise<MobileUserSession['user']> {
    return apiClient.get<MobileUserSession['user']>('/auth/me');
  },

  logout(): void {
    apiClient.setAuthToken(null);
  },
};
