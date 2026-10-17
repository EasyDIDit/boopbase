import crypto from 'crypto';
import Device from '@/lib/models/Device';
import BoopOrder from '@/lib/models/BoopOrder';
import {
  CLAIM_TTL_MS,
  RESEND_MIN_GAP_MS,
  RESEND_PER_DAY,
  claimTokenFor,
  claimUrl,
  hashClaimToken,
  provisionSecret,
  signNotify,
} from '@/lib/provision';

type DeviceDoc = {
  _id: unknown;
  code: string;
  orderId?: string;
  orderEmail?: string;
  claimTokenSalt?: string;
  claimTokenHash?: string;
  claimExpiresAt?: Date | null;
};

export type CardLink = { code: string; claimUrl: string; expiresAt: string };

export function publicBase(fallbackOrigin?: string): string {
  return (process.env.BOOPBASE_PUBLIC_URL?.trim() || fallbackOrigin || 'https://www.boopbase.com').replace(/\/$/, '');
}

function tokenOf(secret: string, d: { orderId?: string; code: string }, salt: string) {
  return claimTokenFor(secret, `${d.orderId || ''}.${d.code}`, salt);
}

/** The card's current link (deterministic from the stored salt), for idempotent provision retries. */
export function currentLink(secret: string, base: string, d: DeviceDoc): CardLink | null {
  if (!d.claimTokenSalt || !d.claimExpiresAt) return null;
  return { code: d.code, claimUrl: claimUrl(base, tokenOf(secret, d, d.claimTokenSalt)), expiresAt: d.claimExpiresAt.toISOString() };
}

/**
 * Builds a fresh 30-day link without saving it. Call commit() only once the link was delivered,
 * so a failed email never invalidates the link the buyer already has.
 */
export function prepareFreshLink(secret: string, base: string, d: DeviceDoc, extra: Record<string, unknown> = {}) {
  const salt = crypto.randomBytes(16).toString('hex');
  const token = tokenOf(secret, d, salt);
  const expiresAt = new Date(Date.now() + CLAIM_TTL_MS);
  const link: CardLink = { code: d.code, claimUrl: claimUrl(base, token), expiresAt: expiresAt.toISOString() };
  const commit = async () => {
    const update: Record<string, unknown> = {
      $set: { claimTokenSalt: salt, claimTokenHash: hashClaimToken(token), claimExpiresAt: expiresAt, ...extra },
    };
    if (d.claimTokenHash) update.$push = { prevTokenHashes: { $each: [d.claimTokenHash], $slice: -10 } };
    await Device.updateOne({ _id: d._id }, update);
  };
  return { link, commit };
}

/** Issues and saves a fresh link immediately (used at sale, when the store sends it right after). */
export async function issueFreshLink(secret: string, base: string, d: DeviceDoc, extra: Record<string, unknown> = {}): Promise<CardLink> {
  const p = prepareFreshLink(secret, base, d, extra);
  await p.commit();
  return p.link;
}

/**
 * Reserves up to `n` ready devices of `productType` that EASY marked as online stock (never in-person stock) for an order (atomic per device) and gives each its own link.
 * Returns the links issued; the caller records any shortfall.
 */
export async function reserveFromStock(
  secret: string,
  base: string,
  order: { orderId: string; email: string; productType: string },
  n: number
): Promise<CardLink[]> {
  const links: CardLink[] = [];
  for (let i = 0; i < n; i++) {
    const d = await Device.findOneAndUpdate(
      { status: 'ready', onlineStock: true, productType: order.productType, $or: [{ ownerUsername: '' }, { ownerUsername: null }, { ownerUsername: { $exists: false } }] },
      { $set: { status: 'sold', saleChannel: 'online', orderEmail: order.email, orderId: order.orderId, soldAt: new Date(), remindersSent: 0 } },
      { returnDocument: 'after', sort: { createdAt: 1 } }
    );
    if (!d) break;
    links.push(await issueFreshLink(secret, base, d));
  }
  if (links.length) {
    await BoopOrder.updateOne({ orderId: order.orderId }, { $push: { deviceCodes: { $each: links.map((l) => l.code) } } });
  }
  return links;
}

export type NotifyKind = 'assigned' | 'reminder' | 'resend';

export type StoreEmailHealth = { resend: boolean; testInbox: boolean } | null;

