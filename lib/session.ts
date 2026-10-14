import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { isOwner } from '@/lib/ownerAuth';

/** Signed session cookie (HS256 JWT). Replaces the old forgeable `user` cookie. */
export const SESSION_COOKIE = 'boop_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const ADMIN_USERNAMES = ['pez', 'easydidit'];

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === 'production') {
    // Fail closed: never sign/verify with a guessable secret in production.
    throw new Error('SESSION_SECRET is missing or too short');
  }
  return 'dev-only-insecure-session-secret';
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
  const token = request.cookies.get(SESSION_COOKIE)?.value;
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
  return !!u && ADMIN_USERNAMES.includes(u);
}

export const unauthorized = () => NextResponse.json({ error: 'Not logged in' }, { status: 401 });

