/**
 * Username rules for BOOPbase public links (boopbase.com/{username}).
 * Applies to new sign-ups and username changes. Existing usernames keep working.
 */
import { ADMIN_USERNAMES, OWNER_USERNAMES } from './ownerAuth';

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;

/** App routes, public folders and words that must never be a profile link. */
export const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'api', 'app', 'auth', 'boop', 'boopbase', 'brand', 'claim', 'contact',
  'dashboard', 'easydidit', 'favicon', 'forgot-password', 'help', 'login', 'logout', 'mascots',
  'me', 'mint', 'null', 'owner', 'p', 'privacy', 'register', 'report', 'reset-password', 'robots',
  'root', 'settings', 'signin', 'signup', 'skins', 'staff', 'support', 'system', 'terms',
  'undefined', 'uploads', 'verify-email', 'www', '_next',
]);

/** Endings that look like files; the probe blocker would treat these paths as scanner traffic. */
const FILE_LIKE = /\.(php|env|git|bak|backup|bkp|old|orig|save|swp|swo|tmp|sql|sqlite|db|dump|zip|tar|gz|tgz|rar|7z|log|ini|cfg|conf|pem|key|crt|p12|pfx|config|yml|yaml|xml|json|txt|html?|js|css|map|png|jpe?g|gif|svg|webp|ico|vcf|pdf)$/;

/** Lower-case and drop characters that can't be in a link. */
export function cleanUsername(raw: unknown): string {
  return String(raw ?? '')
    .toLowerCase()
    .trim()
    .replace(/@/g, '')
    .replace(/[^a-z0-9._-]/g, '');
}

export function isReservedUsername(username: string): boolean {
  const u = username.toLowerCase();
  return RESERVED_USERNAMES.has(u) || ADMIN_USERNAMES.includes(u) || OWNER_USERNAMES.includes(u);
}

export type UsernameCheck = { ok: true; username: string } | { ok: false; error: string };

/** Validates a requested username. `raw` is what the person typed. */
export function checkUsername(raw: unknown): UsernameCheck {
  const typed = String(raw ?? '');
  if (typed.includes('@')) return { ok: false, error: 'No @. Your link is just yourname.' };
  const username = cleanUsername(typed);
  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
    return { ok: false, error: `Username must be ${USERNAME_MIN}–${USERNAME_MAX} letters or numbers.` };
  }
  if (!/^[a-z0-9]/.test(username) || !/[a-z0-9]$/.test(username)) {
    return { ok: false, error: 'Username must start and end with a letter or number.' };
  }
  if (/[._-]{2,}/.test(username)) {
    return { ok: false, error: 'Use only one dot, dash or underscore in a row.' };
  }
  if (FILE_LIKE.test(username)) return { ok: false, error: 'That username looks like a file name. Try another.' };
  if (isReservedUsername(username)) return { ok: false, error: 'That username is not available.' };
  return { ok: true, username };
}
