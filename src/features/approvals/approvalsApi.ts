import { create } from 'zustand';
import { bffFetch } from '@/shared/lib/bff';
import type { CafeEditProposal } from '@/shared/lib/mock-data';
import type { ApprovalRequest } from './approvalService';

/**
 * The Super Admin's approval queue from the backend (cafe-management-service). Same ApprovalRequest shape as the mock store, so the
 * Approvals page renders both.
 *   GET  /api/v1/approvals?status=pending   POST /api/v1/approvals/:id/approve   POST /api/v1/approvals/:id/reject { feedback }
 */

interface ApiFields {
  name?: string;
  address?: string | null;
  daily_spend_limit_minor?: number | null;
  /** New-cafe requests: how many seats it asks for. */
  requested_seats?: number | null;
}

/** GET /api/v1/approvals row. */
export interface ApiRequest {
  id: string;
  kind: 'new_cafe' | 'edit_cafe';
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  tenant_id: string;
  tenant_name: string;
  cafe_id: string | null;
  cafe_name: string | null;
  proposed: ApiFields | null;
  current: ApiFields;
  requested_by: string;
  requested_at: string;
  decided_at: string | null;
  feedback: string | null;
}

const toProposal = (f: ApiFields, base: ApiFields = {}): CafeEditProposal => ({
  name: f.name ?? base.name ?? '',
  address: (f.address === undefined ? base.address : f.address) ?? '',
  totalSeats: f.requested_seats ?? base.requested_seats ?? 0,
  dailySpendLimitMinor: f.daily_spend_limit_minor === undefined ? base.daily_spend_limit_minor ?? null : f.daily_spend_limit_minor,
});

/** Requester names come from user management (not connected yet): the request shows the role that raises them. */
export function toRequest(r: ApiRequest): ApprovalRequest {
  return {
    id: r.id,
    type: r.kind === 'new_cafe' ? 'new_cafe' : 'edit_cafe',
    cafeId: r.cafe_id ?? '',
    cafeName: r.cafe_name ?? '—',
    ownerName: r.tenant_name,
    createdById: r.requested_by,
    // Owners and Sales Managers both request cafes; the API gives only the requester's id until names come from auth-service.
    createdByName: 'the requester',
    createdAt: r.requested_at,
    status: r.status === 'withdrawn' ? 'rejected' : r.status,
    feedback: r.feedback ?? undefined,
    current: toProposal(r.current),
    // An edit proposes only the fields it changes; the rest stay as they are.
    proposed: r.proposed ? toProposal(r.proposed, r.current) : undefined,
    resolvedAt: r.decided_at ?? undefined,
  };
}

interface BackendApprovalsState {
  requests: ApprovalRequest[];
  loaded: boolean;
  error: string | null;
  load: () => Promise<void>;
  approve: (id: string) => Promise<void>;
  reject: (id: string, feedback: string) => Promise<void>;
}

const decide = (path: string, json: unknown) =>
  bffFetch<ApiRequest>(`/api/v1/approvals${path}`, { method: 'POST', json, headers: { 'idempotency-key': crypto.randomUUID() } });

export const useBackendApprovals = create<BackendApprovalsState>()((set, get) => ({
  requests: [],
  loaded: false,
  error: null,
  load: async () => {
    try {
      const rows = await bffFetch<ApiRequest[]>('/api/v1/approvals?status=pending');
      set({ requests: rows.map(toRequest), loaded: true, error: null });
    } catch (e) {
      set({ loaded: true, error: e instanceof Error ? e.message : 'Could not load approvals.' });
    }
  },
  approve: async (id) => {
    await decide(`/${id}/approve`, {});
    await get().load();
  },
  reject: async (id, feedback) => {
    await decide(`/${id}/reject`, { feedback });
    await get().load();
  },
}));
