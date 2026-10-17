import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Device from '@/lib/models/Device';
import BoopOrder from '@/lib/models/BoopOrder';
import { isOwner } from '@/lib/ownerAuth';
import { getSessionUsername } from '@/lib/session';

/**
 * Owner: set in-person sale type (sale / giveaway) and a free-text owner note on a card.
 * In-person cards have no email until the person claims (then it goes to Customers).
 * If the card is still ready stock, this also records it as handed out (status sold, in-person sales log row).
 * Never changes claim status, owner or order email. No emails are sent.
 */
export async function POST(request: NextRequest) {
  if (!isOwner(getSessionUsername(request))) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const code = String(body.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const saleType = ['sale', 'giveaway', ''].includes(body.saleType) ? String(body.saleType) : null;
  const ownerNote = typeof body.ownerNote === 'string' ? body.ownerNote.trim().slice(0, 300) : undefined;
  if (!code || saleType === null) return NextResponse.json({ error: 'Code and a sale type are required' }, { status: 400 });

  await connectDB();
  const device = await Device.findOne({ code });
  if (!device) return NextResponse.json({ error: `${code} is not in the shop list` }, { status: 404 });
  if (device.saleChannel === 'online' && saleType === 'giveaway') {
    return NextResponse.json({ error: 'Online orders are sales' }, { status: 400 });
  }

  device.saleType = saleType;
  if (ownerNote !== undefined) device.ownerNote = ownerNote;
  const handOut = saleType && device.status === 'ready' && !device.ownerUsername;
  if (handOut) {
    device.status = 'sold';
    device.saleChannel = 'in_person';
    device.soldAt = device.soldAt || new Date();
  }
  await device.save();

  // Keep the shared sales log in step: create the in-person row on hand-out, or update the existing one.
  if (device.orderId) {
    await BoopOrder.updateOne({ orderId: device.orderId, channel: 'in_person' }, { $set: { saleType } });
  } else if (handOut) {
    const orderId = `inperson-${device.code}-${Date.now()}`;
    await BoopOrder.create({
      orderId, channel: 'in_person', saleType, email: device.orderEmail || '',
      productType: device.productType, quantity: 1, livemode: true, deviceCodes: [device.code], shortfall: 0,
    });
    device.orderId = orderId;
    await device.save();
  }
  return NextResponse.json({ code: device.code, status: device.status, saleType: device.saleType, ownerNote: device.ownerNote });
}
