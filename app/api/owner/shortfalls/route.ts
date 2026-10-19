import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BoopOrder from '@/lib/models/BoopOrder';
import Device from '@/lib/models/Device';
import { isOwner } from '@/lib/ownerAuth';
import { getSessionUsername } from '@/lib/session';
import { provisionSecret } from '@/lib/provision';
import { issueFreshLink, notifyStore, publicBase, reserveFromStock } from '@/lib/cardLinks';

function forbidden() {
  return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
}

type Line = { color?: string; quantity?: number; custom?: boolean; owed?: number };

/** Owed stock lines of an order. Orders from before per-color lines read as one any-color line. */
function stockLines(o: { lines?: Line[]; shortfall?: number }): { idx: number; color: string; owed: number }[] {
  if (!o.lines?.length) return o.shortfall ? [{ idx: -1, color: '', owed: o.shortfall }] : [];
  return o.lines.map((l, idx) => ({ idx, color: l.color || '', owed: l.owed || 0, custom: !!l.custom })).filter((l) => !l.custom && l.owed > 0);
}

const UNOWNED = { $or: [{ ownerUsername: '' }, { ownerUsername: null }, { ownerUsername: { $exists: false } }] };

/** Owner: orders still owed stock cards (per color) and logo cards still to print + program. */
export async function GET(request: NextRequest) {
  if (!isOwner(getSessionUsername(request))) return forbidden();
  await connectDB();
  const orders = await BoopOrder.find({ $or: [{ shortfall: { $gt: 0 } }, { toMake: { $gt: 0 } }] }).sort({ createdAt: 1 }).limit(200);
  return NextResponse.json({
    orders: orders.map((o) => ({
      orderId: o.orderId,
      email: o.email,
      productType: o.productType,
      quantity: o.quantity,
      shortfall: o.shortfall,
      toMake: o.toMake || 0,
      owedByColor: stockLines(o).map((l) => ({ color: l.color, owed: l.owed })),
      toMakeByColor: (o.lines || []).filter((l: Line) => l.custom && (l.owed || 0) > 0).map((l: Line) => ({ color: l.color || '', owed: l.owed })),
      createdAt: o.createdAt,
      livemode: o.livemode,
    })),
  });
}

/**
 * Owner actions.
 * - {} (default): fill stock shortfalls oldest-first from online stock of the matching color, then email links.
 * - { action: 'link', orderId, code }: link a logo card EASY just printed + programmed to that order's to-make list,
 *   then email its setup link like any other card.
 */
export async function POST(request: NextRequest) {
  if (!isOwner(getSessionUsername(request))) return forbidden();
  const secret = provisionSecret();
  if (!secret) return NextResponse.json({ error: 'Provisioning is not configured' }, { status: 503 });
  await connectDB();
  const base = publicBase(request.nextUrl.origin);
  const body = await request.json().catch(() => ({}));

  if (body?.action === 'link') {
    const orderId = String(body.orderId || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 200);
    const code = String(body.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 32);
    if (!orderId || !code) return NextResponse.json({ error: 'Order and card code are required' }, { status: 400 });
    // Take one owed logo slot atomically first, so two clicks can't over-link.
    const order = await BoopOrder.findOneAndUpdate(
      { orderId, toMake: { $gt: 0 }, lines: { $elemMatch: { custom: true, owed: { $gt: 0 } } } },
      { $inc: { toMake: -1, 'lines.$.owed': -1 } },
      { returnDocument: 'before' }
    );
    if (!order) return NextResponse.json({ error: 'Nothing left to make on that order' }, { status: 409 });
    const line = (order.lines as Line[]).find((l) => l.custom && (l.owed || 0) > 0);
    const device = await Device.findOneAndUpdate(
      { code, status: 'ready', ...UNOWNED },
      {
        $set: {
          status: 'sold', saleChannel: 'online', orderEmail: order.email, orderId: order.orderId, soldAt: new Date(), remindersSent: 0,
          ...(line?.color ? { color: line.color } : {}),
        },
      },
      { returnDocument: 'after' }
    );
    if (!device) {
      // Give the slot back.
      await BoopOrder.updateOne(
        { orderId, lines: { $elemMatch: { custom: true, color: line?.color || '' } } },
        { $inc: { toMake: 1, 'lines.$.owed': 1 } }
      );
      return NextResponse.json({ error: `Card ${code} is not a ready, unowned card. Make it on this page first.` }, { status: 409 });
    }
    const link = await issueFreshLink(secret, base, device);
    await BoopOrder.updateOne({ orderId }, { $push: { deviceCodes: device.code } });
    const email = (await notifyStore({ kind: 'assigned', orderId, email: order.email, name: order.name, livemode: order.livemode, cards: [link] })).outcome;
    return NextResponse.json({ linked: device.code, orderId, email });
  }

  const orders = await BoopOrder.find({ shortfall: { $gt: 0 } }).sort({ createdAt: 1 }).limit(50);
  const filled: { orderId: string; assigned: number; stillShort: number; email: string }[] = [];
  for (const o of orders) {
    // Take the owed count atomically first so two owners clicking at once can't over-assign.
    const take = await BoopOrder.findOneAndUpdate({ _id: o._id, shortfall: o.shortfall }, { $set: { shortfall: 0 } }, { returnDocument: 'after' });
    if (!take) continue;
    const links = [];
    let stillShort = 0;
    for (const l of stockLines(o)) {
      const got = await reserveFromStock(secret, base, { orderId: o.orderId, email: o.email, productType: o.productType }, l.owed, l.color);
      links.push(...got);
      stillShort += l.owed - got.length;
      if (l.idx >= 0) await BoopOrder.updateOne({ _id: o._id }, { $set: { [`lines.${l.idx}.owed`]: l.owed - got.length } });
    }
    if (stillShort) await BoopOrder.updateOne({ _id: o._id }, { $inc: { shortfall: stillShort } });
    let email = 'none';
    if (links.length) {
      email = (await notifyStore({ kind: 'assigned', orderId: o.orderId, email: o.email, name: o.name, livemode: o.livemode, cards: links })).outcome;
    }
    filled.push({ orderId: o.orderId, assigned: links.length, stillShort, email });
  }
  return NextResponse.json({ filled });
}
