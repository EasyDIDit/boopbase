/**
 * "Release card": unlink a claimed card from its owner and put it back in in-person ready stock, same code.
 * Kept: code, programmedUrl, chip-written info, color, scanCount, createdAt. Cleared: owner, claim, sale and link fields.
 * An audit entry (who, when, previous owner/order) is pushed to the device's history.
 */
type Prev = {
  ownerUsername?: string;
  orderEmail?: string;
  orderId?: string;
  saleType?: string;
  saleChannel?: string;
  ownerNote?: string;
  claimedAt?: Date | null;
  soldAt?: Date | null;
};

export function releaseUpdate(prev: Prev, by: string, now = new Date()) {
  return {
    $set: {
      status: 'ready',
      ownerUsername: '',
      claimedAt: null,
      onlineStock: false,
      saleChannel: 'in_person',
      saleType: '',
      ownerNote: '',
      orderEmail: '',
      orderId: '',
      soldAt: null,
      claimTokenSalt: '',
      claimTokenHash: '',
      prevTokenHashes: [],
      claimExpiresAt: null,
      remindersSent: 0,
      lastLinkSentAt: null,
      linkSendsDay: '',
      linkSendsCount: 0,
    },
    $push: {
      history: {
        $each: [
          {
            action: 'released',
            by,
            at: now,
            previousOwner: prev.ownerUsername || '',
            previousOrderEmail: prev.orderEmail || '',
            previousOrderId: prev.orderId || '',
            previousSaleType: prev.saleType || '',
            previousSaleChannel: prev.saleChannel || '',
            previousNote: prev.ownerNote || '',
            previousClaimedAt: prev.claimedAt || null,
            previousSoldAt: prev.soldAt || null,
          },
        ],
        $slice: -50,
      },
    },
  };
}
