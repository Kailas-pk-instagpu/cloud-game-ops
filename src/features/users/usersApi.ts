import { create } from 'zustand';
import { bffFetch } from '@/shared/lib/bff';
import type { Role } from '@/shared/types/auth';

/**
 * User Management from the backend (auth-service through the BFF). Used by the Users page ("Cafe Management" for the Sales
 * Manager) when VITE_AUTH_MODE is not "mock".
 *   GET  /api/v1/users                    people the caller manages (users.view)
 *   POST /api/v1/users/sales-managers     Super Admin                   (users.create.admin)
 *   POST /api/v1/users/cafe-owners        Super Admin / Sales Manager   (users.create.cafe_owner): login + owner account
 *   POST /api/v1/users/floor-managers     Super Admin / cafe owner      (users.create.manager): for one active cafe
 *   PATCH  /api/v1/users/:id                 name / phone (users.edit; the e-mail cannot be changed)
 *   POST   /api/v1/users/:id/disable|enable  (users.disable; disable also signs them out everywhere)
 *   POST   /api/v1/users/:id/reset-password  a new one-time password (users.reset_password)
 *   DELETE /api/v1/users/:id                 soft delete: login removed, history kept (users.delete)
 * Each create (and reset) answers a one-time password, shown once; the person must choose their own at the next sign-in.
 */
export interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  status: 'active' | 'disabled' | 'pending';
  tenant_id: string | null;
  tenant_name: string | null;
  cafes: Array<{ id: string; name: string }>;
  created_by: string | null;
  created_at: string;
}

export interface NewUser {
  full_name: string;
  email: string;
  phone?: string;
  /** Floor Managers: the active cafe they will run. */
  cafe_id?: string;
}

export interface CreatedUser {
  user: ApiUser;
  temporary_password: string;
}

const CREATE_PATH: Record<Exclude<Role, 'super_admin'>, string> = {
  admin: '/api/v1/users/sales-managers',
  cafe_owner: '/api/v1/users/cafe-owners',
  manager: '/api/v1/users/floor-managers',
};

interface BackendUsersState {
  users: ApiUser[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  create: (role: Exclude<Role, 'super_admin'>, input: NewUser) => Promise<CreatedUser>;
  update: (id: string, input: { full_name?: string; phone?: string | null }) => Promise<void>;
  setEnabled: (id: string, enabled: boolean) => Promise<void>;
  resetPassword: (id: string) => Promise<string>;
  remove: (id: string) => Promise<void>;
}

export const useBackendUsers = create<BackendUsersState>()((set, get) => ({
  users: [],
  loaded: false,
  loading: false,
  error: null,

  load: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      set({ users: await bffFetch<ApiUser[]>('/api/v1/users'), loaded: true, loading: false });
    } catch (e) {
      set({ loading: false, loaded: true, error: e instanceof Error ? e.message : 'Could not load users.' });
    }
  },

  create: async (role, input) => {
    const body = Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined && v !== ''));
    const created = await bffFetch<CreatedUser>(CREATE_PATH[role], { method: 'POST', json: body });
    await get().load();
    return created;
  },

  update: async (id, input) => {
    await bffFetch(`/api/v1/users/${id}`, { method: 'PATCH', json: input });
    await get().load();
  },
  setEnabled: async (id, enabled) => {
    await bffFetch(`/api/v1/users/${id}/${enabled ? 'enable' : 'disable'}`, { method: 'POST', json: {} });
    await get().load();
  },
  resetPassword: async (id) => (await bffFetch<{ temporary_password: string }>(`/api/v1/users/${id}/reset-password`, { method: 'POST', json: {} })).temporary_password,
  remove: async (id) => {
    await bffFetch(`/api/v1/users/${id}`, { method: 'DELETE' });
    await get().load();
  },
}));
