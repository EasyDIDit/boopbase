import crypto from 'crypto';

export const PROVISION_MAX_SKEW_MS = 5 * 60 * 1000;
export const CLAIM_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Dedicated secret, no fallback. Unset → provisioning is disabled. */
export function provisionSecret(env: Record<string, string | undefined> = process.env): string | null {
  const s = env.BOOPBASE_PROVISION_SECRET?.trim();
  return s && s.length >= 32 ? s : null;
}

export function signProvision(secret: string, timestamp: string, rawBody: string): string {
  return crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
}

export function verifyProvisionSignature(
  secret: string,
  rawBody: string,
  timestamp: string | null,
  signature: string | null,
  now = Date.now()
): boolean {
  if (!timestamp || !signature || !/^\d{10,13}$/.test(timestamp) || !/^[0-9a-f]{64}$/i.test(signature)) return false;
  const ms = timestamp.length <= 10 ? Number(timestamp) * 1000 : Number(timestamp);
  if (Math.abs(now - ms) > PROVISION_MAX_SKEW_MS) return false;
  const expected = Buffer.from(signProvision(secret, timestamp, rawBody), 'hex');
  const given = Buffer.from(signature, 'hex');
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

/** Store → boopbase uses `ts.body`; boopbase → store notify uses `notify.ts.body`, so one can't replay as the other. */
export function signNotify(secret: string, timestamp: string, rawBody: string): string {
  return crypto.createHmac('sha256', secret).update(`notify.${timestamp}.${rawBody}`).digest('hex');
}

/** Deterministic per order + salt, so a retried provision returns the same link without storing the token. */
export function claimTokenFor(secret: string, orderId: string, salt: string): string {
  return crypto.createHmac('sha256', secret).update(`claim.${orderId}.${salt}`).digest('base64url');
}

export function hashClaimToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function claimUrl(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/$/, '')}/claim/${token}`;
}

export type ProvisionBody = {
  orderId: string;
  email: string;
  name: string;
  productType: 'band' | 'card' | 'sticker';
  quantity: number;
  livemode: boolean;
  /** Per-color lines; quantity is their sum. Older callers without lines get one any-color line. */
  lines: ProvisionLine[];
};

export const CARD_COLORS = ['black', 'white'] as const;
export type CardColor = (typeof CARD_COLORS)[number] | '';
export type ProvisionLine = { color: CardColor; quantity: number; custom: boolean };

export function normalizeColor(v: unknown): CardColor | null {
  const c = String(v ?? '').toLowerCase().trim();
  if (!c) return '';
  return (CARD_COLORS as readonly string[]).includes(c) ? (c as CardColor) : null;
}

function parseLines(raw: unknown): ProvisionLine[] | null {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 20) return null;
  const out: ProvisionLine[] = [];
  for (const l of raw) {
    if (!l || typeof l !== 'object') return null;
    const r = l as Record<string, unknown>;
    const color = normalizeColor(r.color);
    const quantity = Number(r.quantity);
    if (color === null || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) return null;
    out.push({ color, quantity, custom: r.custom === true });
  }
  return out;
}

export function parseProvisionBody(raw: unknown): ProvisionBody | null {
  if (!raw || typeof raw !== 'object') return null;
  const b = raw as Record<string, unknown>;
  const orderId = String(b.orderId || '').trim();
  const email = String(b.email || '').toLowerCase().trim();
  const productType = String(b.productType || 'card');
  const quantity = Number(b.quantity ?? 1);
  if (!/^[A-Za-z0-9_-]{6,200}$/.test(orderId)) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return null;
  if (!['band', 'card', 'sticker'].includes(productType)) return null;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) return null;
  let lines: ProvisionLine[] = [{ color: '', quantity, custom: false }];
  if (b.lines !== undefined) {
    const parsed = parseLines(b.lines);
    if (!parsed || parsed.reduce((n, l) => n + l.quantity, 0) !== quantity) return null;
    lines = parsed;
  }
  return {
    orderId,
    email,
    name: String(b.name || '').trim().slice(0, 120),
    productType: productType as ProvisionBody['productType'],
    quantity,
    livemode: b.livemode === true,
    lines,
  };
}

/**
 * Tap-to-claim rule for a device that is not yet claimed (the setup link is checked separately).
 * - ready: anyone signed in (unchanged behaviour).
 * - sold: only the account whose email matches orderEmail — also after the link expires.
 *   A sold device with no orderEmail stays open like ready.
 */
export function maySignedInUserClaim(device: { status: string; orderEmail?: string }, user: { email?: string }): boolean {
  if (device.status === 'ready') return true;
  if (device.status !== 'sold') return false;
  const orderEmail = (device.orderEmail || '').toLowerCase();
  if (!orderEmail) return true;
  return (user.email || '').toLowerCase() === orderEmail;
}

const DAY = 24 * 60 * 60 * 1000;
/** Reminder schedule from soldAt (EASY, Oct 17): day 7, 18, 25 and 29 — all inside the 30-day link window. Max 4. */
export const REMINDER_DAYS = [7, 18, 25, 29] as const;

export function reminderDue(
  device: { status: string; ownerUsername?: string; soldAt?: Date | null; remindersSent?: number; orderEmail?: string },
  now = Date.now()
): boolean {
  if (device.status !== 'sold' || device.ownerUsername || !device.soldAt || !device.orderEmail) return false;
  const sent = device.remindersSent || 0;
  if (sent >= REMINDER_DAYS.length) return false;
  return now - device.soldAt.getTime() >= REMINDER_DAYS[sent] * DAY;
}

/** Self-service resend limit per card: 1 per 10 minutes, 5 per UTC day. */
export const RESEND_MIN_GAP_MS = 10 * 60 * 1000;
export const RESEND_PER_DAY = 5;
