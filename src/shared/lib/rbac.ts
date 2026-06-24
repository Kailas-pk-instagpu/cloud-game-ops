import { Role, ROLE_RANK, CHILD_ROLE } from '../types/auth';

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
  roles: Role[];
}

// POC: only Cafe Owner + Manager routes are exposed in the sidebar.
// Hidden routes are still mounted in App.tsx but removed from this list so they
// don't render in the sidebar nor are reachable for POC roles.
export const ROUTES: RouteConfig[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard', roles: ['cafe_owner', 'manager'] },
  { path: '/branches', label: 'Branches', icon: 'Building2', roles: ['cafe_owner'] },
  { path: '/seats', label: 'Seat Management', icon: 'Monitor', roles: ['manager'] },
  { path: '/bookings', label: 'Pre-Booking', icon: 'CalendarCheck', roles: ['cafe_owner', 'manager'] },
  { path: '/billing/session', label: 'Billing Session', icon: 'Wallet', roles: ['cafe_owner', 'manager'] },
  { path: '/billing/settlements', label: 'Settlements', icon: 'Receipt', roles: ['cafe_owner', 'manager'] },
  { path: '/notifications', label: 'Notifications', icon: 'Bell', roles: ['cafe_owner', 'manager'] },
  { path: '/settings', label: 'Settings', icon: 'Settings', roles: ['cafe_owner', 'manager'] },
];

export function getRoutesForRole(role: Role): RouteConfig[] {
  return ROUTES.filter(r => r.roles.includes(role));
}
