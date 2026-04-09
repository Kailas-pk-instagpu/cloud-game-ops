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

      enable2FA: (method: TwoFAMethod, phone?: string) => {
        const user = get().user;
        if (user) {
          set({ user: { ...user, is2FAEnabled: true, twoFAMethod: method, ...(phone ? { phone } : {}) } });
        }
      },

      disable2FA: () => {
        const user = get().user;
        if (user) {
          set({ user: { ...user, is2FAEnabled: false, twoFAMethod: null } });
        }
      },

      updateProfile: (updates) => {
        const user = get().user;
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },

      changePassword: (oldPassword: string, newPassword: string) => {
        const user = get().user;
        if (!user) return { success: false, error: 'Not logged in' };
        const cred = MOCK_CREDENTIALS[user.email];
        if (!cred || cred.password !== oldPassword) {
          return { success: false, error: 'Current password is incorrect' };
        }
        // Update mock credential
        MOCK_CREDENTIALS[user.email].password = newPassword;
        return { success: true };
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

// Branch store
import { Branch, MOCK_BRANCHES } from './mock-data';

interface BranchState {
  branches: Branch[];
  addBranch: (branch: Omit<Branch, 'id'>) => void;
  updateBranch: (id: string, updates: Partial<Branch>) => void;
  deleteBranch: (id: string) => void;
  toggleBranchStatus: (id: string) => void;
}

export const useBranchStore = create<BranchState>((set) => ({
  branches: [...MOCK_BRANCHES],
  addBranch: (branch) => set((s) => ({
    branches: [...s.branches, { ...branch, id: `branch-${Date.now()}` }],
  })),
  updateBranch: (id, updates) => set((s) => ({
    branches: s.branches.map(b => b.id === id ? { ...b, ...updates } : b),
  })),
  deleteBranch: (id) => set((s) => ({
    branches: s.branches.filter(b => b.id !== id),
  })),
  toggleBranchStatus: (id) => set((s) => ({
    branches: s.branches.map(b =>
      b.id === id ? { ...b, status: b.status === 'inactive' ? 'active' : 'inactive' } : b
    ),
  })),
}));

// Seat store
import { Seat, MOCK_SEATS } from './mock-data';

interface SeatState {
  seats: Seat[];
  getSeatsByBranch: (branchId: string) => Seat[];
  updateSeatStatus: (seatId: string, status: Seat['status']) => void;
  updateSeat: (seatId: string, updates: Partial<Seat>) => void;
}

export const useSeatStore = create<SeatState>((set, get) => ({
  seats: [...MOCK_SEATS],
  getSeatsByBranch: (branchId: string) => get().seats.filter(s => s.branchId === branchId),
  updateSeatStatus: (seatId, status) => set((s) => ({
    seats: s.seats.map(seat => seat.id === seatId ? { ...seat, status, ...(status !== 'occupied' ? { playerName: undefined, startTime: undefined } : {}) } : seat),
  })),
  updateSeat: (seatId, updates) => set((s) => ({
    seats: s.seats.map(seat => seat.id === seatId ? { ...seat, ...updates } : seat),
  })),
}));

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
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  deleteAllNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [
    { id: '1', title: 'GPU Node Warning', message: 'Node Gamma temperature exceeds threshold', type: 'warning', timestamp: '5 min ago', read: false },
    { id: '2', title: 'New Branch Added', message: 'Eastside Den has been added to the network', type: 'success', timestamp: '1 hour ago', read: false },
    { id: '3', title: 'Revenue Milestone', message: 'Monthly revenue exceeded $130,000', type: 'info', timestamp: '3 hours ago', read: true },
    { id: '4', title: 'Node Offline', message: 'Node Delta went offline in Westside Lounge', type: 'error', timestamp: '5 hours ago', read: false },
  ],
  markAsRead: (id) => set((s) => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) })),
  markAllAsRead: () => set((s) => ({ notifications: s.notifications.map(n => ({ ...n, read: true })) })),
  deleteNotification: (id) => set((s) => ({ notifications: s.notifications.filter(n => n.id !== id) })),
  deleteAllNotifications: () => set({ notifications: [] }),
}));

// Booking store
import { Booking, MOCK_BOOKINGS } from './mock-data';

interface BookingState {
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => void;
  cancelBooking: (id: string) => void;
  updateBookingStatus: (id: string, status: Booking['status']) => void;
  getBookingsByBranch: (branchId: string) => Booking[];
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [...MOCK_BOOKINGS],
  addBooking: (booking) => set((s) => ({
    bookings: [...s.bookings, { ...booking, id: `bk-${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] }],
  })),
  cancelBooking: (id) => set((s) => ({
    bookings: s.bookings.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b),
  })),
  updateBookingStatus: (id, status) => set((s) => ({
    bookings: s.bookings.map(b => b.id === id ? { ...b, status } : b),
  })),
  getBookingsByBranch: (branchId) => get().bookings.filter(b => b.branchId === branchId),
}));
