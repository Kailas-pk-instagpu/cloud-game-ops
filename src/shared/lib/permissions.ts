import { create } from 'zustand';
import type { Role, User } from '../types/auth';
import { AUTH_MODE } from './bff';
import { useAuthStore } from './store';

/**
 * Permissions (backend: insta-gpu-backend-dev docs/permissions.md). What a role may do is configurable by the super admin; the
 * backend sends the signed-in person's list in GET /me (`User.permissions`). Pages ask `can('branches.edit')` instead of checking
 * role names. Which cafe or branch a person sees is NOT a permission: that stays in branchScope.ts and the backend.
 * `locked` = platform-only: never given to cafe_owner or manager.
 */
export const PERMISSIONS = {
  'dashboard.view': { feature: 'Dashboard', description: "Own role's dashboard", locked: false },

  'users.view': { feature: 'Users', description: 'List users in scope', locked: false },
  'users.create.admin': { feature: 'Users', description: 'Create a Sales Manager', locked: true },
  'users.create.cafe_owner': { feature: 'Users', description: 'Create a cafe owner', locked: false },
  'users.create.manager': { feature: 'Users', description: 'Create a Floor Manager', locked: false },
  'users.edit': { feature: 'Users', description: "Edit a user's details", locked: false },
  'users.disable': { feature: 'Users', description: 'Enable or disable a user', locked: false },
  'users.reset_2fa': { feature: 'Users', description: "Reset or turn on a user's 2FA", locked: false },
  'users.reset_password': { feature: 'Users', description: 'Send a user a password reset', locked: false },
  'users.delete': { feature: 'Users', description: 'Delete a user', locked: false },

  'branches.view': { feature: 'Branches', description: 'List and open branches in scope', locked: false },
  'branches.create': { feature: 'Branches', description: 'Add a branch, live at once', locked: false },
  'branches.edit': { feature: 'Branches', description: 'Edit a branch, applied at once', locked: false },
  'branches.request': { feature: 'Branches', description: 'Add or edit a branch through approval; resubmit', locked: false },
  'branches.enable': { feature: 'Branches', description: 'Turn an inactive branch on', locked: false },
  'branches.disable': { feature: 'Branches', description: 'Turn a branch off', locked: false },
  'branches.maintenance': { feature: 'Branches', description: 'Start or end maintenance mode', locked: false },
  'branches.delete': { feature: 'Branches', description: 'Delete a branch', locked: false },
  'seats.config.view': { feature: 'Branches', description: "See a branch's seat configuration", locked: false },
  'seats.config.edit': { feature: 'Branches', description: 'Rename seats, set GPU model and status', locked: false },

  'approvals.view': { feature: 'Approvals', description: 'List approval requests', locked: true },
  'approvals.decide': { feature: 'Approvals', description: 'Approve or reject a request', locked: true },

  'seats.operate.view': { feature: 'Seat Management', description: 'Live seat grid of own branch', locked: false },
  'sessions.start': { feature: 'Seat Management', description: 'Check a player in', locked: false },
  'sessions.extend': { feature: 'Seat Management', description: 'Extend a running session', locked: false },
  'sessions.end': { feature: 'Seat Management', description: 'End billing and settle a session', locked: false },
  'seats.restart': { feature: 'Seat Management', description: 'Restart a seat', locked: false },

  'billing.view': { feature: 'Billing', description: 'Branch billing overview, usage and history', locked: false },
  'billing.pay': { feature: 'Billing', description: 'Pay outstanding invoices', locked: false },
  'billing.invoices.download': { feature: 'Billing', description: 'Download invoices', locked: false },
  'sessions.view': { feature: 'Billing', description: 'Session billing detail and active sessions', locked: false },
  'settlements.view': { feature: 'Billing', description: 'List and export settlements', locked: false },

  'issues.view': { feature: 'Issue reports', description: 'List issues in scope', locked: false },
  'issues.create': { feature: 'Issue reports', description: 'Report an issue', locked: false },
  'issues.reply': { feature: 'Issue reports', description: 'Reply in an issue', locked: false },
  'issues.status': { feature: 'Issue reports', description: "Change an issue's status", locked: false },
  'issues.delete': { feature: 'Issue reports', description: 'Delete an issue', locked: false },

  'analytics.view': { feature: 'Platform', description: 'Analytics', locked: false },
  'gpu_nodes.view': { feature: 'Platform', description: 'GPU node list and metrics', locked: true },
  'monitoring.view': { feature: 'Platform', description: 'Live sessions, failed transactions, logs, seat activity', locked: true },
  'integrations.status.view': { feature: 'Platform', description: 'E2Link and Horizon status in the navbar', locked: true },
  'integrations.manage': { feature: 'Platform', description: 'Integration settings (E2Link, Horizon)', locked: true },
  'permissions.manage': { feature: 'Platform', description: 'Edit role permissions', locked: true },
} as const satisfies Record<string, { feature: string; description: string; locked: boolean }>;

