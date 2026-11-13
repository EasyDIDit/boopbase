/**
 * Temporary ban for IPs that keep probing scanner paths (code-level, per server instance).
 * This is a best-effort extra layer in middleware; the Vercel Firewall rule stays the main control.
 * Only scanner hits count, so normal visitors are never banned for browsing.
 */
export const BAN_HITS = 5; // scanner hits...
export const BAN_WINDOW_MS = 10 * 60 * 1000; // ...within 10 minutes
export const BAN_MS = 30 * 60 * 1000; // => 30 minute ban
const MAX_TRACKED = 5000;

type Entry = { hits: number[]; bannedUntil: number };

export class TempBan {
  private map = new Map<string, Entry>();

  isBanned(ip: string, now = Date.now()): boolean {
    const e = this.map.get(ip);
    if (!e) return false;
    if (e.bannedUntil > now) return true;
    if (e.bannedUntil && e.bannedUntil <= now) {
      e.bannedUntil = 0;
      e.hits = [];
    }
    return false;
  }

  /** Record one scanner hit. Returns true if this hit starts a ban. */
  recordScannerHit(ip: string, now = Date.now()): boolean {
    if (!ip || ip === 'unknown') return false;
    if (this.map.size > MAX_TRACKED) this.prune(now);
    const e = this.map.get(ip) || { hits: [], bannedUntil: 0 };
    e.hits = e.hits.filter((t) => now - t < BAN_WINDOW_MS);
    e.hits.push(now);
    let started = false;
    if (e.hits.length >= BAN_HITS && e.bannedUntil <= now) {
      e.bannedUntil = now + BAN_MS;
      started = true;
    }
    this.map.set(ip, e);
    return started;
  }

  private prune(now: number) {
    for (const [ip, e] of this.map) {
      if (e.bannedUntil <= now && e.hits.every((t) => now - t >= BAN_WINDOW_MS)) this.map.delete(ip);
    }
    if (this.map.size > MAX_TRACKED) this.map.clear();
  }
}
