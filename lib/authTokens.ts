import crypto from 'crypto';

/**
 * One-time tokens for password reset and email verification.
 * Only the SHA-256 hash is stored; the raw token lives only in the emailed link.
 */
export const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
export const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const PASSWORD_MIN = 6; // matches the rule already shown on the sign-up form (EASY may raise to 8)
export const PASSWORD_MAX = 200;

export function newAuthToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString('base64url');
  return { token, hash: hashAuthToken(token) };
}

export function hashAuthToken(token: string): string {
  return crypto.createHash('sha256').update(`boop-auth:${token}`).digest('hex');
}

/** Shape check before any database lookup. */
export function looksLikeAuthToken(token: unknown): token is string {
  return typeof token === 'string' && /^[A-Za-z0-9_-]{40,60}$/.test(token);
}

export function passwordProblem(password: unknown): string | null {
  const p = typeof password === 'string' ? password : '';
  if (p.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
  if (p.length > PASSWORD_MAX) return 'Password is too long.';
  return null;
}

const EMAIL_RE = /^[^\s@<>"(),;:]{1,64}@[^\s@<>"(),;:]{1,185}\.[a-z]{2,24}$/i;

export function cleanEmail(raw: unknown): string {
  return typeof raw === 'string' ? raw.replace(/[\u0000-\u001f\u007f]/g, '').trim().toLowerCase() : '';
}

export function isValidEmail(email: string): boolean {
  return email.length <= 254 && EMAIL_RE.test(email);
}

/**
 * Base URL for links in auth emails. In production it is never taken from the request
 * (a forged Host header must not be able to point reset links at another site).
 */
export function authLinkBase(requestOrigin: string, env: Record<string, string | undefined> = process.env): string {
  const configured = env.BOOPBASE_PUBLIC_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  if (env.NODE_ENV === 'production') return 'https://www.boopbase.com';
  return requestOrigin.replace(/\/$/, '');
}
