import { User, Role } from '../types/auth';

export const MOCK_USERS: User[] = [
  { id: '1', email: 'superadmin@gpucloud.io', name: 'Alex Mercer', role: 'super_admin', createdBy: null, assignedScope: ['*'], is2FAEnabled: true, twoFAMethod: 'authenticator', createdAt: '2024-01-01' },
  { id: '2', email: 'admin@gpucloud.io', name: 'Jordan Lee', role: 'admin', createdBy: '1', assignedScope: ['cafe-1', 'cafe-2', 'cafe-3'], is2FAEnabled: true, twoFAMethod: 'authenticator', createdAt: '2024-02-15' },
  { id: '3', email: 'admin2@gpucloud.io', name: 'Taylor Kim', role: 'admin', createdBy: '1', assignedScope: ['cafe-4', 'cafe-5'], is2FAEnabled: true, twoFAMethod: 'email', createdAt: '2024-03-01' },
  { id: '4', email: 'owner@gpucloud.io', name: 'Sam Rivera', role: 'cafe_owner', createdBy: '2', assignedScope: ['cafe-1'], is2FAEnabled: true, twoFAMethod: 'sms', phone: '+1555123456', createdAt: '2024-04-10' },
  { id: '5', email: 'owner2@gpucloud.io', name: 'Casey Park', role: 'cafe_owner', createdBy: '2', assignedScope: ['cafe-2'], is2FAEnabled: false, twoFAMethod: null, createdAt: '2024-04-15' },
  { id: '6', email: 'manager@gpucloud.io', name: 'Riley Chen', role: 'manager', createdBy: '4', assignedScope: ['branch-1'], is2FAEnabled: false, twoFAMethod: null, createdAt: '2024-05-01' },
  { id: '7', email: 'manager2@gpucloud.io', name: 'Morgan Tran', role: 'manager', createdBy: '4', assignedScope: ['branch-2'], is2FAEnabled: false, twoFAMethod: null, createdAt: '2024-05-10' },
];

export const MOCK_CREDENTIALS: Record<string, { password: string; userId: string }> = {
  'superadmin@gpucloud.io': { password: 'admin123', userId: '1' },
  'admin@gpucloud.io': { password: 'admin123', userId: '2' },
  'owner@gpucloud.io': { password: 'admin123', userId: '4' },
  'manager@gpucloud.io': { password: 'admin123', userId: '6' },
};

export interface BranchBilling {
  costPerMinute: number;
  lockedAmount: number;
  currency: 'MYR';
}

export interface Branch {
  id: string;
  name: string;
  cafeId: string;
  address: string;
  totalSeats: number;
  activeSeats: number;
  status: 'active' | 'maintenance' | 'inactive';
  adminId?: string;
  cafeOwnerId?: string;
  managerId?: string;
  billing: BranchBilling;
}

export interface Seat {
  id: string;
  branchId: string;
  number: number;
  status: 'available' | 'occupied' | 'maintenance';
  playerName?: string;
  startTime?: string;
  endTime?: string;
  gpuModel: string;
  label?: string;
}

export const GPU_MODEL_OPTIONS = [
  'RTX 4090', 'RTX 4080', 'RTX 4070 Ti', 'RTX 4070', 'RTX 4060 Ti', 'RTX 3090', 'RTX 3080', 'RTX 3070',
] as const;

export type GPUNodeStatus = 'online' | 'offline' | 'warning' | 'maintenance' | 'overloaded';
export type GPUHealth = 'healthy' | 'degraded' | 'critical';

export interface GPUNode {
  id: string;
  name: string;
  status: GPUNodeStatus;
  gpuModel: string;
  temperature: number;
  utilization: number;
  memoryUsed: number;
  memoryTotal: number;
  location: string;
  branchId: string;
  health: GPUHealth;
  uptimeHours: number;
  powerDrawW: number;
  fanSpeed: number;
  driverVersion: string;
  cudaVersion: string;
  vbiosVersion: string;
  serialNumber: string;
  ipAddress: string;
  lastMaintenance: string;
  installedAt: string;
  activeSessions: number;
  totalSessions: number;
  avgSessionMinutes: number;
  clockMhz: number;
  memoryClockMhz: number;
  pcieGen: string;
}

