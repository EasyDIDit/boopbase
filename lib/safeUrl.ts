/**
 * Normalize a user-supplied link URL. Returns an http(s) URL string, or null
 * if the value is empty or uses any other scheme (javascript:, data:, etc.).
 * A bare domain like "example.com" gets "https://" prepended.
 */
export function normalizeLinkUrl(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const raw = input.trim();
  if (!raw) return null;
  // Anything that looks like "scheme:" (but not "host:port") must be http(s).
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^[^/:]+:\d/.test(raw);
  const candidate = hasScheme ? raw : raw.startsWith('//') ? `https:${raw}` : `https://${raw}`;
  try {
    const u = new URL(candidate);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (!u.hostname) return null;
    return u.href;
  } catch {
    return null;
  }
}
