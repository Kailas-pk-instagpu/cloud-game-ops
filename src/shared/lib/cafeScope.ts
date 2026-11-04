import { Cafe } from './mock-data';
import { User } from '../types/auth';

/** Cafes the signed-in user is allowed to see, based on their role scope. */
export function getScopedCafes(cafes: Cafe[], currentUser: User | null): Cafe[] {
  if (!currentUser) return [];
  if (currentUser.role === 'super_admin') return cafes;
  if (currentUser.role === 'admin') {
    return cafes.filter(b => b.adminId === currentUser.id || currentUser.assignedScope.includes(b.tenantId));
  }
  if (currentUser.role === 'cafe_owner') {
    // Pending/rejected cafes stay invisible to the owner until approved, except the ones the owner asked for.
    return cafes.filter(
      b => (b.cafeOwnerId === currentUser.id || currentUser.assignedScope.some(s => s === b.tenantId))
        && ((b.status !== 'pending' && b.status !== 'rejected') || b.createdById === currentUser.id)
    );
  }
  return cafes.filter(b => b.managerId === currentUser.id && b.status !== 'pending' && b.status !== 'rejected');
}

/**
 * Narrows a scoped cafe list to the single person whose list was opened:
 * cafe owners own cafes, managers run cafes, sales managers oversee cafes.
 */
export function getCafesForUser(scoped: Cafe[], selectedUser?: User): Cafe[] {
  if (!selectedUser) return scoped;
  if (selectedUser.role === 'cafe_owner') return scoped.filter(b => b.cafeOwnerId === selectedUser.id);
  if (selectedUser.role === 'manager') return scoped.filter(b => b.managerId === selectedUser.id);
  if (selectedUser.role === 'admin') return scoped.filter(b => b.adminId === selectedUser.id);
  return [];
}