export type Permission = keyof typeof PERMISSIONS;

export const isPermission = (key: string): key is Permission => Object.prototype.hasOwnProperty.call(PERMISSIONS, key);

/** Never removable from super_admin (no lockout). */
export const PERMISSIONS_MANAGE: Permission = 'permissions.manage';

/** The default matrix, the same as the backend's seed (migration 000028). Used only in mock mode (VITE_AUTH_MODE=mock). */
export const DEFAULT_GRANTS: Record<Role, Permission[]> = {
  super_admin: [
    'dashboard.view',
    'users.view', 'users.create.admin', 'users.create.cafe_owner', 'users.create.manager', 'users.edit', 'users.disable',
    'users.reset_2fa', 'users.reset_password', 'users.delete',
    'branches.view', 'branches.create', 'branches.edit', 'branches.enable', 'branches.disable', 'branches.maintenance', 'branches.delete',
    'seats.config.view', 'seats.config.edit',
    'approvals.view', 'approvals.decide',
    'billing.view', 'billing.invoices.download', 'sessions.view', 'settlements.view',
    'issues.view', 'issues.reply', 'issues.status', 'issues.delete',
    'analytics.view', 'gpu_nodes.view', 'monitoring.view', 'integrations.status.view', 'integrations.manage', 'permissions.manage',
  ],
  admin: [
    'dashboard.view',
    'users.view', 'users.create.cafe_owner', 'users.edit', 'users.disable',
    'branches.view', 'branches.request', 'branches.enable',
    'seats.config.view',
    'billing.view', 'sessions.view', 'settlements.view',
    'integrations.status.view',
  ],
  cafe_owner: [
    'dashboard.view',
    'users.view', 'users.create.manager', 'users.edit', 'users.disable', 'users.reset_2fa', 'users.reset_password',
    'branches.view', 'branches.create', 'branches.edit',
    'seats.config.view', 'seats.config.edit',
    'sessions.end',
    'billing.view', 'billing.pay', 'billing.invoices.download', 'sessions.view', 'settlements.view',
    'issues.view', 'issues.create', 'issues.reply',
    'analytics.view',
  ],
  manager: [
    'dashboard.view',
    'seats.operate.view', 'sessions.start', 'sessions.extend', 'sessions.end', 'seats.restart',
    'billing.view', 'sessions.view', 'settlements.view',
  ],
};

/** Mock mode only: the matrix the permissions page edits in memory (bff mode keeps it in the backend). */
export const useMockGrants = create<{ grants: Record<Role, Permission[]>; setRole: (role: Role, keys: Permission[]) => void }>()((set) => ({
  grants: structuredClone(DEFAULT_GRANTS),
  setRole: (role, keys) => set((s) => ({ grants: { ...s.grants, [role]: [...keys].sort() } })),
}));

/** The person's permissions: from the backend (/me) in bff mode, from the mock matrix otherwise. */
export function permissionsOf(user: User | null, mockGrants: Record<Role, Permission[]> = useMockGrants.getState().grants): Permission[] {
  if (!user) return [];
  if (AUTH_MODE === 'bff') return user.permissions ?? [];
  return mockGrants[user.role] ?? [];
}

export function hasPermission(user: User | null, permission: Permission): boolean {
  return permissionsOf(user).includes(permission);
}

/** React: `const can = useCan(); if (can('branches.edit')) ...` — re-renders when the person or the mock matrix changes. */
export function useCan(): (permission: Permission) => boolean {
  const user = useAuthStore((s) => s.user);
  const mockGrants = useMockGrants((s) => s.grants);
  const list = permissionsOf(user, mockGrants);
  return (permission) => list.includes(permission);
}
