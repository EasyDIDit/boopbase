import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { isOwner, isAdminUsername } from '@/lib/ownerAuth';

/** Signed session cookie (HS256 JWT). Replaces the old forgeable `user` cookie. */
export const SESSION_COOKIE = 'boop_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** Values that must never be accepted as a signing secret (old dev default, placeholders). */
const KNOWN_WEAK = new Set(['dev-only-insecure-session-secret', 'changeme', 'secret', 'session_secret', 'your-secret-here']);
export const SESSION_SECRET_MIN = 16;

/** Null when the secret is usable; otherwise why not. Never returns or logs the value. */
export function sessionSecretProblem(secret: string | undefined): string | null {
  const s = (secret || '').trim();
  if (!s) return 'SESSION_SECRET is not set';
  if (s.length < SESSION_SECRET_MIN) return 'SESSION_SECRET is too short';
  if (KNOWN_WEAK.has(s.toLowerCase()) || /^(.)\1+$/.test(s)) return 'SESSION_SECRET is a known/weak value';
  return null;
}

/**
 * Fail closed in every environment: no built-in fallback secret, so a missing or weak
 * SESSION_SECRET means nobody can sign in (and no forged cookie can verify) until it is fixed.
 * Local dev: put a random SESSION_SECRET in .env.local (never committed).
 */
function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  const problem = sessionSecretProblem(secret);
  if (problem) throw new Error(problem);
  return secret as string; // used exactly as stored, so existing sessions stay valid
}

function cookieDomain(request: NextRequest) {
  const host = request.headers.get('host') || '';
  return host.endsWith('boopbase.com') ? { domain: '.boopbase.com' } : {};
}

export function setSessionCookie(request: NextRequest, response: NextResponse, username: string) {
  const token = jwt.sign({ sub: username.toLowerCase() }, getSecret(), {
    algorithm: 'HS256',
    expiresIn: MAX_AGE,
  });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
    ...cookieDomain(request),
  });
  // Retire the legacy unsigned cookie.
  clearLegacyCookie(request, response);
}

function clearLegacyCookie(request: NextRequest, response: NextResponse) {
  response.cookies.set('user', '', { path: '/', maxAge: 0, ...cookieDomain(request) });
}

export function clearSessionCookie(request: NextRequest, response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
    ...cookieDomain(request),
  });
  clearLegacyCookie(request, response);
}

/** Verified username from the signed cookie, or null. */
export function getSessionUsername(request: NextRequest): string | null {
  return usernameFromSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

/** Same check for server components (pass cookies().get(SESSION_COOKIE)?.value). */
export function usernameFromSessionToken(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, getSecret(), { algorithms: ['HS256'] });
    if (typeof payload === 'object' && typeof payload.sub === 'string' && payload.sub) {
      return payload.sub.toLowerCase();
    }
  } catch {
    /* invalid / expired */
  }
  return null;
}

export function isSessionOwner(request: NextRequest) {
  return isOwner(getSessionUsername(request));
}

export function isSessionAdmin(request: NextRequest) {
  const u = getSessionUsername(request);
  return isAdminUsername(u);
}

export const unauthorized = () => NextResponse.json({ error: 'Not logged in' }, { status: 401 });

