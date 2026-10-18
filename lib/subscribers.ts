import Subscriber from '@/lib/models/Subscriber';
import Customer from '@/lib/models/Customer';
import Device from '@/lib/models/Device';

export const CUSTOMER_SOURCES = ['online_order', 'claim', 'in_person_sale'];
export type CustomerVia = 'purchase' | 'claim' | 'in_person';

/** Bought or claimed: a Customer row from a sale/claim, a claimed profile, or a card sold to this email. */
export async function emailIsCustomer(email: string): Promise<boolean> {
  const e = email.toLowerCase().trim();
  const [c, d] = await Promise.all([
    Customer.exists({ email: e, $or: [{ username: { $nin: ['', null] } }, { source: { $in: CUSTOMER_SOURCES } }] }),
    Device.exists({ orderEmail: e }),
  ]);
  return Boolean(c || d);
}

/**
 * Put a buyer/claimer on the mailing list as a customer. Never grants marketing consent (consentAt stays as it was,
 * null for new rows) and never fails the caller.
 */
export async function markSubscriberCustomer(email: string, via: CustomerVia, name = ''): Promise<void> {
  const e = email.toLowerCase().trim();
  if (!e || !e.includes('@')) return;
  try {
    const now = new Date();
    await Subscriber.updateOne(
      { email: e },
      {
        $set: { isCustomer: true },
        $setOnInsert: { email: e, name: name.slice(0, 80), consentAt: null, customerSince: now },
        $addToSet: { sources: via },
      },
      { upsert: true }
    );
    // Older sign-ups that became customers keep their sign-up date but get customerSince.
    await Subscriber.updateOne({ email: e, customerSince: null }, { $set: { customerSince: now } });
  } catch (err) {
    console.error('mailing list customer flag failed', (err as Error).message);
  }
}
