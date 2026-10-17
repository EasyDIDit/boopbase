import BoopOrder from '@/lib/models/BoopOrder';
import Device from '@/lib/models/Device';
import { hashClaimToken } from '@/lib/provision';
import { claimDevice, upsertCustomer, type ClaimResult } from '@/lib/claimDevice';

export function isClaimLinkExpired(expiresAt: Date, now = Date.now()): boolean {
  return expiresAt.getTime() < now;
}

export async function findOrderByToken(token: string) {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;
  return BoopOrder.findOne({ tokenHash: hashClaimToken(token) });
}

/** Redeems a setup link for the signed-in user. One account per link; repeat by the same account is fine. */
export async function redeemClaimToken(token: string, user: { username: string; email?: string }): Promise<ClaimResult> {
  const order = await findOrderByToken(token);
  if (!order) return { status: 404, body: { error: 'This setup link is not valid. Reply to your order email for a new one.' } };
  if (order.claimedUsername && order.claimedUsername !== user.username) {
    return { status: 409, body: { error: 'This setup link was already used by another account.' } };
  }
  if (!order.claimedUsername) {
    if (isClaimLinkExpired(order.expiresAt)) {
      return { status: 410, body: { error: 'This setup link expired. Reply to your order email and we will send a new one.' } };
    }
    const res = await BoopOrder.updateOne(
      { _id: order._id, claimedUsername: '' },
      { $set: { claimedUsername: user.username, claimedAt: new Date() } }
    );
    if (res.modifiedCount !== 1) return { status: 409, body: { error: 'This setup link was already used by another account.' } };
  }
  await upsertCustomer(user.email, user.username);
  // Devices already tied to this order (stock mode or assigned at packing) attach now; later ones attach on tap.
  const devices = await Device.find({ orderId: order.orderId, status: 'sold' });
  const claimed: string[] = [];
  for (const d of devices) {
    const r = await claimDevice(d.code, user, { viaClaimLink: true });
    if (r.status === 200) claimed.push(d.code);
  }
  return {
    status: 200,
    body: { message: 'Your BOOP is linked to your page', claimedCodes: claimed, quantity: order.quantity },
  };
}
