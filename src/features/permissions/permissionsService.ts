import { AUTH_MODE, bffFetch, fetchMe, toUser } from '@/shared/lib/bff';
import { PERMISSIONS, useMockGrants, type Permission } from '@/shared/lib/permissions';
import { useAuthStore } from '@/shared/lib/store';
import type { Role } from '@/shared/types/auth';

/**
 * The super admin's permissions page. bff mode: auth-service
 *   GET /api/v1/admin/permissions              -> PermissionMatrix
 *   PUT /api/v1/admin/roles/:role/permissions  { permissions } -> { role, permissions, added, removed }
 * mock mode: the in-memory matrix in permissions.ts.
 */
export interface PermissionInfo {
  key: string;
  feature: string;
  description: string;
  /** Platform-only: can never be given to cafe_owner or manager. */
  locked: boolean;
}

export interface PermissionMatrix {
  roles: Role[];
  permissions: PermissionInfo[];
  grants: Record<Role, string[]>;
}

export interface RoleSaveResult {
  role: Role;
  permissions: string[];
  added: string[];
  removed: string[];
}

export async function loadPermissionMatrix(): Promise<PermissionMatrix> {
  if (AUTH_MODE === 'bff') return bffFetch<PermissionMatrix>('/api/v1/admin/permissions');
  const grants = useMockGrants.getState().grants;
  return {
    roles: ['super_admin', 'admin', 'cafe_owner', 'manager'],
    permissions: Object.entries(PERMISSIONS).map(([key, p]) => ({ key, ...p })),
    grants: structuredClone(grants),
  };
}

/** Replaces one role's list. When it is the signed-in person's own role, their permissions are reloaded so the menu follows. */
export async function saveRolePermissions(role: Role, permissions: string[]): Promise<RoleSaveResult> {
  let result: RoleSaveResult;
  if (AUTH_MODE === 'bff') {
    result = await bffFetch<RoleSaveResult>(`/api/v1/admin/roles/${role}/permissions`, { method: 'PUT', json: { permissions } });
  } else {
    const before = new Set(useMockGrants.getState().grants[role]);
    const after = new Set(permissions);
    useMockGrants.getState().setRole(role, permissions as Permission[]);
    result = {
      role,
      permissions: [...after].sort(),
      added: [...after].filter((k) => !before.has(k as Permission)).sort(),
      removed: [...before].filter((k) => !after.has(k)).sort(),
    };
  }
  const me = useAuthStore.getState().user;
  if (AUTH_MODE === 'bff' && me?.role === role) useAuthStore.setState({ user: toUser(await fetchMe()) });
  return result;
}
