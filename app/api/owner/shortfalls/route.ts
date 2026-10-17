import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BoopOrder from '@/lib/models/BoopOrder';
import { isOwner } from '@/lib/ownerAuth';
import { getSessionUsername } from '@/lib/session';
import { provisionSecret } from '@/lib/provision';
import { notifyStore, publicBase, reserveFromStock } from '@/lib/cardLinks';

function forbidden() {
  return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
}

/** Owner: orders still owed cards because stock was short at sale. */
export async function GET(request: NextRequest) {
  if (!isOwner(getSessionUsername(request))) return forbidden();
  await connectDB();
  const orders = await BoopOrder.find({ shortfall: { $gt: 0 } }).sort({ createdAt: 1 }).limit(200);
  return NextResponse.json({
    orders: orders.map((o) => ({ orderId: o.orderId, email: o.email, productType: o.productType, quantity: o.quantity, shortfall: o.shortfall, createdAt: o.createdAt, livemode: o.livemode })),
  });
}

/** Owner: fill shortfalls oldest-first from current ready stock, then email each buyer their new card links. */
export async function POST(request: NextRequest) {
  if (!isOwner(getSessionUsername(request))) return forbidden();
  const secret = provisionSecret();
  if (!secret) return NextResponse.json({ error: 'Provisioning is not configured' }, { status: 503 });
  await connectDB();
  const base = publicBase(request.nextUrl.origin);
  const orders = await BoopOrder.find({ shortfall: { $gt: 0 } }).sort({ createdAt: 1 }).limit(50);
  const filled: { orderId: string; assigned: number; stillShort: number; email: string }[] = [];
  for (const o of orders) {
    // Take the owed count atomically first so two owners clicking at once can't over-assign.
    const take = await BoopOrder.findOneAndUpdate({ _id: o._id, shortfall: o.shortfall }, { $set: { shortfall: 0 } }, { returnDocument: 'after' });
    if (!take) continue;
    const links = await reserveFromStock(secret, base, { orderId: o.orderId, email: o.email, productType: o.productType }, o.shortfall);
    const stillShort = o.shortfall - links.length;
    if (stillShort) await BoopOrder.updateOne({ _id: o._id }, { $inc: { shortfall: stillShort } });
    let email = 'none';
    if (links.length) {
      email = (await notifyStore({ kind: 'assigned', orderId: o.orderId, email: o.email, name: o.name, livemode: o.livemode, cards: links })).outcome;
    }
    filled.push({ orderId: o.orderId, assigned: links.length, stillShort, email });
    if (!links.length) break; // out of stock
  }
  return NextResponse.json({ filled });
}