export const MOCK_BRANCHES: Branch[] = [
  { id: 'branch-1', name: 'Downtown Hub', cafeId: 'cafe-1', address: '123 Main St', totalSeats: 20, activeSeats: 14, status: 'active', adminId: '2', cafeOwnerId: '4', managerId: '6', billing: { costPerMinute: 2, lockedAmount: 100, currency: 'MYR' } },
  { id: 'branch-2', name: 'Uptown Arena', cafeId: 'cafe-1', address: '456 High St', totalSeats: 15, activeSeats: 10, status: 'active', adminId: '2', cafeOwnerId: '4', managerId: '7', billing: { costPerMinute: 3, lockedAmount: 150, currency: 'MYR' } },
  { id: 'branch-3', name: 'Westside Lounge', cafeId: 'cafe-2', address: '789 West Blvd', totalSeats: 25, activeSeats: 18, status: 'active', adminId: '2', cafeOwnerId: '5', billing: { costPerMinute: 2.5, lockedAmount: 120, currency: 'MYR' } },
  { id: 'branch-4', name: 'Eastside Den', cafeId: 'cafe-2', address: '321 East Ave', totalSeats: 12, activeSeats: 8, status: 'maintenance', adminId: '3', billing: { costPerMinute: 1.5, lockedAmount: 80, currency: 'MYR' } },
];

function generateSeatsForBranch(branchId: string, total: number, activeCount: number): Seat[] {
  const players = ['John D.', 'Sarah M.', 'Mike T.', 'Lisa K.', 'Dave W.', 'Amy R.', 'Chris L.', 'Nina P.', 'Tom B.', 'Zoe W.'];
  const gpus = ['RTX 4090', 'RTX 4080', 'RTX 4070 Ti'];
  return Array.from({ length: total }, (_, i) => ({
    id: `${branchId}-seat-${i + 1}`,
    branchId,
    number: i + 1,
    status: (i < activeCount ? 'occupied' : i === total - 1 && total > 3 ? 'maintenance' : 'available') as Seat['status'],
    playerName: i < activeCount ? players[i % players.length] : undefined,
    startTime: i < activeCount ? `${9 + Math.floor(i / 2)}:${i % 2 === 0 ? '00' : '30'} AM` : undefined,
    gpuModel: gpus[i % 3],
  }));
}

export const MOCK_SEATS: Seat[] = [
  ...generateSeatsForBranch('branch-1', 20, 14),
  ...generateSeatsForBranch('branch-2', 15, 10),
  ...generateSeatsForBranch('branch-3', 25, 18),
  ...generateSeatsForBranch('branch-4', 12, 8),
];

