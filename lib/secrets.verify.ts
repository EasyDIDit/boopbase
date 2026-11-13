// Run: npx tsx lib/secrets.verify.ts  (no network, no database)
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { sessionSecretProblem, usernameFromSessionToken } from './session';
import { adminApiKeyMatches } from './adminApiKey';
import { authLinkBase, hashAuthToken, looksLikeAuthToken, newAuthToken } from './authTokens';
import { mailerConfig } from './mailer';
import { hashId, isLikelyBot, isOver, limitKey, LIMITS } from './rateLimit';

let checks = 0;
const ok = (c: unknown, m: string) => { assert.ok(c, m); checks++; };

// SESSION_SECRET: fail closed, no fallback
ok(sessionSecretProblem(undefined) !== null, 'missing secret rejected');
ok(sessionSecretProblem('short') !== null, 'short secret rejected');
ok(sessionSecretProblem('dev-only-insecure-session-secret') !== null, 'old dev default rejected');
ok(sessionSecretProblem('a'.repeat(40)) !== null, 'repeated-char secret rejected');
ok(sessionSecretProblem('9f2c1b7e4a6d8c0e3b5a7f9d1c3e5a7b') === null, 'random 32-char secret accepted');
const saved = process.env.SESSION_SECRET;
delete process.env.SESSION_SECRET;
ok(usernameFromSessionToken('anything.at.all') === null, 'no secret: every cookie is rejected (fail closed)');
const src = readFileSync('lib/session.ts', 'utf8');
ok(!/return ['"]dev-only/.test(src), 'no hard-coded fallback secret in session.ts');
if (saved) process.env.SESSION_SECRET = saved;

// ADMIN_API_KEY
const env = { ADMIN_API_KEY: 'k'.repeat(16) + 'Z'.repeat(20) };
ok(adminApiKeyMatches(`Bearer ${env.ADMIN_API_KEY}`, env), 'right key matches');
ok(!adminApiKeyMatches('Bearer wrong', env), 'wrong key rejected');
ok(!adminApiKeyMatches(`Bearer ${env.ADMIN_API_KEY}`, { ADMIN_API_KEY: 'short' }), 'short key = disabled');
ok(!adminApiKeyMatches('Bearer x', {}), 'no key = disabled');
ok(!adminApiKeyMatches(null, env), 'no header rejected');

// No secret env names reach client code
function walk(dir: string, out: string[] = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { if (f !== 'node_modules') walk(p, out); } else if (/\.(tsx?|jsx?)$/.test(f)) out.push(p);
  }
  return out;
}
for (const f of [...walk('app'), ...walk('components')]) {
  const s = readFileSync(f, 'utf8');
  if (!s.startsWith("'use client'") && !s.startsWith('"use client"')) continue;
  ok(!/SESSION_SECRET|ADMIN_API_KEY|RESEND_API_KEY|MONGODB_URI|PROVISION_SECRET|CRON_SECRET/.test(s), `client file has no secret env: ${f}`);
  ok(!/from '@\/lib\/(session|mongodb|mailer|adminApiKey)'/.test(s), `client file imports no server secret module: ${f}`);
}
ok(!/NEXT_PUBLIC_[A-Z_]*(SECRET|KEY)/.test(readFileSync('next.config.ts', 'utf8')), 'no NEXT_PUBLIC secret in next.config');

// Auth tokens
const t = newAuthToken();
ok(looksLikeAuthToken(t.token) && t.hash === hashAuthToken(t.token) && t.hash !== t.token, 'token is random, only hash stored');
ok(!looksLikeAuthToken({ $gt: '' }) && !looksLikeAuthToken('short'), 'token shape checked before lookup');
ok(authLinkBase('https://evil.example', { NODE_ENV: 'production' }) === 'https://www.boopbase.com', 'prod reset links ignore the request Host');
ok(authLinkBase('http://127.0.0.1:4410', { NODE_ENV: 'development' }) === 'http://127.0.0.1:4410', 'dev uses local origin');

// Mailer is off unless explicitly enabled
ok(mailerConfig({}) === null, 'no env: mailer off');
ok(mailerConfig({ RESEND_API_KEY: 're_x', BOOP_EMAIL_FROM: 'a@b.c' }) === null, 'key alone does not enable sending');
ok(mailerConfig({ BOOP_AUTH_EMAIL_ENABLED: 'true', RESEND_API_KEY: 're_x', BOOP_EMAIL_FROM: 'a@b.c' }) !== null, 'all three enable sending');

// Rate limit helpers
ok(!limitKey(LIMITS.loginIp, '203.0.113.9').includes('203.0.113.9'), 'raw IP never in a key');
ok(hashId('A@B.C') === hashId('a@b.c'), 'ids are case-insensitive');
ok(!isOver(LIMITS.loginAccount, LIMITS.loginAccount.max) && isOver(LIMITS.loginAccount, LIMITS.loginAccount.max + 1), 'limit boundary');
ok(isLikelyBot('') && isLikelyBot('curl/8.0') && isLikelyBot('facebookexternalhit/1.1') && !isLikelyBot('Mozilla/5.0 (iPhone) Safari'), 'bot detection');

console.log(`secrets.verify: ${checks} checks passed`);
