import crypto from 'crypto';
import type { NextRequest } from 'next/server';

/**
 * Fixed-window rate limits stored in Mongo (RateLimit model), so they hold across serverless instances.
 * Pure helpers here are unit-tested; `hitLimit` is the only part that touches the database.
 */

export type Limit = { name: string; max: number; windowMs: number };

const MIN = 60_000;
export const LIMITS = {
  loginIp: { name: 'login-ip', max: 20, windowMs: 15 * MIN },
  loginAccount: { name: 'login-acct', max: 8, windowMs: 15 * MIN },
  registerIp: { name: 'register-ip', max: 5, windowMs: 60 * MIN },
  resetIp: { name: 'reset-ip', max: 5, windowMs: 60 * MIN },
  resetEmail: { name: 'reset-email', max: 3, windowMs: 60 * MIN },
  verifyIp: { name: 'verify-ip', max: 10, windowMs: 60 * MIN },
  /** One counted view per visitor per profile per 30 minutes. */
  viewDedupe: { name: 'view', max: 1, windowMs: 30 * MIN },
  /** One counted tap per visitor per link (or social row) per minute. */
  tapDedupe: { name: 'tap', max: 1, windowMs: 1 * MIN },
  /** One counted contact save per visitor per profile per 30 minutes. */
  saveDedupe: { name: 'save', max: 1, windowMs: 30 * MIN },
  /** Overall analytics cap per visitor per hour; above this nothing is counted. */
  analyticsIp: { name: 'stats-ip', max: 300, windowMs: 60 * MIN },
} as const satisfies Record<string, Limit>;

/** Client IP as Vercel reports it. */
export function clientIp(request: Pick<NextRequest, 'headers'>): string {
  const fwd = request.headers.get('x-forwarded-for') || '';
  return fwd.split(',')[0].trim() || request.headers.get('x-real-ip')?.trim() || 'unknown';
}

/** Hash so raw IPs / emails are never stored in the rate-limit rows. */
export function hashId(value: string): string {
  return crypto.createHash('sha256').update(`boop-rl:${value.toLowerCase()}`).digest('hex').slice(0, 32);
}

export function windowStart(windowMs: number, now = Date.now()): number {
  return Math.floor(now / windowMs) * windowMs;
}

export function limitKey(limit: Limit, id: string, now = Date.now()): string {
  return `${limit.name}:${hashId(id)}:${windowStart(limit.windowMs, now)}`;
}

export function isOver(limit: Limit, count: number): boolean {
  return count > limit.max;
}

/** Seconds until the current window ends (for Retry-After). */
export function retryAfterSeconds(limit: Limit, now = Date.now()): number {
  return Math.max(1, Math.ceil((windowStart(limit.windowMs, now) + limit.windowMs - now) / 1000));
}

/**
 * Count one hit. Returns true when over the limit.
 * If the database call fails, `failOpen` decides: true = allow (login keeps working), false = treat as limited.
 */
export async function hitLimit(limit: Limit, id: string, { failOpen }: { failOpen: boolean }): Promise<boolean> {
  try {
    const { default: RateLimit } = await import('./models/RateLimit');
    const now = Date.now();
    const key = limitKey(limit, id, now);
    const expiresAt = new Date(windowStart(limit.windowMs, now) + limit.windowMs + MIN);
    const row = await RateLimit.findOneAndUpdate(
      { key },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
      { upsert: true, new: true }
    ).lean<{ count: number }>();
    return isOver(limit, row?.count ?? 0);
  } catch (err) {
    console.error('rate limit check failed', (err as Error).message);
    return !failOpen;
  }
}

/** Analytics bots: obvious crawlers/preview fetchers never move counters. */
export function isLikelyBot(userAgent: string | null | undefined): boolean {
  const ua = (userAgent || '').toLowerCase();
  if (!ua) return true;
  return /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|curl|wget|python|httpclient|headless|axios|node-fetch|go-http/.test(ua);
}