export const MOCK_GPU_NODES: GPUNode[] = [
  { id: 'gpu-1', name: 'Node Alpha', status: 'online', gpuModel: 'RTX 4090', temperature: 62, utilization: 78, memoryUsed: 18, memoryTotal: 24, location: 'Downtown Hub', branchId: 'branch-1', health: 'healthy', uptimeHours: 720, powerDrawW: 340, fanSpeed: 55, driverVersion: '550.78', cudaVersion: '12.4', vbiosVersion: '95.02.18.00.A1', serialNumber: 'SN-4090-A001', ipAddress: '10.0.1.11', lastMaintenance: '2026-03-12', installedAt: '2024-09-01', activeSessions: 3, totalSessions: 1240, avgSessionMinutes: 92, clockMhz: 2520, memoryClockMhz: 10501, pcieGen: 'PCIe 4.0 x16' },
  { id: 'gpu-2', name: 'Node Beta', status: 'online', gpuModel: 'RTX 4090', temperature: 58, utilization: 65, memoryUsed: 15, memoryTotal: 24, location: 'Downtown Hub', branchId: 'branch-1', health: 'healthy', uptimeHours: 690, powerDrawW: 310, fanSpeed: 48, driverVersion: '550.78', cudaVersion: '12.4', vbiosVersion: '95.02.18.00.A1', serialNumber: 'SN-4090-A002', ipAddress: '10.0.1.12', lastMaintenance: '2026-03-12', installedAt: '2024-09-01', activeSessions: 2, totalSessions: 1110, avgSessionMinutes: 85, clockMhz: 2475, memoryClockMhz: 10501, pcieGen: 'PCIe 4.0 x16' },
  { id: 'gpu-3', name: 'Node Gamma', status: 'overloaded', gpuModel: 'RTX 4080', temperature: 82, utilization: 95, memoryUsed: 15, memoryTotal: 16, location: 'Uptown Arena', branchId: 'branch-2', health: 'degraded', uptimeHours: 1450, powerDrawW: 320, fanSpeed: 92, driverVersion: '550.54', cudaVersion: '12.4', vbiosVersion: '95.02.18.00.B0', serialNumber: 'SN-4080-B003', ipAddress: '10.0.2.13', lastMaintenance: '2026-01-22', installedAt: '2024-06-15', activeSessions: 5, totalSessions: 2105, avgSessionMinutes: 110, clockMhz: 2505, memoryClockMhz: 11200, pcieGen: 'PCIe 4.0 x16' },
  { id: 'gpu-4', name: 'Node Delta', status: 'offline', gpuModel: 'RTX 4080', temperature: 0, utilization: 0, memoryUsed: 0, memoryTotal: 16, location: 'Westside Lounge', branchId: 'branch-3', health: 'critical', uptimeHours: 0, powerDrawW: 0, fanSpeed: 0, driverVersion: '550.54', cudaVersion: '12.4', vbiosVersion: '95.02.18.00.B0', serialNumber: 'SN-4080-B004', ipAddress: '10.0.3.14', lastMaintenance: '2026-04-05', installedAt: '2024-05-20', activeSessions: 0, totalSessions: 1830, avgSessionMinutes: 88, clockMhz: 0, memoryClockMhz: 0, pcieGen: 'PCIe 4.0 x16' },
  { id: 'gpu-5', name: 'Node Epsilon', status: 'online', gpuModel: 'RTX 4070 Ti', temperature: 55, utilization: 42, memoryUsed: 6, memoryTotal: 12, location: 'Eastside Den', branchId: 'branch-4', health: 'healthy', uptimeHours: 410, powerDrawW: 220, fanSpeed: 38, driverVersion: '550.78', cudaVersion: '12.4', vbiosVersion: '95.04.2A.00.C1', serialNumber: 'SN-4070-C005', ipAddress: '10.0.4.15', lastMaintenance: '2026-02-28', installedAt: '2024-11-10', activeSessions: 1, totalSessions: 520, avgSessionMinutes: 74, clockMhz: 2610, memoryClockMhz: 10501, pcieGen: 'PCIe 4.0 x16' },
  { id: 'gpu-6', name: 'Node Zeta', status: 'maintenance', gpuModel: 'RTX 3090', temperature: 0, utilization: 0, memoryUsed: 0, memoryTotal: 24, location: 'Uptown Arena', branchId: 'branch-2', health: 'degraded', uptimeHours: 0, powerDrawW: 0, fanSpeed: 0, driverVersion: '545.23', cudaVersion: '12.3', vbiosVersion: '94.02.42.00.D0', serialNumber: 'SN-3090-D006', ipAddress: '10.0.2.16', lastMaintenance: '2026-05-15', installedAt: '2023-08-12', activeSessions: 0, totalSessions: 3210, avgSessionMinutes: 96, clockMhz: 0, memoryClockMhz: 0, pcieGen: 'PCIe 4.0 x16' },
  { id: 'gpu-7', name: 'Node Eta', status: 'warning', gpuModel: 'RTX 4070', temperature: 76, utilization: 88, memoryUsed: 10, memoryTotal: 12, location: 'Downtown Hub', branchId: 'branch-1', health: 'degraded', uptimeHours: 980, powerDrawW: 195, fanSpeed: 78, driverVersion: '550.54', cudaVersion: '12.4', vbiosVersion: '95.04.2A.00.E0', serialNumber: 'SN-4070-E007', ipAddress: '10.0.1.17', lastMaintenance: '2026-02-10', installedAt: '2024-07-22', activeSessions: 2, totalSessions: 1640, avgSessionMinutes: 80, clockMhz: 2475, memoryClockMhz: 10501, pcieGen: 'PCIe 4.0 x16' },
];

export const REVENUE_DATA = [
  { name: 'Mon', revenue: 4200, sessions: 42 },
  { name: 'Tue', revenue: 3800, sessions: 38 },
  { name: 'Wed', revenue: 5100, sessions: 51 },
  { name: 'Thu', revenue: 4700, sessions: 47 },
  { name: 'Fri', revenue: 6300, sessions: 63 },
  { name: 'Sat', revenue: 7800, sessions: 78 },
  { name: 'Sun', revenue: 7200, sessions: 72 },
];

export const MONTHLY_REVENUE = [
  { name: 'Jan', revenue: 82000 },
  { name: 'Feb', revenue: 95000 },
  { name: 'Mar', revenue: 110000 },
  { name: 'Apr', revenue: 102000 },
  { name: 'May', revenue: 125000 },
  { name: 'Jun', revenue: 138000 },
];

