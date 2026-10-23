import { create } from 'zustand';
import { Branch, BranchEditProposal, MOCK_USERS } from '@/shared/lib/mock-data';
import { useBranchStore } from '@/shared/lib/store';

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
  branchId: string;
  branchName: string;
  ownerId?: string;
  ownerName: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  status: ApprovalStatus;
  feedback?: string;
  /** Proposed values (edit requests only). */
  proposed?: BranchEditProposal;
  /** Snapshot of live values at submission time (edit requests only). */
  current?: BranchEditProposal;
  resolvedAt?: string;
}

interface Actor {
  id: string;
  name: string;
}

const ownerName = (id?: string) =>
  (id ? MOCK_USERS.find(u => u.id === id)?.name : undefined) ?? 'Unassigned';

/** Extract the editable fields of a branch as a proposal/snapshot. */
export function toProposal(b: Branch): BranchEditProposal {
  return {
    name: b.name,
    address: b.address,
    totalSeats: b.totalSeats,
    adminId: b.adminId,
    cafeOwnerId: b.cafeOwnerId,
    managerId: b.managerId,
  };
}

const newId = () => `ap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

interface ApprovalState {
  requests: ApprovalRequest[];
  /** Sales Manager submitted a brand-new cafe (branch already stored as pending). */
  submitNewCafe: (branch: Branch, actor: Actor) => ApprovalRequest;
  /** Sales Manager proposed edits to an Active cafe; live values are NOT changed. */
  submitEdit: (branch: Branch, proposed: BranchEditProposal, actor: Actor) => ApprovalRequest;
  /** Super Admin approves: new cafe goes Active / edit values replace live values. */
  approve: (id: string) => void;
  /** Super Admin rejects: feedback is mandatory. */
  reject: (id: string, feedback: string) => void;
  /** Sales Manager resubmits a rejected cafe for approval. */
  resubmit: (branchId: string, actor: Actor) => ApprovalRequest | null;
  pendingForBranch: (branchId: string) => ApprovalRequest | undefined;
}

export const useApprovalStore = create<ApprovalState>()((set, get) => ({
  requests: [],

  submitNewCafe: (branch, actor) => {
    const req: ApprovalRequest = {
      id: newId(),
      type: 'new_cafe',
      branchId: branch.id,
      branchName: branch.name,
      ownerId: branch.cafeOwnerId,
      ownerName: ownerName(branch.cafeOwnerId),
      createdById: actor.id,
      createdByName: actor.name,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    set(s => ({ requests: [req, ...s.requests] }));
    return req;
  },

  submitEdit: (branch, proposed, actor) => {
    // Mark the branch as edit-pending without touching live values.
    useBranchStore.getState().updateBranch(branch.id, { pendingEdit: proposed, editFeedback: undefined });

    // A second edit while one is already pending replaces the previous proposal.
    const existing = get().requests.find(
      r => r.branchId === branch.id && r.type === 'edit_cafe' && r.status === 'pending'
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
      branchId: branch.id,
      branchName: branch.name,
      ownerId: branch.cafeOwnerId,
      ownerName: ownerName(branch.cafeOwnerId),
      createdById: actor.id,
      createdByName: actor.name,
      createdAt: new Date().toISOString(),
      status: 'pending',
      proposed,
      current: toProposal(branch),
    };
    set(s => ({ requests: [req, ...s.requests] }));
    return req;
  },

  approve: (id) => {
    const req = get().requests.find(r => r.id === id);
    if (!req || req.status !== 'pending') return;
    const branchStore = useBranchStore.getState();

    if (req.type === 'new_cafe') {
      branchStore.updateBranch(req.branchId, { status: 'active', approvalFeedback: undefined });
    } else if (req.proposed) {
      const p = req.proposed;
      branchStore.updateBranch(req.branchId, {
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
    const branchStore = useBranchStore.getState();

    if (req.type === 'new_cafe') {
      branchStore.updateBranch(req.branchId, { status: 'rejected', approvalFeedback: feedback.trim() });
    } else {
      // Old values stay live; the Sales Manager can revise and resubmit.
      branchStore.updateBranch(req.branchId, { pendingEdit: undefined, editFeedback: feedback.trim() });
    }

    set(s => ({
      requests: s.requests.map(r =>
        r.id === id
          ? { ...r, status: 'rejected', feedback: feedback.trim(), resolvedAt: new Date().toISOString() }
          : r
      ),
    }));
  },

  resubmit: (branchId, actor) => {
    const branch = useBranchStore.getState().branches.find(b => b.id === branchId);
    if (!branch || branch.status !== 'rejected') return null;
    useBranchStore.getState().updateBranch(branchId, { status: 'pending', approvalFeedback: undefined });
    return get().submitNewCafe({ ...branch, status: 'pending' }, actor);
  },

  pendingForBranch: (branchId) =>
    get().requests.find(r => r.branchId === branchId && r.status === 'pending'),
}));

/** Live count of pending approvals for the sidebar badge. */
export const usePendingApprovalCount = () =>
  useApprovalStore(s => s.requests.filter(r => r.status === 'pending').length);
