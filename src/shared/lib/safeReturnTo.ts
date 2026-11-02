/**
 * Where to go after sign-in: only a path inside this app ("/branches?x=1"), never another site ("//evil.com", "/\evil.com",
 * "https://evil.com"). The BFF checks the same again (services/bff-service/src/modules/auth/safe-redirect.ts).
 */
export function safeReturnTo(value: string | null | undefined, fallback = '/dashboard'): string {
  if (!value || !value.startsWith('/') || value.includes('\\') || value.startsWith('/login')) return fallback;
  try {
    const u = new URL(value, window.location.origin);
    if (u.origin !== window.location.origin) return fallback;
    return `${u.pathname}${u.search}${u.hash}` || fallback;
  } catch {
    return fallback;
  }
}
