import { useEffect } from 'react';
import { create } from 'zustand';
import { Cafe, CafeEditProposal, MOCK_USERS } from '@/shared/lib/mock-data';
import { useCafeStore } from '@/shared/lib/store';
import { AUTH_MODE } from '@/shared/lib/bff';
import { useCan } from '@/shared/lib/permissions';
import { useBackendApprovals } from './approvalsApi';

/**
 * Mock approval service layer for cafe onboarding.
 * Every public function maps 1:1 to a future backend endpoint
 * (submitNewCafe, submitEdit, approve, reject, resubmit) — swap the
 * implementations for real API calls without touching the UI.
 */

export type ApprovalRequestType = 'new_cafe' | 'edit_cafe';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalRequest {
  id: string;
  type: ApprovalRequestType;
  cafeId: string;
  cafeName: string;
  ownerId?: string;
  ownerName: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  status: ApprovalStatus;
  feedback?: string;
  /** Proposed values (edit requests only). */
  proposed?: CafeEditProposal;
  /** Snapshot of live values at submission time (edit requests only). */
  current?: CafeEditProposal;
  resolvedAt?: string;
}

interface Actor {
  id: string;
  name: string;
}

const ownerName = (id?: string) =>
  (id ? MOCK_USERS.find(u => u.id === id)?.name : undefined) ?? 'Unassigned';

/** Extract the editable fields of a cafe as a proposal/snapshot. */
export function toProposal(b: Cafe): CafeEditProposal {
  return {
    name: b.name,
    address: b.address,
    totalSeats: b.totalSeats,
    adminId: b.adminId,
    cafeOwnerId: b.cafeOwnerId,
    managerId: b.managerId,
    dailySpendLimitMinor: b.dailySpendLimitMinor,
  };
}

const newId = () => `ap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

interface ApprovalState {
  requests: ApprovalRequest[];
  /** Sales Manager submitted a brand-new cafe (cafe already stored as pending). */
  submitNewCafe: (cafe: Cafe, actor: Actor) => ApprovalRequest;
  /** Sales Manager proposed edits to an Active cafe; live values are NOT changed. */
  submitEdit: (cafe: Cafe, proposed: CafeEditProposal, actor: Actor) => ApprovalRequest;
  /** Super Admin approves: new cafe goes Active / edit values replace live values. */
  approve: (id: string) => void;
  /** Super Admin rejects: feedback is mandatory. */
  reject: (id: string, feedback: string) => void;
  /** Sales Manager resubmits a rejected cafe for approval. */
  resubmit: (cafeId: string, actor: Actor) => ApprovalRequest | null;
  pendingForCafe: (cafeId: string) => ApprovalRequest | undefined;
}

export const useApprovalStore = create<ApprovalState>()((set, get) => ({
  requests: [],

  submitNewCafe: (cafe, actor) => {
    const req: ApprovalRequest = {
      id: newId(),
      type: 'new_cafe',
      cafeId: cafe.id,
      cafeName: cafe.name,
      ownerId: cafe.cafeOwnerId,
      ownerName: ownerName(cafe.cafeOwnerId),
      createdById: actor.id,
      createdByName: actor.name,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    set(s => ({ requests: [req, ...s.requests] }));
    return req;
  },

  submitEdit: (cafe, proposed, actor) => {
    // Mark the cafe as edit-pending without touching live values.
    useCafeStore.getState().updateCafe(cafe.id, { pendingEdit: proposed, editFeedback: undefined });

    // A second edit while one is already pending replaces the previous proposal.
    const existing = get().requests.find(
      r => r.cafeId === cafe.id && r.type === 'edit_cafe' && r.status === 'pending'
    );
    if (existing) {
      set(s => ({
        requests: s.requests.map(r =>
          r.id === existing.id ? { ...r, proposed, createdAt: new Date().toISOString() } : r
        ),
      }));
      return { ...existing, proposed };
    }

    const req: ApprovalRequest = {
      id: newId(),
      type: 'edit_cafe',
      cafeId: cafe.id,
      cafeName: cafe.name,
      ownerId: cafe.cafeOwnerId,
      ownerName: ownerName(cafe.cafeOwnerId),
      createdById: actor.id,
      createdByName: actor.name,
      createdAt: new Date().toISOString(),
      status: 'pending',
      proposed,
      current: toProposal(cafe),
    };
    set(s => ({ requests: [req, ...s.requests] }));
    return req;
  },

  approve: (id) => {
    const req = get().requests.find(r => r.id === id);
    if (!req || req.status !== 'pending') return;
    const cafeStore = useCafeStore.getState();

    if (req.type === 'new_cafe') {
      cafeStore.updateCafe(req.cafeId, { status: 'active', approvalFeedback: undefined });
    } else if (req.proposed) {
      const p = req.proposed;
      cafeStore.updateCafe(req.cafeId, {
        name: p.name,
        address: p.address,
        totalSeats: p.totalSeats,
        adminId: p.adminId,
        cafeOwnerId: p.cafeOwnerId,
        managerId: p.managerId,
        pendingEdit: undefined,
        editFeedback: undefined,
      });
    }

    set(s => ({
      requests: s.requests.map(r =>
        r.id === id ? { ...r, status: 'approved', resolvedAt: new Date().toISOString() } : r
      ),
    }));
  },

  reject: (id, feedback) => {
    const req = get().requests.find(r => r.id === id);
    if (!req || req.status !== 'pending' || !feedback.trim()) return;
    const cafeStore = useCafeStore.getState();

    if (req.type === 'new_cafe') {
      cafeStore.updateCafe(req.cafeId, { status: 'rejected', approvalFeedback: feedback.trim() });
    } else {
      // Old values stay live; the Sales Manager can revise and resubmit.
      cafeStore.updateCafe(req.cafeId, { pendingEdit: undefined, editFeedback: feedback.trim() });
    }

    set(s => ({
      requests: s.requests.map(r =>
        r.id === id
          ? { ...r, status: 'rejected', feedback: feedback.trim(), resolvedAt: new Date().toISOString() }
          : r
      ),
    }));
  },

  resubmit: (cafeId, actor) => {
    const cafe = useCafeStore.getState().cafes.find(b => b.id === cafeId);
    if (!cafe || cafe.status !== 'rejected') return null;
    useCafeStore.getState().updateCafe(cafeId, { status: 'pending', approvalFeedback: undefined });
    return get().submitNewCafe({ ...cafe, status: 'pending' }, actor);
  },

  pendingForCafe: (cafeId) =>
    get().requests.find(r => r.cafeId === cafeId && r.status === 'pending'),
}));

/** Live count of pending approvals for the sidebar badge (backend queue unless VITE_AUTH_MODE=mock). */
export function usePendingApprovalCount() {
  const mock = useApprovalStore(s => s.requests.filter(r => r.status === 'pending').length);
  const backend = useBackendApprovals(s => s.requests.length);
  const loaded = useBackendApprovals(s => s.loaded);
  const load = useBackendApprovals(s => s.load);
  const mayView = useCan()('approvals.view');
  useEffect(() => {
    if (AUTH_MODE === 'bff' && mayView && !loaded) void load();
  }, [mayView, loaded, load]);
  return AUTH_MODE === 'bff' ? (mayView ? backend : 0) : mock;
}
