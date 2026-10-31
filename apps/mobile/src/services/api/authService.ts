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

export const authService = {
  async login(payload: LoginPayload): Promise<MobileUserSession> {
    const data = await apiClient.post<MobileUserSession>('/auth/login', payload);
    if (data?.token) {
      apiClient.setAuthToken(data.token);
    }
    return data;
  },

  async registerStudent(payload: StudentRegisterPayload): Promise<MobileUserSession> {
    const data = await apiClient.post<MobileUserSession>('/auth/register-student', payload);
    if (data?.token) {
      apiClient.setAuthToken(data.token);
    }
    return data;
  },

  async registerTeacher(payload: TeacherRegisterPayload): Promise<MobileUserSession> {
    const data = await apiClient.post<MobileUserSession>('/auth/register', payload);
    if (data?.token) {
      apiClient.setAuthToken(data.token);
    }
    return data;
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
    const data = await apiClient.post<MobileUserSession>('/auth/demo-student', {});
    if (data?.token) apiClient.setAuthToken(data.token);
    return data;
  },

  async loginDemoTeacher(): Promise<MobileUserSession> {
    if (!__DEV__) throw new Error('Demo access is not available.');
    const data = await apiClient.post<MobileUserSession>('/auth/demo-teacher', {});
    if (data?.token) apiClient.setAuthToken(data.token);
    return data;
  },

  async getProfile(): Promise<MobileUserSession['user']> {
    return apiClient.get<MobileUserSession['user']>('/auth/me');
  },

  logout(): void {
    apiClient.setAuthToken(null);
  },
};
