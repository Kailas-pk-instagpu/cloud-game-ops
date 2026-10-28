/**
 * Talks to the InstaGPU backend through its BFF (bff-service). The browser never sees a token: sign-in happens on Keycloak, the BFF keeps
 * the tokens and gives this app an HttpOnly session cookie plus a readable CSRF cookie. All calls go to the same origin under /bff
 * (Vite proxies /bff to the BFF in development), so cookies are first-party.
 *
 *   GET  /bff/auth/login?returnTo=/x  -> Keycloak login page -> back to /x with a session
 *   POST /bff/auth/logout             -> { logout_url } (Keycloak end-session page, then /login)
 *   ANY  /bff/api/v1/...              -> Kong -> the backend services
 */
import type { Role, User } from '../types/auth';

export type AuthMode = 'bff' | 'mock';

/** VITE_AUTH_MODE=mock keeps the old demo logins (no backend needed). Default: the real backend. */
export const AUTH_MODE: AuthMode = import.meta.env.VITE_AUTH_MODE === 'mock' ? 'mock' : 'bff';

const BFF = '/bff';
const CSRF_COOKIE = /(?:^|;\s*)(?:__Host-)?igpu_csrf=([^;]+)/;

export class BffError extends Error {
  constructor(readonly status: number, readonly code: string, message: string, readonly correlationId?: string) {
    super(message);
  }
}

function csrfToken(): string | undefined {
  const m = document.cookie.match(CSRF_COOKIE);
  return m ? decodeURIComponent(m[1]) : undefined;
}

/** fetch() for the backend: same-origin cookies, CSRF header on changes, JSON in and out, the error envelope as BffError. */
export async function bffFetch<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  headers.set('accept', 'application/json');
  if (!['GET', 'HEAD'].includes(method)) {
    const csrf = csrfToken();
    if (csrf) headers.set('x-csrf-token', csrf);
  }
  let body = init.body;
  if (init.json !== undefined) {
    headers.set('content-type', 'application/json');
    body = JSON.stringify(init.json);
  }
  const res = await fetch(`${BFF}${path}`, { ...init, method, headers, body, credentials: 'same-origin' });
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const env = (data ?? {}) as { code?: string; message?: string; correlation_id?: string };
    throw new BffError(res.status, env.code ?? 'HTTP_' + res.status, env.message ?? res.statusText, env.correlation_id);
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Shape of GET /api/v1/me (auth-service). */
export interface MeResponse {
  user_id: string;
  email: string | null;
  name: string | null;
  role: Role | null;
  roles: Role[];
  tenant_scope: '*' | string[];
  memberships: { tenant_id: string; role: 'CAFE_OWNER' | 'BRANCH_MANAGER'; branch_id: string | null }[];
  phone: string | null;
  address: string | null;
  has_avatar: boolean;
  created_by: string | null;
  created_at: string;
}

/** The backend's /me as the app's User. Two-factor is handled by Keycloak, so the app's own 2FA step never applies. */
export function toUser(me: MeResponse): User {
  if (!me.role) throw new BffError(403, 'NO_ROLE', 'Your login has no InstaGPU role yet. Ask your administrator to assign one.');
  const scope =
    me.tenant_scope === '*'
      ? ['*']
      : me.role === 'manager'
        ? me.memberships.map((m) => m.branch_id ?? m.tenant_id)
        : me.memberships.map((m) => m.tenant_id);
  return {
    id: me.user_id,
    email: me.email ?? '',
    name: me.name ?? me.email ?? 'User',
    role: me.role,
    createdBy: me.created_by,
    assignedScope: [...new Set(scope)],
    is2FAEnabled: false,
    twoFAMethod: null,
    phone: me.phone ?? undefined,
    address: me.address ?? undefined,
    createdAt: me.created_at,
  };
}

export const fetchMe = () => bffFetch<MeResponse>('/api/v1/me');

/** Full-page navigation to Keycloak (code + PKCE through the BFF). action=password opens Keycloak's change-password step. */
export function redirectToLogin(returnTo = '/dashboard', action?: 'password') {
  const q = new URLSearchParams({ returnTo });
  if (action) q.set('action', action);
  window.location.assign(`${BFF}/auth/login?${q}`);
}

/** Ends the BFF and Keycloak sessions; returns where to send the browser. */
export async function logoutUrl(): Promise<string> {
  try {
    const { logout_url } = await bffFetch<{ logout_url: string }>('/auth/logout', { method: 'POST' });
    return logout_url;
  } catch {
    return '/login'; // session already gone
  }
}

/** Messages for /login?error=... set by the BFF callback. */
export const LOGIN_ERRORS: Record<string, string> = {
  login_failed: 'Sign-in could not be completed. Please try again.',
  login_expired: 'The sign-in took too long. Please try again.',
  not_provisioned: 'Your login is not set up in InstaGPU yet, or it is disabled. Contact your administrator.',
};
