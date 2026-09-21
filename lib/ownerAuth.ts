/**
 * Owner / minter gate for BOOPbase.
 * Sole operator account: peasy1 (profile + mint + client list).
 * Override with Vercel env OWNER_USERNAMES (comma-separated) if needed.
 */
export const OWNER_USERNAMES = (process.env.OWNER_USERNAMES || 'peasy1')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export function isOwner(username: string | undefined | null): boolean {
  if (!username) return false;
  return OWNER_USERNAMES.includes(username.toLowerCase());
}
