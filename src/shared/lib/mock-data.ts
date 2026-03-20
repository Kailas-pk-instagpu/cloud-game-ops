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

export interface Branch {
  id: string;
  name: string;
  cafeId: string;
  address: string;
  totalSeats: number;
  activeSeats: number;
  status: 'active' | 'maintenance' | 'inactive';
}

export interface Seat {
  id: string;
  branchId: string;
  number: number;
  status: 'available' | 'occupied' | 'maintenance';
  playerName?: string;
  startTime?: string;
  gpuModel: string;
}

export interface GPUNode {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'warning';
  gpuModel: string;
  temperature: number;
  utilization: number;
  memoryUsed: number;
  memoryTotal: number;
  location: string;
}

export const MOCK_BRANCHES: Branch[] = [
  { id: 'branch-1', name: 'Downtown Hub', cafeId: 'cafe-1', address: '123 Main St', totalSeats: 20, activeSeats: 14, status: 'active' },
  { id: 'branch-2', name: 'Uptown Arena', cafeId: 'cafe-1', address: '456 High St', totalSeats: 15, activeSeats: 10, status: 'active' },
  { id: 'branch-3', name: 'Westside Lounge', cafeId: 'cafe-2', address: '789 West Blvd', totalSeats: 25, activeSeats: 18, status: 'active' },
  { id: 'branch-4', name: 'Eastside Den', cafeId: 'cafe-2', address: '321 East Ave', totalSeats: 12, activeSeats: 8, status: 'maintenance' },
];

export const MOCK_SEATS: Seat[] = Array.from({ length: 20 }, (_, i) => ({
  id: `seat-${i + 1}`,
  branchId: 'branch-1',
  number: i + 1,
  status: i < 8 ? 'occupied' : i === 18 ? 'maintenance' : 'available' as Seat['status'],
  playerName: i < 8 ? ['John D.', 'Sarah M.', 'Mike T.', 'Lisa K.', 'Dave W.', 'Amy R.', 'Chris L.', 'Nina P.'][i] : undefined,
  startTime: i < 8 ? `${9 + Math.floor(i / 2)}:${i % 2 === 0 ? '00' : '30'} AM` : undefined,
  gpuModel: i % 3 === 0 ? 'RTX 4090' : i % 3 === 1 ? 'RTX 4080' : 'RTX 4070 Ti',
}));

export const MOCK_GPU_NODES: GPUNode[] = [
  { id: 'gpu-1', name: 'Node Alpha', status: 'online', gpuModel: 'RTX 4090', temperature: 62, utilization: 78, memoryUsed: 18, memoryTotal: 24, location: 'Downtown Hub' },
  { id: 'gpu-2', name: 'Node Beta', status: 'online', gpuModel: 'RTX 4090', temperature: 58, utilization: 65, memoryUsed: 15, memoryTotal: 24, location: 'Downtown Hub' },
  { id: 'gpu-3', name: 'Node Gamma', status: 'warning', gpuModel: 'RTX 4080', temperature: 82, utilization: 95, memoryUsed: 15, memoryTotal: 16, location: 'Uptown Arena' },
  { id: 'gpu-4', name: 'Node Delta', status: 'offline', gpuModel: 'RTX 4080', temperature: 0, utilization: 0, memoryUsed: 0, memoryTotal: 16, location: 'Westside Lounge' },
  { id: 'gpu-5', name: 'Node Epsilon', status: 'online', gpuModel: 'RTX 4070 Ti', temperature: 55, utilization: 42, memoryUsed: 6, memoryTotal: 12, location: 'Eastside Den' },
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
