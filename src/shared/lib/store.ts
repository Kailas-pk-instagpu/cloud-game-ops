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
  addBranch: (branch: Omit<Branch, 'id'>) => string;
  updateBranch: (id: string, updates: Partial<Branch>) => void;
  deleteBranch: (id: string) => void;
  toggleBranchStatus: (id: string) => void;
}

export const useBranchStore = create<BranchState>((set) => ({
  branches: [...MOCK_BRANCHES],
  addBranch: (branch) => {
    const id = `branch-${Date.now()}`;
    set((s) => ({ branches: [...s.branches, { ...branch, id }] }));
    return id;
  },
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
  provisionSeats: (branchId: string, total: number, defaultGpu?: string) => void;
  syncSeatCount: (branchId: string, total: number, defaultGpu?: string) => void;
  removeSeatsForBranch: (branchId: string) => void;
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
  provisionSeats: (branchId, total, defaultGpu = 'RTX 4070') => set((s) => {
    if (s.seats.some(seat => seat.branchId === branchId)) return s;
    const newSeats: Seat[] = Array.from({ length: total }, (_, i) => ({
      id: `${branchId}-seat-${i + 1}`,
      branchId,
      number: i + 1,
      status: 'available',
      gpuModel: defaultGpu,
    }));
    return { seats: [...s.seats, ...newSeats] };
  }),
  syncSeatCount: (branchId, total, defaultGpu = 'RTX 4070') => set((s) => {
    const branchSeats = s.seats.filter(seat => seat.branchId === branchId).sort((a, b) => a.number - b.number);
    const others = s.seats.filter(seat => seat.branchId !== branchId);
    if (branchSeats.length === total) return s;
    if (branchSeats.length < total) {
      const toAdd: Seat[] = [];
      for (let i = branchSeats.length; i < total; i++) {
        toAdd.push({
          id: `${branchId}-seat-${i + 1}-${Date.now()}`,
          branchId,
          number: i + 1,
          status: 'available',
          gpuModel: defaultGpu,
        });
      }
      return { seats: [...others, ...branchSeats, ...toAdd] };
    }
    // remove from the end, but skip occupied seats
    const sorted = [...branchSeats].sort((a, b) => b.number - a.number);
    const kept: Seat[] = [];
    let removable = branchSeats.length - total;
    for (const seat of sorted) {
      if (removable > 0 && seat.status !== 'occupied') {
        removable--;
      } else {
        kept.push(seat);
      }
    }
    return { seats: [...others, ...kept] };
  }),
  removeSeatsForBranch: (branchId) => set((s) => ({
    seats: s.seats.filter(seat => seat.branchId !== branchId),
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
    { id: '3', title: 'Revenue Milestone', message: 'Monthly revenue exceeded RM 130,000', type: 'info', timestamp: '3 hours ago', read: true },
    { id: '4', title: 'Node Offline', message: 'Node Delta went offline in Westside Lounge', type: 'error', timestamp: '5 hours ago', read: false },
    { id: '5', title: 'System Maintenance Scheduled', message: 'The platform will undergo scheduled maintenance tonight between 2:00 AM and 4:00 AM UTC to apply critical security patches and upgrade the database cluster. During this window, all services may experience brief interruptions. Please save your work and log out before the maintenance window begins to avoid data loss.', type: 'info', timestamp: '10 min ago', read: false },
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

// Settlement store - records each ended billing session
export interface Settlement {
  id: string;
  sessionId: string;
  branchId: string;
  branchName: string;
  customerId: string;
  customerName: string;
  startTime: string; // ISO
  endTime: string; // ISO
  durationSec: number;
  costPerMinute: number;
  lockedAmount: number;
  usageCost: number;
  refund: number;
  settledBy: string; // userId
  settledByRole: 'cafe_owner' | 'manager';
  status: 'settled';
}

interface SettlementState {
  settlements: Settlement[];
  addSettlement: (s: Omit<Settlement, 'id' | 'status'>) => Settlement;
  getByBranch: (branchId: string) => Settlement[];
}

export const useSettlementStore = create<SettlementState>()(
  persist(
    (set, get) => ({
      settlements: [],
      addSettlement: (s) => {
        const settlement: Settlement = {
          ...s,
          id: `stl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          status: 'settled',
        };
        set((state) => ({ settlements: [settlement, ...state.settlements] }));
        return settlement;
      },
      getByBranch: (branchId) => get().settlements.filter((x) => x.branchId === branchId),
    }),
    { name: 'gpu-cloud-settlements' }
  )
);

// Account Deletion Request store
import { Role } from '../types/auth';

export interface DeletionRequest {
  id: string;
  targetUserId: string;
  targetName: string;
  targetEmail: string;
  targetRole: Role;
  isSelf: boolean;
  requestedById: string;
  requestedByName: string;
  requestedByRole: Role;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

interface DeletionRequestState {
  requests: DeletionRequest[];
  deletedUserIds: string[];
  createRequest: (r: Omit<DeletionRequest, 'id' | 'status' | 'createdAt'>) => DeletionRequest;
  approveRequest: (id: string, note?: string) => void;
  rejectRequest: (id: string, note?: string) => void;
  hasPendingForUser: (userId: string) => boolean;
}

export const useDeletionRequestStore = create<DeletionRequestState>()(
  persist(
    (set, get) => ({
      requests: [],
      deletedUserIds: [],
      createRequest: (r) => {
        const req: DeletionRequest = {
          ...r,
          id: `del-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ requests: [req, ...s.requests] }));
        return req;
      },
      approveRequest: (id, note) => set((s) => {
        const req = s.requests.find(r => r.id === id);
        if (!req) return s;
        return {
          requests: s.requests.map(r => r.id === id
            ? { ...r, status: 'approved' as const, resolvedAt: new Date().toISOString(), resolutionNote: note }
            : r),
          deletedUserIds: s.deletedUserIds.includes(req.targetUserId)
            ? s.deletedUserIds
            : [...s.deletedUserIds, req.targetUserId],
        };
      }),
      rejectRequest: (id, note) => set((s) => ({
        requests: s.requests.map(r => r.id === id
          ? { ...r, status: 'rejected' as const, resolvedAt: new Date().toISOString(), resolutionNote: note }
          : r),
      })),
      hasPendingForUser: (userId) => get().requests.some(r => r.targetUserId === userId && r.status === 'pending'),
    }),
    { name: 'gpu-cloud-deletion-requests' }
  )
);