/**
 * Asks the store to email setup links (the store owns Resend). Signed with the shared secret using the
 * `notify.` prefix. No-op unless STORE_NOTIFY_URL is set. Never throws.
 */
export async function notifyStore(payload: {
  kind: NotifyKind;
  orderId: string;
  email: string;
  name?: string;
  livemode: boolean;
  cards: CardLink[];
}): Promise<{ outcome: string; reason?: string }> {
  try {
    const secret = provisionSecret();
    const url = process.env.STORE_NOTIFY_URL?.trim();
    if (!secret || !url) return { outcome: 'skipped', reason: 'store notify not configured' };
    if (!/^https:\/\//.test(url) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(url)) {
      return { outcome: 'skipped', reason: 'notify url must be https' };
    }
    const raw = JSON.stringify(payload);
    const ts = String(Math.floor(Date.now() / 1000));
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Boop-Timestamp': ts, 'X-Boop-Signature': signNotify(secret, ts, raw) },
      body: raw,
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json().catch(() => ({}))) as { outcome?: string; reason?: string };
    if (!res.ok) return { outcome: 'failed', reason: `store ${res.status}` };
    return { outcome: data.outcome || 'sent', reason: data.reason };
  } catch (err) {
    return { outcome: 'failed', reason: (err as Error).name };
  }
}

/** Asks the store whether it can actually send email (signed). null = store unreachable / not configured. */
export async function storeEmailHealth(): Promise<StoreEmailHealth> {
  try {
    const secret = provisionSecret();
    const url = process.env.STORE_NOTIFY_URL?.trim();
    if (!secret || !url) return null;
    const raw = JSON.stringify({ kind: 'health' });
    const ts = String(Math.floor(Date.now() / 1000));
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Boop-Timestamp': ts, 'X-Boop-Signature': signNotify(secret, ts, raw) },
      body: raw,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const d = (await res.json().catch(() => ({}))) as { resend?: boolean; testInbox?: boolean };
    return { resend: d.resend === true, testInbox: d.testInbox === true };
  } catch {
    return null;
  }
}

/** True when an email for this order can really be delivered. */
export function canDeliver(health: StoreEmailHealth, livemode: boolean): boolean {
  return !!health && health.resend && (livemode || health.testInbox);
}

function utcDay(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

/**
 * Self-service "email me a new setup link". Only for sold, unclaimed cards with an order email; only to that email.
 * Rate limited per card (atomic). Callers must return the same generic response whatever happens.
 */
export async function selfServiceResend(deviceFilter: Record<string, unknown>, base: string): Promise<string> {
  const secret = provisionSecret();
  if (!secret) return 'not-configured';
  const now = new Date();
  const day = utcDay(now);
  const d = await Device.findOneAndUpdate(
    {
      ...deviceFilter,
      status: 'sold',
      orderEmail: { $nin: ['', null] },
      $and: [
        { $or: [{ ownerUsername: '' }, { ownerUsername: null }, { ownerUsername: { $exists: false } }] },
        { $or: [{ lastLinkSentAt: null }, { lastLinkSentAt: { $lt: new Date(now.getTime() - RESEND_MIN_GAP_MS) } }] },
        { $or: [{ linkSendsDay: { $ne: day } }, { linkSendsCount: { $lt: RESEND_PER_DAY } }] },
      ],
    },
    [
      {
        $set: {
          lastLinkSentAt: now,
          linkSendsCount: { $cond: [{ $eq: ['$linkSendsDay', day] }, { $add: ['$linkSendsCount', 1] }, 1] },
          linkSendsDay: day,
        },
      },
    ],
    { returnDocument: 'after', updatePipeline: true }
  );
  if (!d) return 'not-eligible-or-limited';
  const order = d.orderId ? await BoopOrder.findOne({ orderId: d.orderId }) : null;
  const fresh = prepareFreshLink(secret, base, d);
  const r = await notifyStore({
    kind: 'resend',
    orderId: d.orderId || '',
    email: d.orderEmail,
    name: order?.name || '',
    livemode: !!order?.livemode,
    cards: [fresh.link],
  });
  if (r.outcome === 'sent') await fresh.commit(); // old link keeps working unless the new one was delivered
  return `resend-${r.outcome}`;
}
