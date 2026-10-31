import { create } from 'zustand';
import {
  authService,
  MobileUserSession,
  LoginPayload,
  StudentRegisterPayload,
  TeacherRegisterPayload,
} from '../services/api/authService';

interface AuthState {
  session: MobileUserSession | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  login: (payload: LoginPayload) => Promise<void>;
  registerStudent: (payload: StudentRegisterPayload) => Promise<void>;
  registerTeacher: (payload: TeacherRegisterPayload) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string; resetToken?: string }>;
  resetPassword: (token: string, newPass: string) => Promise<{ success: boolean; message: string }>;
  joinInstitute: (invitationCode: string) => Promise<{ success: boolean; message: string }>;
  loginDemo: () => Promise<void>;
  loginDemoTeacher: () => Promise<void>;
  logout: () => void;
  initializeAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,
  error: null,

  login: async (payload: LoginPayload) => {
    set({ isLoading: true, error: null });
    try {
      const session = await authService.login(payload);
      set({ session, isAuthenticated: true, isLoading: false, error: null });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please check credentials.';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  registerStudent: async (payload: StudentRegisterPayload) => {
    set({ isLoading: true, error: null });
    try {
      const session = await authService.registerStudent(payload);
      set({ session, isAuthenticated: true, isLoading: false, error: null });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Student registration failed.';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  registerTeacher: async (payload: TeacherRegisterPayload) => {
    set({ isLoading: true, error: null });
    try {
      const session = await authService.registerTeacher(payload);
      set({ session, isAuthenticated: true, isLoading: false, error: null });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Teacher registration failed.';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  forgotPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.forgotPassword(email);
      set({ isLoading: false });
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to request password reset.';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  resetPassword: async (token: string, newPass: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.resetPassword(token, newPass);
      set({ isLoading: false });
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reset password.';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  joinInstitute: async (invitationCode: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.joinInstitute(invitationCode);
      set({ isLoading: false });
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid or expired invitation code.';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  loginDemo: async () => {
    set({ isLoading: true, error: null });
    try {
      const session = await authService.loginDemoStudent();
      set({ session, isAuthenticated: true, isLoading: false, error: null });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Demo student login failed.';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  loginDemoTeacher: async () => {
    set({ isLoading: true, error: null });
    try {
      const session = await authService.loginDemoTeacher();
      set({ session, isAuthenticated: true, isLoading: false, error: null });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Demo teacher login failed.';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    authService.logout();
    set({ session: null, isAuthenticated: false, error: null });
  },

  initializeAuth: async () => {
    try {
      const session = await authService.restoreStoredSession();
      if (session) {
        set({ session, isAuthenticated: true, isInitialized: true, error: null });
      } else {
        set({ session: null, isAuthenticated: false, isInitialized: true });
      }
    } catch {
      set({ session: null, isAuthenticated: false, isInitialized: true });
    }
  },

  clearError: () => set({ error: null }),
}));
