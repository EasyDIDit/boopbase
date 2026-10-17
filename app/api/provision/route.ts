import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BoopOrder from '@/lib/models/BoopOrder';
import Device from '@/lib/models/Device';
import Customer from '@/lib/models/Customer';
import { parseProvisionBody, provisionSecret, verifyProvisionSignature } from '@/lib/provision';
import { currentLink, publicBase, reserveFromStock, type CardLink } from '@/lib/cardLinks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Store → boopbase: "this Boop sold". HMAC-signed (BOOPBASE_PROVISION_SECRET), idempotent on orderId.
 * Reserves `quantity` pre-programmed ready devices marked onlineStock (in-person stock is never touched) as sold to the checkout email, each with its own 30-day
 * setup link. Short stock never fails the sale: the gap is recorded as `shortfall` and shown on the owner screen.
 */
export async function POST(request: NextRequest) {
  const secret = provisionSecret();
  if (!secret) return NextResponse.json({ error: 'provisioning not configured' }, { status: 503 });

  const raw = await request.text();
  if (raw.length > 10_000) return NextResponse.json({ error: 'too large' }, { status: 413 });
  if (!verifyProvisionSignature(secret, raw, request.headers.get('x-boop-timestamp'), request.headers.get('x-boop-signature'))) {
    return NextResponse.json({ error: 'bad signature' }, { status: 401 });
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }
  const body = parseProvisionBody(parsed);
  if (!body) return NextResponse.json({ error: 'invalid body' }, { status: 400 });

  try {
    await connectDB();
    const base = publicBase(request.nextUrl.origin);

    let created = false;
    try {
      const res = await BoopOrder.updateOne(
        { orderId: body.orderId },
        {
          $setOnInsert: {
            orderId: body.orderId,
            channel: 'online',
            email: body.email,
            name: body.name,
            productType: body.productType,
            quantity: body.quantity,
            livemode: body.livemode,
            shortfall: body.quantity,
          },
        },
        { upsert: true }
      );
      created = res.upsertedCount === 1;
    } catch (err) {
      if ((err as { code?: number }).code !== 11000) throw err;
    }

    if (created) {
      // Buyer shows up in the existing /owner/clients list right away (username fills in when they claim).
      await Customer.updateOne(
        { email: body.email },
        { $setOnInsert: { email: body.email, source: 'online_order', createdAt: new Date() }, $set: { updatedAt: new Date() } },
        { upsert: true }
      );
      const links = await reserveFromStock(secret, base, body, body.quantity);
      await BoopOrder.updateOne({ orderId: body.orderId }, { $set: { shortfall: body.quantity - links.length } });
      if (links.length < body.quantity) {
        console.warn(JSON.stringify({ msg: 'provision.stock_shortfall', orderId: body.orderId, quantity: body.quantity, reserved: links.length }));
      }
    }

    const order = await BoopOrder.findOne({ orderId: body.orderId });
    if (!order) throw new Error('order missing after upsert');
    const devices = await Device.find({ orderId: order.orderId }).sort({ soldAt: 1 });
    const cards = devices
      .filter((d) => d.status === 'sold' && !d.ownerUsername && d.claimExpiresAt && d.claimExpiresAt.getTime() > Date.now())
      .map((d) => currentLink(secret, base, d))
      .filter((l): l is CardLink => !!l);

    return NextResponse.json({
      ok: true,
      created,
      orderId: order.orderId,
      quantity: order.quantity,
      cards, // one { code, claimUrl, expiresAt } per unclaimed card with a live link
      claimedCodes: devices.filter((d) => d.ownerUsername).map((d) => d.code),
      shortfall: order.shortfall,
    });
  } catch (error) {
    console.error('Provision error:', (error as Error).message);
    return NextResponse.json({ error: 'temporary error' }, { status: 500 });
  }
}
