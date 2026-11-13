import type { NextRequest } from 'next/server';
import { getSessionUsername } from '@/lib/session';
import { LIMITS, clientIp, hitLimit, isLikelyBot, type Limit } from '@/lib/rateLimit';

export type StatKind = 'view' | 'tap' | 'social' | 'save';

const DEDUPE: Record<StatKind, Limit> = {
  view: LIMITS.viewDedupe,
  tap: LIMITS.tapDedupe,
  social: LIMITS.tapDedupe,
  save: LIMITS.saveDedupe,
};

/** Profile usernames are short, plain strings. Anything else is rejected before a query. */
export function cleanStatUsername(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const u = raw.toLowerCase().trim();
  return /^[a-z0-9._-]{1,40}$/.test(u) ? u : null;
}

export function cleanLinkId(raw: unknown): string | null {
  if (typeof raw !== 'string' && typeof raw !== 'number') return null;
  const id = String(raw);
  return /^[A-Za-z0-9_-]{1,64}$/.test(id) ? id : null;
}

/**
 * Should this hit move a counter? No for bots, for the owner looking at their own page,
 * for repeats from the same visitor inside the de-dupe window, and above a per-visitor hourly cap.
 * Fails closed (no count) if the limiter can't be reached.
 */
export async function shouldCount(request: NextRequest, kind: StatKind, username: string, extra = ''): Promise<boolean> {
  if (isLikelyBot(request.headers.get('user-agent'))) return false;
  if (getSessionUsername(request) === username) return false;
  const ip = clientIp(request);
  if (await hitLimit(LIMITS.analyticsIp, ip, { failOpen: false })) return false;
  return !(await hitLimit(DEDUPE[kind], `${kind}:${username}:${extra}:${ip}`, { failOpen: false }));
}
