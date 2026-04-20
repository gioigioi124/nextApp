import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        const user = data.data.user;
        const accessToken = data.data.accessToken;
        set({ user, accessToken });
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      },

      register: async (email, password, name) => {
        await api.post('/auth/register', { email, password, name });
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (e) {
          // Ignore
        } finally {
          set({ user: null, accessToken: null });
          delete api.defaults.headers.common['Authorization'];
        }
      },

      refresh: async () => {
        const { data } = await api.post('/auth/refresh');
        const accessToken = data.data.accessToken;
        set({ accessToken });
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
    }
  )
);
