import { create } from 'zustand';
import { bffFetch } from '@/shared/lib/bff';
import type { Branch, BranchEditProposal } from '@/shared/lib/mock-data';

/**
 * Branches and cafes from the backend (cafe-management-service through the BFF). Used by the Branches and Approvals pages when
 * VITE_AUTH_MODE is not "mock"; the mock stores stay for demo mode and for the screens not connected yet.
 *   GET    /api/v1/owners                       cafes (owner companies) in scope
 *   GET    /api/v1/branches                     branches in scope (owners never see pending / rejected ones)
 *   POST   /api/v1/branches                     new branch: always PENDING until the Super Admin approves (branches.request)
 *   PATCH  /api/v1/branches/:id                 edit, live (branches.edit), with the version last loaded
 *   POST   /api/v1/branches/:id/edit-requests   edit through approval (branches.request)
 *   POST   /api/v1/branches/:id/resubmit        a rejected new branch back for approval, optionally corrected
 *   POST   /api/v1/branches/:id/enable|disable|maintenance, DELETE /api/v1/branches/:id (close)
 * Every change sends a new Idempotency-Key, so a double click or a retry after a lost answer does not repeat it.
 */

/** GET /api/v1/branches row. */
export interface ApiBranch {
  id: string;
  tenant_id: string;
  tenant_name: string;
  code: string;
  name: string;
  address: string | null;
  status: string;
  daily_spend_limit_minor: number | null;
  seat_count: number;
  version: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  pending_request: { id: string; kind: 'new_branch' | 'edit_branch'; requested_at: string } | null;
  pending_edit: { name?: string; address?: string | null; daily_spend_limit_minor?: number | null } | null;
  approval_feedback: string | null;
  edit_feedback: string | null;
}

/** GET /api/v1/owners row: a cafe (the owner's company). */
export interface Cafe {
  id: string;
  code: string;
  name: string;
  status: string;
  branch_count: number;
}

/** The fields the API takes for a branch. */
export interface BranchInput {
  name?: string;
  address?: string | null;
  daily_spend_limit_minor?: number | null;
}

const STATUSES: Branch['status'][] = ['active', 'maintenance', 'inactive', 'pending', 'rejected'];

/** The page's Branch shape. Team assignments come with user management (backend P1-3.5); seats are counted, not configured here yet. */
export function toBranch(b: ApiBranch): Branch {
  const status = (STATUSES as string[]).includes(b.status) ? (b.status as Branch['status']) : 'inactive'; // suspended / payment hold
  const pending: BranchEditProposal | undefined = b.pending_edit
    ? {
        name: b.pending_edit.name ?? b.name,
        address: (b.pending_edit.address === undefined ? b.address : b.pending_edit.address) ?? '',
        totalSeats: b.seat_count,
        dailySpendLimitMinor: b.pending_edit.daily_spend_limit_minor === undefined ? b.daily_spend_limit_minor : b.pending_edit.daily_spend_limit_minor,
      }
    : undefined;
  return {
    id: b.id,
    name: b.name,
    cafeId: b.tenant_id,
    tenantName: b.tenant_name,
    address: b.address ?? '',
    totalSeats: b.seat_count,
    activeSeats: b.seat_count,
    status,
    billing: { costPerMinute: 0, lockedAmount: 0, currency: 'MYR' },
    approvalFeedback: b.approval_feedback ?? undefined,
    editFeedback: b.edit_feedback ?? undefined,
    pendingEdit: pending,
    createdById: b.created_by ?? undefined,
    createdAt: b.created_at,
    version: b.version,
    dailySpendLimitMinor: b.daily_spend_limit_minor,
  };
}

const change = <T>(path: string, method: string, json?: unknown) =>
  bffFetch<T>(`/api/v1${path}`, { method, json: json ?? {}, headers: { 'idempotency-key': crypto.randomUUID() } });

interface BackendBranchesState {
  branches: Branch[];
  cafes: Cafe[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
  /** Load (or reload) cafes and branches in the caller's scope. Cafes need branches.view too, so both come together. */
  load: () => Promise<void>;
  /** Every new branch goes through Super Admin approval; approving opens its billing account and makes it live. */
  create: (tenantId: string, input: BranchInput & { name: string }) => Promise<void>;
  update: (branch: Branch, input: BranchInput) => Promise<void>;
  requestEdit: (branch: Branch, input: BranchInput) => Promise<void>;
  resubmit: (branch: Branch, corrections?: BranchInput) => Promise<void>;
  setActive: (branch: Branch, active: boolean) => Promise<void>;
  setMaintenance: (branch: Branch, on: boolean) => Promise<void>;
  close: (branch: Branch) => Promise<void>;
}

export const useBackendBranches = create<BackendBranchesState>()((set, get) => ({
  branches: [],
  cafes: [],
  loaded: false,
  loading: false,
  error: null,

  load: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const [branches, cafes] = await Promise.all([
        bffFetch<ApiBranch[]>('/api/v1/branches'),
        bffFetch<Cafe[]>('/api/v1/owners'),
      ]);
      set({ branches: branches.map(toBranch), cafes, loaded: true, loading: false });
    } catch (e) {
      set({ loading: false, loaded: true, error: e instanceof Error ? e.message : 'Could not load branches.' });
    }
  },

  create: async (tenantId, input) => {
    await change('/branches', 'POST', { tenant_id: tenantId, ...input });
    await get().load();
  },
  update: async (branch, input) => {
    await change(`/branches/${branch.id}`, 'PATCH', { version: branch.version, ...input });
    await get().load();
  },
  requestEdit: async (branch, input) => {
    await change(`/branches/${branch.id}/edit-requests`, 'POST', input);
    await get().load();
  },
  resubmit: async (branch, corrections) => {
    await change(`/branches/${branch.id}/resubmit`, 'POST', corrections ?? {});
    await get().load();
  },
  setActive: async (branch, active) => {
    await change(`/branches/${branch.id}/${active ? 'enable' : 'disable'}`, 'POST', { version: branch.version });
    await get().load();
  },
  setMaintenance: async (branch, on) => {
    await change(`/branches/${branch.id}/maintenance`, 'POST', { on, version: branch.version });
    await get().load();
  },
  close: async (branch) => {
    await change(`/branches/${branch.id}`, 'DELETE', { version: branch.version });
    await get().load();
  },
}));

/** Only the fields that differ from the branch's live values (what an edit or edit request sends). */
export function changedFields(branch: Branch, next: { name: string; address: string; dailySpendLimitMinor: number | null }): BranchInput {
  const out: BranchInput = {};
  if (next.name.trim() !== branch.name) out.name = next.name.trim();
  if (next.address.trim() !== (branch.address ?? '')) out.address = next.address.trim() || null;
  if (next.dailySpendLimitMinor !== (branch.dailySpendLimitMinor ?? null)) out.daily_spend_limit_minor = next.dailySpendLimitMinor;
  return out;
}

/** "500" / "500.50" (RM) -> 50000 sen; "" -> null; anything else -> undefined (invalid). */
export function parseRinggit(v: string): number | null | undefined {
  const t = v.trim();
  if (!t) return null;
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(t)) return undefined;
  return Math.round(Number(t) * 100);
}

export const formatRinggit = (sen: number | null | undefined) => (sen == null ? '' : (sen / 100).toFixed(2));
