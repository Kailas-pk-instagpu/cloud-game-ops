import { create } from 'zustand';
import { bffFetch } from '@/shared/lib/bff';
import type { Cafe, CafeEditProposal } from '@/shared/lib/mock-data';

/**
 * Cafes and cafes from the backend (cafe-management-service through the BFF). Used by the Cafes and Approvals pages when
 * VITE_AUTH_MODE is not "mock"; the mock stores stay for demo mode and for the screens not connected yet.
 *   GET    /api/v1/owners                       owner accounts in scope
 *   GET    /api/v1/cafes                     cafes in scope (owners never see pending / rejected ones)
 *   POST   /api/v1/cafes                     new cafe: always PENDING until the Super Admin approves (cafes.request)
 *   PATCH  /api/v1/cafes/:id                 edit, live (cafes.edit), with the version last loaded
 *   POST   /api/v1/cafes/:id/edit-requests   edit through approval (cafes.request)
 *   POST   /api/v1/cafes/:id/resubmit        a rejected new cafe back for approval, optionally corrected
 *   POST   /api/v1/cafes/:id/enable|disable|maintenance, DELETE /api/v1/cafes/:id (close)
 * Every change sends a new Idempotency-Key, so a double click or a retry after a lost answer does not repeat it.
 */

/** GET /api/v1/cafes row. */
export interface ApiCafe {
  id: string;
  tenant_id: string;
  tenant_name: string;
  code: string;
  name: string;
  address: string | null;
  status: string;
  daily_spend_limit_minor: number | null;
  seat_count: number;
  /** Seats asked for with the new-cafe request (created when approved). */
  requested_seats: number | null;
  version: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  pending_request: { id: string; kind: 'new_cafe' | 'edit_cafe'; requested_at: string } | null;
  pending_edit: { name?: string; address?: string | null; daily_spend_limit_minor?: number | null } | null;
  approval_feedback: string | null;
  edit_feedback: string | null;
}

/** GET /api/v1/owners row: an owner's business account (core.tenants). */
export interface OwnerAccount {
  id: string;
  code: string;
  name: string;
  status: string;
  cafe_count: number;
}

/** The fields the API takes for a cafe. */
export interface CafeInput {
  /** New cafe (and a rejected one being corrected): how many seats it needs, 1-200. */
  requested_seats?: number;
  name?: string;
  address?: string | null;
  daily_spend_limit_minor?: number | null;
}

const STATUSES: Cafe['status'][] = ['active', 'maintenance', 'inactive', 'pending', 'rejected'];

/** The page's Cafe shape. Team assignments come with user management (backend P1-3.5); seats are counted, not configured here yet. */
export function toCafe(b: ApiCafe): Cafe {
  const status = (STATUSES as string[]).includes(b.status) ? (b.status as Cafe['status']) : 'inactive'; // suspended / payment hold
  const pending: CafeEditProposal | undefined = b.pending_edit
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
    tenantId: b.tenant_id,
    tenantName: b.tenant_name,
    address: b.address ?? '',
    // Before approval there are no seats yet: show the number asked for.
    totalSeats: b.seat_count || b.requested_seats || 0,
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

interface BackendCafesState {
  cafes: Cafe[];
  owners: OwnerAccount[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
  /** Load (or reload) owners and cafes in the caller's scope. Owners need cafes.view too, so both come together. */
  load: () => Promise<void>;
  /** Every new cafe goes through Super Admin approval; approving opens its billing account and makes it live. */
  create: (tenantId: string, input: CafeInput & { name: string }) => Promise<void>;
  update: (cafe: Cafe, input: CafeInput) => Promise<void>;
  requestEdit: (cafe: Cafe, input: CafeInput) => Promise<void>;
  resubmit: (cafe: Cafe, corrections?: CafeInput) => Promise<void>;
  setActive: (cafe: Cafe, active: boolean) => Promise<void>;
  setMaintenance: (cafe: Cafe, on: boolean) => Promise<void>;
  close: (cafe: Cafe) => Promise<void>;
}

export const useBackendCafes = create<BackendCafesState>()((set, get) => ({
  cafes: [],
  owners: [],
  loaded: false,
  loading: false,
  error: null,

  load: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const [cafes, owners] = await Promise.all([
        bffFetch<ApiCafe[]>('/api/v1/cafes'),
        bffFetch<OwnerAccount[]>('/api/v1/owners'),
      ]);
      set({ cafes: cafes.map(toCafe), owners, loaded: true, loading: false });
    } catch (e) {
      set({ loading: false, loaded: true, error: e instanceof Error ? e.message : 'Could not load cafes.' });
    }
  },

  create: async (tenantId, input) => {
    await change('/cafes', 'POST', { tenant_id: tenantId, ...input });
    await get().load();
  },
  update: async (cafe, input) => {
    await change(`/cafes/${cafe.id}`, 'PATCH', { version: cafe.version, ...input });
    await get().load();
  },
  requestEdit: async (cafe, input) => {
    await change(`/cafes/${cafe.id}/edit-requests`, 'POST', input);
    await get().load();
  },
  resubmit: async (cafe, corrections) => {
    await change(`/cafes/${cafe.id}/resubmit`, 'POST', corrections ?? {});
    await get().load();
  },
  setActive: async (cafe, active) => {
    await change(`/cafes/${cafe.id}/${active ? 'enable' : 'disable'}`, 'POST', { version: cafe.version });
    await get().load();
  },
  setMaintenance: async (cafe, on) => {
    await change(`/cafes/${cafe.id}/maintenance`, 'POST', { on, version: cafe.version });
    await get().load();
  },
  close: async (cafe) => {
    await change(`/cafes/${cafe.id}`, 'DELETE', { version: cafe.version });
    await get().load();
  },
}));

/** Only the fields that differ from the cafe's live values (what an edit or edit request sends). */
export function changedFields(cafe: Cafe, next: { name: string; address: string; dailySpendLimitMinor: number | null; requestedSeats?: number }): CafeInput {
  const out: CafeInput = {};
  if (next.requestedSeats !== undefined && next.requestedSeats !== cafe.totalSeats) out.requested_seats = next.requestedSeats;
  if (next.name.trim() !== cafe.name) out.name = next.name.trim();
  if (next.address.trim() !== (cafe.address ?? '')) out.address = next.address.trim() || null;
  if (next.dailySpendLimitMinor !== (cafe.dailySpendLimitMinor ?? null)) out.daily_spend_limit_minor = next.dailySpendLimitMinor;
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
