import { Role, ROLE_RANK, CHILD_ROLE } from '../types/auth';
import type { Permission } from './permissions';

export function canCreateRole(creatorRole: Role): Role | null {
  return CHILD_ROLE[creatorRole];
}

export function canManageUser(creatorRole: Role, targetRole: Role): boolean {
  return ROLE_RANK[creatorRole] < ROLE_RANK[targetRole];
}

export function getVisibleUsers(currentRole: Role, currentUserId: string, allUsers: { role: Role; createdBy: string | null }[]): typeof allUsers {
  if (currentRole === 'super_admin') return allUsers;
  return allUsers.filter(u => u.createdBy === currentUserId || canManageUser(currentRole, u.role));
}

export interface RouteConfig {
  path: string;
  label: string;
  icon: string;
  /** Needed to see the menu item (and to open the page, App.tsx). Absent: every signed-in user. */
  permission?: Permission;
  /** Hidden from the menu for every role (the page is kept so it can be re-enabled later). */
  hidden?: boolean;
  /** Menu only, not access: these roles reach the page another way (the Sales Manager opens branches from Cafe Management). */
  menuHiddenFor?: Role[];
}

export const ROUTES: RouteConfig[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/users', label: 'User Management', icon: 'Users', permission: 'users.view' },
  { path: '/approvals', label: 'Approvals', icon: 'ClipboardCheck', permission: 'approvals.view' },
  { path: '/gpu-nodes', label: 'GPU Nodes', icon: 'Cpu', permission: 'gpu_nodes.view' },
  { path: '/branches', label: 'Branches', icon: 'Building2', permission: 'branches.view', menuHiddenFor: ['admin'] },
  { path: '/seats', label: 'Seat Management', icon: 'Monitor', permission: 'seats.operate.view' },
  // Pre-booking is temporarily hidden from every role — keep the entry so the page can be re-enabled later.
  { path: '/bookings', label: 'Pre-Booking', icon: 'CalendarCheck', hidden: true },
  { path: '/billing', label: 'Billing', icon: 'Wallet', permission: 'billing.view' },
  { path: '/monitoring', label: 'Monitoring', icon: 'Radar', permission: 'monitoring.view' },
  { path: '/issues', label: 'Issue Reports', icon: 'AlertTriangle', permission: 'issues.view' },
  { path: '/analytics', label: 'Analytics', icon: 'BarChart3', permission: 'analytics.view' },
  { path: '/permissions', label: 'Permissions', icon: 'ShieldCheck', permission: 'permissions.manage' },
  { path: '/notifications', label: 'Notifications', icon: 'Bell' },
  { path: '/settings', label: 'Settings', icon: 'Settings' },
];

/** Menu items for this person: by permission, not by role name. */
export function getRoutesForUser(role: Role, can: (p: Permission) => boolean): RouteConfig[] {
  return ROUTES.filter(r => !r.hidden && !r.menuHiddenFor?.includes(role) && (!r.permission || can(r.permission))).map(r =>
    role === 'admin' && r.path === '/users' ? { ...r, label: 'Cafe Management' } : r
  );
}