export interface Booking {
  id: string;
  branchId: string;
  seatNumber: number;
  customerName: string;
  customerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'completed' | 'cancelled' | 'no_show';
  gpuPreference?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

// ===== Loyalty tier system =====
export type LoyaltyTier = 'bronze' | 'silver' | 'gold';

export const LOYALTY_TIERS: Record<LoyaltyTier, { label: string; min: number; max: number; multiplier: number }> = {
  bronze: { label: 'Bronze', min: 0, max: 500, multiplier: 1 },
  silver: { label: 'Silver', min: 501, max: 2000, multiplier: 1.25 },
  gold:   { label: 'Gold',   min: 2001, max: Infinity, multiplier: 1.5 },
};

export function tierFromPoints(points: number): LoyaltyTier {
  if (points >= LOYALTY_TIERS.gold.min) return 'gold';
  if (points >= LOYALTY_TIERS.silver.min) return 'silver';
  return 'bronze';
}

export function nextTierProgress(points: number) {
  const t = tierFromPoints(points);
  if (t === 'gold') return { tier: t, next: null as LoyaltyTier | null, toNext: 0, pct: 100 };
  const next: LoyaltyTier = t === 'bronze' ? 'silver' : 'gold';
  const span = LOYALTY_TIERS[next].min - LOYALTY_TIERS[t].min;
  const done = points - LOYALTY_TIERS[t].min;
  return { tier: t, next, toNext: LOYALTY_TIERS[next].min - points, pct: Math.min(100, Math.round((done / span) * 100)) };
}

export type WalletTxnType = 'topup' | 'charge' | 'refund' | 'redeem' | 'bonus';

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: WalletTxnType;
  amount: number; // MYR; +/-
  pointsDelta?: number;
  note?: string;
  timestamp: string;
}

export interface CustomerWallet {
  id: string;
  name: string;
  phone: string;
  branchId: string;
  balance: number;
  lockedAmount: number;
  points: number;
  lastActivity: string;
}

export const LOW_BALANCE_THRESHOLD = 50;

export const MOCK_CUSTOMER_WALLETS: CustomerWallet[] = [
  { id: 'cw-1', name: 'Aiden Cole', phone: '+1555000111', branchId: 'branch-1', balance: 500, lockedAmount: 100, points: 820, lastActivity: '2026-05-30' },
  { id: 'cw-2', name: 'Maya Lin', phone: '+1555000222', branchId: 'branch-1', balance: 1200, lockedAmount: 200, points: 2450, lastActivity: '2026-05-31' },
  { id: 'cw-3', name: 'Derek Shaw', phone: '+1555000333', branchId: 'branch-1', balance: 32, lockedAmount: 0, points: 180, lastActivity: '2026-05-28' },
  { id: 'cw-4', name: 'Priya Nair', phone: '+1555000444', branchId: 'branch-2', balance: 750, lockedAmount: 150, points: 1340, lastActivity: '2026-05-30' },
  { id: 'cw-5', name: 'Leo Tanaka', phone: '+1555000555', branchId: 'branch-2', balance: 25, lockedAmount: 0, points: 420, lastActivity: '2026-05-25' },
  { id: 'cw-6', name: 'Sara Ahmed', phone: '+1555000666', branchId: 'branch-3', balance: 900, lockedAmount: 120, points: 3120, lastActivity: '2026-05-31' },
  { id: 'cw-7', name: 'Omar Hassan', phone: '+1555000777', branchId: 'branch-3', balance: 450, lockedAmount: 100, points: 680, lastActivity: '2026-05-29' },
  { id: 'cw-8', name: 'Nina Park', phone: '+1555000888', branchId: 'branch-4', balance: 600, lockedAmount: 80, points: 1880, lastActivity: '2026-05-30' },
];

export const MOCK_WALLET_TRANSACTIONS: WalletTransaction[] = [
  { id: 'tx-1', walletId: 'cw-1', type: 'topup',  amount: 200, note: 'Cash top-up', timestamp: '2026-05-25T10:00:00Z' },
  { id: 'tx-2', walletId: 'cw-1', type: 'charge', amount: -45, note: 'Session 2h 15m', timestamp: '2026-05-28T14:00:00Z' },
  { id: 'tx-3', walletId: 'cw-1', type: 'bonus',  amount: 0, pointsDelta: 30, note: 'Feedback bonus', timestamp: '2026-05-28T16:30:00Z' },
  { id: 'tx-4', walletId: 'cw-2', type: 'topup',  amount: 500, note: 'Card top-up', timestamp: '2026-05-20T09:30:00Z' },
  { id: 'tx-5', walletId: 'cw-2', type: 'charge', amount: -180, note: 'Session 3h', timestamp: '2026-05-31T18:00:00Z' },
  { id: 'tx-6', walletId: 'cw-3', type: 'topup',  amount: 100, note: 'Cash top-up', timestamp: '2026-05-15T11:00:00Z' },
  { id: 'tx-7', walletId: 'cw-3', type: 'charge', amount: -68, note: 'Session 2h', timestamp: '2026-05-28T17:00:00Z' },
];

