import Device from '@/lib/models/Device';
import Customer from '@/lib/models/Customer';
import { markSubscriberCustomer } from '@/lib/subscribers';
import { maySignedInUserClaim } from '@/lib/provision';

export type ClaimResult = { status: number; body: Record<string, unknown> };

export const SOLD_TO_OTHER_MESSAGE =
  'This Boop was bought with a different email. Sign in with the email you used at checkout, or open the setup link from your BOOP email.';

export async function upsertCustomer(email: string | undefined, username: string) {
  if (!email) return;
  await Customer.findOneAndUpdate(
    { email: email.toLowerCase() },
    // Never touches marketingOptOut; source only set when the row is new.
    { $set: { email: email.toLowerCase(), username, updatedAt: new Date() }, $setOnInsert: { source: 'claim' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  await markSubscriberCustomer(email, 'claim');
}

/** Pre-check without writing (used by /register before creating the account). */
export async function checkClaimable(code: string, username: string, email: string): Promise<ClaimResult | null> {
  const device = await Device.findOne({ code });
  if (!device) return { status: 404, body: { error: 'That code is not in our shop' } };
  if (device.status === 'disabled') return { status: 400, body: { error: 'This Boop is retired' } };
  if (device.ownerUsername && device.ownerUsername !== username) {
    return { status: 409, body: { error: 'This Boop is already claimed' } };
  }
  if (!device.ownerUsername && !maySignedInUserClaim(device, { email })) {
    return { status: 403, body: { error: SOLD_TO_OTHER_MESSAGE, reason: 'sold_to_other' } };
  }
  return null;
}

/**
 * Tap-to-claim. Atomic: only one account can move a device from ready/sold to claimed.
 * `viaClaimLink` lets the claim-link flow attach sold devices regardless of email.
 */
export async function claimDevice(
  code: string,
  user: { username: string; email?: string },
  opts: { viaClaimLink?: boolean } = {}
): Promise<ClaimResult> {
  const { username } = user;
  const device = await Device.findOne({ code });
  if (!device) return { status: 404, body: { error: 'That code is not in our shop' } };
  if (device.status === 'disabled') return { status: 400, body: { error: 'This Boop is retired' } };

  if (device.ownerUsername === username) {
    if (device.status !== 'claimed') {
      await Device.updateOne({ _id: device._id }, { status: 'claimed', claimedAt: device.claimedAt || new Date() });
    }
    await upsertCustomer(user.email, username);
    return { status: 200, body: { message: 'Already yours', code: device.code, username } };
  }
  if (device.status === 'claimed' || device.ownerUsername) {
    return { status: 409, body: { error: 'This Boop is already claimed' } };
  }

  const allowed = opts.viaClaimLink || maySignedInUserClaim(device, user);
  if (!allowed) return { status: 403, body: { error: SOLD_TO_OTHER_MESSAGE, reason: 'sold_to_other' } };

  const set: Record<string, unknown> = { status: 'claimed', ownerUsername: username, claimedAt: new Date() };
  if (!device.orderEmail && user.email) set.orderEmail = user.email.toLowerCase();
  const updated = await Device.findOneAndUpdate(
    { _id: device._id, status: device.status, $or: [{ ownerUsername: '' }, { ownerUsername: null }, { ownerUsername: { $exists: false } }] },
    { $set: set },
    { returnDocument: 'after' }
  );
  if (!updated) return { status: 409, body: { error: 'This Boop is already claimed' } };

  await upsertCustomer(user.email, username);
  return {
    status: 200,
    body: { message: 'This Boop is now yours', code: updated.code, productType: updated.productType, username },
  };
}
