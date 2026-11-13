import crypto from 'crypto';

/**
 * ADMIN_API_KEY (Bearer token for future assistant/scripts access).
 * Not wired to any route yet: today nothing in BOOPbase reads it, so it can't leak or be guessed.
 * When a route needs it, use this check: off unless the key is 32+ chars, no fallback,
 * constant-time compare, and the value is never logged or sent to the browser (no NEXT_PUBLIC_).
 */
export const ADMIN_API_KEY_MIN = 32;

export function adminApiKeyMatches(authorization: string | null | undefined, env: Record<string, string | undefined> = process.env): boolean {
  const key = env.ADMIN_API_KEY?.trim();
  if (!key || key.length < ADMIN_API_KEY_MIN) return false;
  const given = typeof authorization === 'string' && authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!given) return false;
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(key).digest();
  return crypto.timingSafeEqual(a, b);
}
