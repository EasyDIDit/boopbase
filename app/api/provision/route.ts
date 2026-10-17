import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BoopOrder from '@/lib/models/BoopOrder';
import Device from '@/lib/models/Device';
import {
  CLAIM_TTL_MS,
  claimTokenFor,
  claimUrl,
  hashClaimToken,
  parseProvisionBody,
  provisionSecret,
  verifyProvisionSignature,
} from '@/lib/provision';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Store → boopbase: "this Boop was sold". HMAC-signed (BOOPBASE_PROVISION_SECRET), idempotent on orderId.
 * Default: records the order + claim link only. Device codes are assigned when EASY packs
 * (owner assign screen marks them sold to orderEmail), so tap-to-claim keeps working.
 * PROVISION_RESERVE_STOCK=1 additionally reserves `quantity` ready devices as sold.
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
    const base = process.env.BOOPBASE_PUBLIC_URL?.trim() || request.nextUrl.origin;

    const salt = crypto.randomBytes(16).toString('hex');
    const token = claimTokenFor(secret, body.orderId, salt);
    let created = false;
    try {
      const res = await BoopOrder.updateOne(
        { orderId: body.orderId },
        {
          $setOnInsert: {
            orderId: body.orderId,
            email: body.email,
            name: body.name,
            productType: body.productType,
            quantity: body.quantity,
            livemode: body.livemode,
            tokenSalt: salt,
            tokenHash: hashClaimToken(token),
            expiresAt: new Date(Date.now() + CLAIM_TTL_MS),
          },
        },
        { upsert: true }
      );
      created = res.upsertedCount === 1;
    } catch (err) {
      if ((err as { code?: number }).code !== 11000) throw err;
    }

    const order = await BoopOrder.findOne({ orderId: body.orderId });
    if (!order) throw new Error('order missing after upsert');

    if (created && process.env.PROVISION_RESERVE_STOCK === '1') {
      const codes: string[] = [];
      for (let i = 0; i < order.quantity; i++) {
        const d = await Device.findOneAndUpdate(
          { status: 'ready', productType: order.productType, $or: [{ ownerUsername: '' }, { ownerUsername: null }] },
          { $set: { status: 'sold', orderEmail: order.email, orderId: order.orderId } },
          { new: true, sort: { createdAt: 1 } }
        );
        if (!d) break; // not enough stock: EASY assigns the rest when packing
        codes.push(d.code);
      }
      order.deviceCodes = codes;
      await order.save();
    }

    return NextResponse.json({
      ok: true,
      created,
      orderId: order.orderId,
      claimUrl: claimUrl(base, claimTokenFor(secret, order.orderId, order.tokenSalt)),
      expiresAt: order.expiresAt,
      deviceCodes: order.deviceCodes,
      claimed: !!order.claimedUsername,
    });
  } catch (error) {
    console.error('Provision error:', (error as Error).message);
    return NextResponse.json({ error: 'temporary error' }, { status: 500 });
  }
}