// ===== Feedback =====
export type FeedbackChip = 'GPU performance' | 'Seat comfort' | 'Staff' | 'Internet speed' | 'Cleanliness' | 'Pricing';
export const FEEDBACK_CHIPS: FeedbackChip[] = ['GPU performance', 'Seat comfort', 'Staff', 'Internet speed', 'Cleanliness', 'Pricing'];

export interface Feedback {
  id: string;
  walletId: string;
  customerName: string;
  branchId: string;
  seatNumber?: number;
  rating: 1 | 2 | 3 | 4 | 5;
  chips: FeedbackChip[];
  comment?: string;
  timestamp: string;
}

export const MOCK_FEEDBACK: Feedback[] = [
  { id: 'fb-1', walletId: 'cw-2', customerName: 'Maya Lin', branchId: 'branch-1', seatNumber: 7, rating: 5, chips: ['GPU performance', 'Staff'], comment: 'Smooth as butter on 4090.', timestamp: '2026-05-31T18:30:00Z' },
  { id: 'fb-2', walletId: 'cw-1', customerName: 'Aiden Cole', branchId: 'branch-1', seatNumber: 3, rating: 4, chips: ['Seat comfort'], comment: 'Chair could be better.', timestamp: '2026-05-30T20:00:00Z' },
  { id: 'fb-3', walletId: 'cw-3', customerName: 'Derek Shaw', branchId: 'branch-1', seatNumber: 1, rating: 2, chips: ['Internet speed', 'GPU performance'], comment: 'High ping all session.', timestamp: '2026-05-28T21:00:00Z' },
  { id: 'fb-4', walletId: 'cw-4', customerName: 'Priya Nair', branchId: 'branch-2', seatNumber: 5, rating: 5, chips: ['Staff', 'Cleanliness'], timestamp: '2026-05-30T19:00:00Z' },
  { id: 'fb-5', walletId: 'cw-6', customerName: 'Sara Ahmed', branchId: 'branch-3', seatNumber: 4, rating: 4, chips: ['GPU performance'], timestamp: '2026-05-31T17:00:00Z' },
];

export const MOCK_BOOKINGS: Booking[] = [
  { id: 'bk-1', branchId: 'branch-1', seatNumber: 3, customerName: 'Aiden Cole', customerPhone: '+1555000111', date: '2026-04-10', startTime: '10:00', endTime: '12:00', status: 'upcoming', gpuPreference: 'RTX 4090', createdBy: '6', createdAt: '2026-04-08' },
  { id: 'bk-2', branchId: 'branch-1', seatNumber: 7, customerName: 'Maya Lin', customerPhone: '+1555000222', date: '2026-04-10', startTime: '14:00', endTime: '17:00', status: 'upcoming', notes: 'VIP customer', createdBy: '6', createdAt: '2026-04-08' },
  { id: 'bk-3', branchId: 'branch-1', seatNumber: 1, customerName: 'Derek Shaw', customerPhone: '+1555000333', date: '2026-04-09', startTime: '09:00', endTime: '11:00', status: 'completed', gpuPreference: 'RTX 4080', createdBy: '4', createdAt: '2026-04-07' },
  { id: 'bk-4', branchId: 'branch-2', seatNumber: 5, customerName: 'Priya Nair', customerPhone: '+1555000444', date: '2026-04-11', startTime: '16:00', endTime: '19:00', status: 'upcoming', createdBy: '4', createdAt: '2026-04-08' },
  { id: 'bk-5', branchId: 'branch-1', seatNumber: 10, customerName: 'Leo Tanaka', customerPhone: '+1555000555', date: '2026-04-08', startTime: '13:00', endTime: '15:00', status: 'cancelled', createdBy: '6', createdAt: '2026-04-06' },
  { id: 'bk-6', branchId: 'branch-2', seatNumber: 2, customerName: 'Sara Ahmed', customerPhone: '+1555000666', date: '2026-04-09', startTime: '11:00', endTime: '14:00', status: 'no_show', createdBy: '7', createdAt: '2026-04-07' },
];
