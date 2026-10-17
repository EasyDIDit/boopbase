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
};

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
  return {
    orderId,
    email,
    name: String(b.name || '').trim().slice(0, 120),
    productType: productType as ProvisionBody['productType'],
    quantity,
    livemode: b.livemode === true,
  };
}

/**
 * Tap-to-claim rule for a device that is not yet claimed.
 * - ready: anyone signed in (unchanged behaviour).
 * - sold: the account whose email matches orderEmail, or the account that redeemed this order's claim link.
 *   A sold device with no orderEmail stays open like ready.
 */
export function maySignedInUserClaim(
  device: { status: string; orderEmail?: string },
  user: { email?: string },
  redeemedOrderEmail: boolean
): boolean {
  if (device.status === 'ready') return true;
  if (device.status !== 'sold') return false;
  const orderEmail = (device.orderEmail || '').toLowerCase();
  if (!orderEmail) return true;
  if ((user.email || '').toLowerCase() === orderEmail) return true;
  return redeemedOrderEmail;
}
