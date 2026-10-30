import { create } from 'zustand';
import { authService, MobileUserSession, LoginPayload } from '../services/api/authService';

interface AuthState {
  session: MobileUserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (payload: LoginPayload) => Promise<void>;
  loginDemo: () => Promise<void>;
  loginDemoTeacher: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isAuthenticated: false,
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

  clearError: () => set({ error: null }),
}));

