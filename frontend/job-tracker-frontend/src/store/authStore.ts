import { create } from 'zustand';
import { getCurrentUser, login as apiLogin, signup as apiSignup, logout as logoutAPI } from '../api/auth';

export type User = {
    id: string;
    email: string;
    is_admin: boolean;
};

type AuthState = {
    user: User | null | undefined;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string) => Promise<void>;
    logout: () => void;
    fetchUser: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
    user: undefined,
    loading: true,
    error: null,
  
    login: async (email, password) => {
      set({ loading: true, error: null });
      try {
        await apiLogin({ email, password });
        const user = await getCurrentUser();
        set({ user });
      } catch (err: any) {
        set({ error: err.message || "Login failed" });
      } finally {
        set({ loading: false });
      }
    },
  
    signup: async (email, password) => {
      set({ loading: true, error: null });
      try {
        await apiSignup({ email, password });
        const user = await getCurrentUser();
        set({ user });
      } catch (err: any) {
        set({ error: err.message || "Signup failed" });
      } finally {
        set({ loading: false });
      }
    },
  
    logout: async () => {
      try {
        await logoutAPI();
      } catch{}
      finally {
        set({ user: null });
      }
    },
  
    fetchUser: async () => {
      set({ loading: true });
      try {
        const user = await getCurrentUser();
        set({ user });
      } catch {
        set({ user: undefined });
      } finally {
        set({ loading: false });
      }
    },
  }));
  