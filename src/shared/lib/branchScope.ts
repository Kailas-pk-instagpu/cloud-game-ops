import { Branch } from './mock-data';
import { User } from '../types/auth';

/** Branches the signed-in user is allowed to see, based on their role scope. */
export function getScopedBranches(branches: Branch[], currentUser: User | null): Branch[] {
  if (!currentUser) return [];
  if (currentUser.role === 'super_admin') return branches;
  if (currentUser.role === 'admin') {
    return branches.filter(b => b.adminId === currentUser.id || currentUser.assignedScope.includes(b.cafeId));
  }
  if (currentUser.role === 'cafe_owner') {
    // Pending/rejected cafes stay invisible to the owner until approved.
    return branches.filter(
      b => (b.cafeOwnerId === currentUser.id || currentUser.assignedScope.some(s => s === b.cafeId))
        && b.status !== 'pending' && b.status !== 'rejected'
    );
  }
  return branches.filter(b => b.managerId === currentUser.id && b.status !== 'pending' && b.status !== 'rejected');
}

/**
 * Narrows a scoped branch list to the single person whose list was opened:
 * cafe owners own branches, managers run branches, sales managers oversee branches.
 */
export function getBranchesForUser(scoped: Branch[], selectedUser?: User): Branch[] {
  if (!selectedUser) return scoped;
  if (selectedUser.role === 'cafe_owner') return scoped.filter(b => b.cafeOwnerId === selectedUser.id);
  if (selectedUser.role === 'manager') return scoped.filter(b => b.managerId === selectedUser.id);
  if (selectedUser.role === 'admin') return scoped.filter(b => b.adminId === selectedUser.id);
  return [];
}
