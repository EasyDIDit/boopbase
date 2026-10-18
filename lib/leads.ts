import crypto from 'crypto';

/**
 * Boop sign-up form (store /boop "Join the list" + "Help design the band") → BOOPbase /api/leads.
 * Signed with its own secret (BOOPBASE_LEADS_SECRET), not the provision secret: a leaked leads secret can only add
 * list sign-ups, never reserve cards. Signature domain "lead." so a provision signature can never replay here.
 * Off unless BOOP_LEADS_ENABLED=true (production only), so previews never write to the shared database.
 */
export const LEAD_MAX_SKEW_MS = 5 * 60 * 1000;
export const LEAD_RATE_LIMIT = 5; // per key per hour
export const EMAIL_CONSENT_TEXT = 'Yes, email me Boop updates and early access news. I can unsubscribe anytime.';
export const TEXT_CONSENT_TEXT = 'Yes, text me Boop updates at this number. I can opt out anytime.';
export const LEAD_INTERESTS = ['band-design', 'stickers', 'team-cards'] as const;
export const LEAD_SOURCES = ['join-list', 'band-design'] as const;
export type LeadInterest = (typeof LEAD_INTERESTS)[number];
export type LeadSource = (typeof LEAD_SOURCES)[number];

/** Statuses that came from a real purchase/claim. A lead sign-up never overwrites these. */
export const CUSTOMER_SOURCES = ['online_order', 'claim', 'in_person_sale', 'signup'];

export function leadsEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.BOOP_LEADS_ENABLED === 'true';
}

export function leadsSecret(env: Record<string, string | undefined> = process.env): string | null {
  const s = env.BOOPBASE_LEADS_SECRET?.trim();
  return s && s.length >= 32 ? s : null;
}

export function signLead(secret: string, timestamp: string, rawBody: string): string {
  return crypto.createHmac('sha256', secret).update(`lead.${timestamp}.${rawBody}`).digest('hex');
}

export function verifyLeadSignature(secret: string, rawBody: string, timestamp: string | null, signature: string | null, now = Date.now()): boolean {
  if (!timestamp || !signature || !/^\d{10,13}$/.test(timestamp) || !/^[0-9a-f]{64}$/i.test(signature)) return false;
  const ms = timestamp.length <= 10 ? Number(timestamp) * 1000 : Number(timestamp);
  if (Math.abs(now - ms) > LEAD_MAX_SKEW_MS) return false;
  const expected = Buffer.from(signLead(secret, timestamp, rawBody), 'hex');
  const given = Buffer.from(signature, 'hex');
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

export type LeadBody = {
  name: string;
  email: string;
  phone: string;
  textConsent: boolean;
  interests: LeadInterest[];
  source: LeadSource;
  ipHash: string;
};

const EMAIL_RE = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,185}\.[a-z]{2,24}$/i;

/** Strict parse; anything unexpected → null. Strips control characters. */
export function parseLeadBody(raw: unknown): LeadBody | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const clean = (v: unknown) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, '').trim() : '');
  const name = clean(r.name);
  const email = clean(r.email).toLowerCase();
  const phone = clean(r.phone);
  if (!name || name.length > 80) return null;
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) return null;
  if (phone && (phone.length > 30 || !/^[0-9+()\-.\s]{7,30}$/.test(phone))) return null;
  if (r.emailConsent !== true || r.consentText !== EMAIL_CONSENT_TEXT) return null;
  if (!LEAD_SOURCES.includes(r.source as LeadSource)) return null;
  if (r.interests !== undefined && !Array.isArray(r.interests)) return null;
  const list = (r.interests as unknown[] | undefined) ?? [];
  if (list.length > LEAD_INTERESTS.length || !list.every((i) => LEAD_INTERESTS.includes(i as LeadInterest))) return null;
  const ipHash = typeof r.ipHash === 'string' && /^[0-9a-f]{64}$/.test(r.ipHash) ? r.ipHash : '';
  return {
    name,
    email,
    phone,
    textConsent: Boolean(phone) && r.textConsent === true,
    interests: [...new Set(list as LeadInterest[])],
    source: r.source as LeadSource,
    ipHash,
  };
}

/** Mongo update for a sign-up. Never touches status/username/source/marketingOptOut on existing rows. */
export function leadUpdate(b: LeadBody, now = new Date()) {
  const set: Record<string, unknown> = { name: b.name, consentAt: now, consentText: EMAIL_CONSENT_TEXT, updatedAt: now };
  if (b.phone) set.phone = b.phone;
  if (b.textConsent) {
    set.textConsentAt = now;
    set.textConsentText = TEXT_CONSENT_TEXT;
  }
  return {
    $setOnInsert: { email: b.email, source: 'lead_form', status: 'lead', createdAt: now },
    $set: set,
    $addToSet: { interests: { $each: b.interests }, sources: b.source },
  };
}

/** Derived for the owner list: anyone who bought, claimed, registered or has a card is a customer. */
export function customerStatus(c: { status?: string; username?: string; source?: string }, deviceCount = 0): 'customer' | 'lead' {
  if (c.status === 'customer' || c.username || deviceCount > 0 || CUSTOMER_SOURCES.includes(c.source || '')) return 'customer';
  return 'lead';
}

export function throttleKeys(b: LeadBody, now = Date.now()): string[] {
  const hour = Math.floor(now / 3_600_000);
  const keys = [`email:${b.email}:${hour}`];
  if (b.ipHash) keys.push(`ip:${b.ipHash}:${hour}`);
  return keys;
}

/** CSV cell, quoted, with spreadsheet-formula injection neutralised. */
export function csvCell(v: unknown): string {
  let s = Array.isArray(v) ? v.join('; ') : v instanceof Date ? v.toISOString() : String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
