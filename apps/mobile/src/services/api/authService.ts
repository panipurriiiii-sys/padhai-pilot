import { apiClient } from './client';

export interface MobileUserSession {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'STUDENT' | 'PARENT' | 'TEACHER' | 'ADMIN';
    instituteId: string;
    instituteName?: string;
    rollNumber?: string;
    batchName?: string;
  };
}

export interface LoginPayload {
  email?: string;
  phone?: string;
  password?: string;
  instituteCode?: string;
}

export const authService = {
  async login(payload: LoginPayload): Promise<MobileUserSession> {
    const data = await apiClient.post<MobileUserSession>('/auth/login', payload);
    if (data?.token) {
      apiClient.setAuthToken(data.token);
    }
    return data;
  },

  async loginDemoStudent(): Promise<MobileUserSession> {
    const data = await apiClient.post<MobileUserSession>('/auth/demo-student', {});
    if (data?.token) {
      apiClient.setAuthToken(data.token);
    }
    return data;
  },

  async getProfile(): Promise<MobileUserSession['user']> {
    return apiClient.get<MobileUserSession['user']>('/auth/me');
  },

  logout(): void {
    apiClient.setAuthToken(null);
  },
};

