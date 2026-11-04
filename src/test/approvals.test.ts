import { describe, it, expect, beforeEach } from 'vitest';
import { useApprovalStore, toProposal } from '@/features/approvals/approvalService';
import { useCafeStore } from '@/shared/lib/store';
import { MOCK_CAFES, MOCK_USERS, Cafe } from '@/shared/lib/mock-data';
import { getScopedCafes } from '@/shared/lib/cafeScope';

const salesManager = { id: '2', name: 'Jordan Lee' };
const owner = MOCK_USERS.find(u => u.id === '4')!; // cafe_owner
const admin = MOCK_USERS.find(u => u.id === '2')!; // sales manager

let seq = 0;
const makeCafe = (over: Partial<Cafe> = {}): Omit<Cafe, 'id'> => ({
  name: `Test Cafe ${++seq}`,
  tenantId: 'tenant-9',
  address: '1 Test St',
  totalSeats: 10,
  activeSeats: 0,
  status: 'pending',
  adminId: '2',
  cafeOwnerId: '4',
  billing: { costPerMinute: 2, lockedAmount: 100, currency: 'MYR' },
  ...over,
});

const cafeById = (id: string) => useCafeStore.getState().cafes.find(b => b.id === id)!;

beforeEach(() => {
  useApprovalStore.setState({ requests: [] });
  useCafeStore.setState({ cafes: MOCK_CAFES.map(b => ({ ...b })) });
});

describe('new cafe approval flow', () => {
  it('a Sales Manager submission stays pending and creates a pending request', () => {
    const id = useCafeStore.getState().addCafe(makeCafe());
    const req = useApprovalStore.getState().submitNewCafe(cafeById(id), salesManager);

    expect(cafeById(id).status).toBe('pending');
    expect(req.status).toBe('pending');
    expect(req.type).toBe('new_cafe');
  });

  it('approve makes the cafe Active', () => {
    const id = useCafeStore.getState().addCafe(makeCafe());
    const req = useApprovalStore.getState().submitNewCafe(cafeById(id), salesManager);
    useApprovalStore.getState().approve(req.id);

    expect(cafeById(id).status).toBe('active');
    expect(useApprovalStore.getState().requests.find(r => r.id === req.id)?.status).toBe('approved');
  });

  it('reject without feedback is a no-op; with feedback the cafe becomes rejected', () => {
    const id = useCafeStore.getState().addCafe(makeCafe());
    const req = useApprovalStore.getState().submitNewCafe(cafeById(id), salesManager);

    useApprovalStore.getState().reject(req.id, '   ');
    expect(cafeById(id).status).toBe('pending');
    expect(useApprovalStore.getState().requests.find(r => r.id === req.id)?.status).toBe('pending');

    useApprovalStore.getState().reject(req.id, 'Address is incomplete');
    expect(cafeById(id).status).toBe('rejected');
    expect(cafeById(id).approvalFeedback).toBe('Address is incomplete');
  });

  it('resubmit moves a rejected cafe back to pending with a new request', () => {
    const id = useCafeStore.getState().addCafe(makeCafe());
    const req = useApprovalStore.getState().submitNewCafe(cafeById(id), salesManager);
    useApprovalStore.getState().reject(req.id, 'Fix the address');

    const resubmitted = useApprovalStore.getState().resubmit(id, salesManager);
    expect(resubmitted).not.toBeNull();
    expect(cafeById(id).status).toBe('pending');
    expect(cafeById(id).approvalFeedback).toBeUndefined();
    expect(
      useApprovalStore.getState().requests.filter(r => r.cafeId === id && r.status === 'pending')
    ).toHaveLength(1);
  });
});

describe('edit request flow', () => {
  it('a Sales Manager edit to an Active cafe does not change live values', () => {
    const live = cafeById('cafe-1');
    const proposed = { ...toProposal(live), name: 'Renamed Hub', totalSeats: 99 };
    useApprovalStore.getState().submitEdit(live, proposed, salesManager);

    const after = cafeById('cafe-1');
    expect(after.name).toBe('Downtown Hub');
    expect(after.totalSeats).toBe(20);
    expect(after.pendingEdit?.name).toBe('Renamed Hub');
  });

  it('approving an edit replaces the live values', () => {
    const live = cafeById('cafe-1');
    const proposed = { ...toProposal(live), address: '999 New Ave' };
    const req = useApprovalStore.getState().submitEdit(live, proposed, salesManager);
    useApprovalStore.getState().approve(req.id);

    const after = cafeById('cafe-1');
    expect(after.address).toBe('999 New Ave');
    expect(after.pendingEdit).toBeUndefined();
  });

  it('rejecting an edit keeps old values live and stores feedback', () => {
    const live = cafeById('cafe-1');
    const proposed = { ...toProposal(live), name: 'Renamed Hub' };
    const req = useApprovalStore.getState().submitEdit(live, proposed, salesManager);
    useApprovalStore.getState().reject(req.id, 'Name violates branding rules');

    const after = cafeById('cafe-1');
    expect(after.name).toBe('Downtown Hub');
    expect(after.pendingEdit).toBeUndefined();
    expect(after.editFeedback).toBe('Name violates branding rules');
  });

  it('a second edit while one is pending replaces the proposal instead of duplicating', () => {
    const live = cafeById('cafe-1');
    useApprovalStore.getState().submitEdit(live, { ...toProposal(live), name: 'First' }, salesManager);
    useApprovalStore.getState().submitEdit(cafeById('cafe-1'), { ...toProposal(live), name: 'Second' }, salesManager);

    const pendingEdits = useApprovalStore.getState().requests.filter(
      r => r.cafeId === 'cafe-1' && r.type === 'edit_cafe' && r.status === 'pending'
    );
    expect(pendingEdits).toHaveLength(1);
    expect(pendingEdits[0].proposed?.name).toBe('Second');
  });
});

describe('visibility scoping', () => {
  it('cafe owners cannot see pending or rejected cafes; sales managers can', () => {
    useCafeStore.getState().addCafe(makeCafe({ cafeOwnerId: '4', status: 'pending' }));
    useCafeStore.getState().addCafe(makeCafe({ cafeOwnerId: '4', status: 'rejected' }));
    const all = useCafeStore.getState().cafes;

    const ownerVisible = getScopedCafes(all, owner);
    expect(ownerVisible.every(b => b.status !== 'pending' && b.status !== 'rejected')).toBe(true);
    expect(ownerVisible.some(b => b.id === 'cafe-1')).toBe(true);

    const smVisible = getScopedCafes(all, admin);
    expect(smVisible.some(b => b.status === 'pending')).toBe(true);
    expect(smVisible.some(b => b.status === 'rejected')).toBe(true);
  });
});
