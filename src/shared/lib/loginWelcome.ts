import type { User } from '../types/auth';

/**
 * Module-level marker set the moment a sign-in succeeds.
 * The welcome popup consumes it once, so it appears exactly per login event
 * and never on a plain page refresh of an already-authenticated session.
 */
let pending: User | null = null;

export function markLoginWelcome(user: User) {
  pending = user;
}

export function consumeLoginWelcome(): User | null {
  const user = pending;
  pending = null;
  return user;
}
