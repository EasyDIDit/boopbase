import Device from '@/lib/models/Device';
import { hashClaimToken } from '@/lib/provision';
import { claimDevice, type ClaimResult } from '@/lib/claimDevice';

export function isClaimLinkExpired(expiresAt: Date | null | undefined, now = Date.now()): boolean {
  return !expiresAt || expiresAt.getTime() < now;
}

function validTokenShape(token: string) {
  return /^[A-Za-z0-9_-]{20,100}$/.test(token);
}

/** The card a setup link belongs to: { device, state } where state is current | replaced. */
export async function findDeviceByToken(token: string) {
  if (!validTokenShape(token)) return null;
  const h = hashClaimToken(token);
  const current = await Device.findOne({ claimTokenHash: h });
  if (current) return { device: current, state: 'current' as const };
  const old = await Device.findOne({ prevTokenHashes: h });
  if (old) return { device: old, state: 'replaced' as const };
  return null;
}

/** Redeems one card's setup link for the signed-in user. Any account may redeem (forwarded links are allowed). */
export async function redeemClaimToken(token: string, user: { username: string; email?: string }): Promise<ClaimResult> {
  const found = await findDeviceByToken(token);
  if (!found) return { status: 404, body: { error: 'This setup link is not valid. Reply to your order email for a new one.' } };
  const { device, state } = found;
  if (device.ownerUsername === user.username) return { status: 200, body: { message: 'Already yours', code: device.code } };
  if (device.ownerUsername || device.status === 'claimed') {
    return { status: 409, body: { error: 'This card was already set up by another account.' } };
  }
  if (state === 'replaced') {
    return { status: 410, body: { error: 'A newer setup link was sent for this card. Use the newest email, or request a new link.', reason: 'replaced' } };
  }
  if (isClaimLinkExpired(device.claimExpiresAt)) {
    return { status: 410, body: { error: 'This setup link expired. Request a new one, or tap the card and sign in with your checkout email.', reason: 'expired' } };
  }
  return claimDevice(device.code, user, { viaClaimLink: true });
}
