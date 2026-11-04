import { create } from 'zustand';
import { bffFetch } from '@/shared/lib/bff';
import type { BranchEditProposal } from '@/shared/lib/mock-data';
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
}

/** GET /api/v1/approvals row. */
export interface ApiRequest {
  id: string;
  kind: 'new_branch' | 'edit_branch';
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  tenant_id: string;
  tenant_name: string;
  branch_id: string | null;
  branch_name: string | null;
  proposed: ApiFields | null;
  current: ApiFields;
  requested_by: string;
  requested_at: string;
  decided_at: string | null;
  feedback: string | null;
}

const toProposal = (f: ApiFields, base: ApiFields = {}): BranchEditProposal => ({
  name: f.name ?? base.name ?? '',
  address: (f.address === undefined ? base.address : f.address) ?? '',
  totalSeats: 0,
  dailySpendLimitMinor: f.daily_spend_limit_minor === undefined ? base.daily_spend_limit_minor ?? null : f.daily_spend_limit_minor,
});

/** Requester names come from user management (not connected yet): the request shows the role that raises them. */
export function toRequest(r: ApiRequest): ApprovalRequest {
  return {
    id: r.id,
    type: r.kind === 'new_branch' ? 'new_cafe' : 'edit_cafe',
    branchId: r.branch_id ?? '',
    branchName: r.branch_name ?? '—',
    ownerName: r.tenant_name,
    createdById: r.requested_by,
    createdByName: 'Sales Manager',
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
