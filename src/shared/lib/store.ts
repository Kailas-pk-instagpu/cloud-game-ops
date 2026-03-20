import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, TwoFAMethod, User } from '../types/auth';
import { MOCK_USERS, MOCK_CREDENTIALS } from './mock-data';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      is2FAVerified: false,
      isAuthenticated: false,
      theme: 'dark',

      login: (email: string, password: string) => {
        const cred = MOCK_CREDENTIALS[email];
        if (!cred || cred.password !== password) {
          return { success: false, requires2FA: false, error: 'Invalid email or password' };
        }
        const user = MOCK_USERS.find(u => u.id === cred.userId);
        if (!user) return { success: false, requires2FA: false, error: 'User not found' };

        set({ user, token: `mock-jwt-${user.id}-${Date.now()}` });
        
        if (user.is2FAEnabled) {
          set({ is2FAVerified: false, isAuthenticated: false });
          return { success: true, requires2FA: true };
        }
        
        set({ is2FAVerified: true, isAuthenticated: true });
        return { success: true, requires2FA: false };
      },

      verify2FA: (code: string) => {
        // Accept any 6-digit code for demo
        if (code.length === 6 && /^\d+$/.test(code)) {
          set({ is2FAVerified: true, isAuthenticated: true });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ user: null, token: null, is2FAVerified: false, isAuthenticated: false });
      },

      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: newTheme });
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
      },
    }),
    {
      name: 'gpu-cloud-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        is2FAVerified: state.is2FAVerified,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
      } as AuthState),
    }
  )
);

// Apply theme on load
const savedTheme = JSON.parse(localStorage.getItem('gpu-cloud-auth') || '{}')?.state?.theme;
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

// Notification store
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [
    { id: '1', title: 'GPU Node Warning', message: 'Node Gamma temperature exceeds threshold', type: 'warning', timestamp: '5 min ago', read: false },
    { id: '2', title: 'New Branch Added', message: 'Eastside Den has been added to the network', type: 'success', timestamp: '1 hour ago', read: false },
    { id: '3', title: 'Revenue Milestone', message: 'Monthly revenue exceeded $130,000', type: 'info', timestamp: '3 hours ago', read: true },
    { id: '4', title: 'Node Offline', message: 'Node Delta went offline in Westside Lounge', type: 'error', timestamp: '5 hours ago', read: false },
  ],
  markAsRead: (id) => set((s) => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) })),
  clearAll: () => set((s) => ({ notifications: s.notifications.map(n => ({ ...n, read: true })) })),
}));
