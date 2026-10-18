import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/lib/models/Customer';
import Device from '@/lib/models/Device';
import BoopOrder from '@/lib/models/BoopOrder';
import { isOwner } from '@/lib/ownerAuth';
import { getSessionUsername } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const shopUser = getSessionUsername(request);
    if (!isOwner(shopUser)) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').toLowerCase().trim();
    const profileUsername = String(body.username || '').toLowerCase().trim();
    const code = String(body.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Purchase email is required' }, { status: 400 });
    }
    if (!code) {
      return NextResponse.json({ error: 'Device code is required' }, { status: 400 });
    }

    await connectDB();

    const device = await Device.findOne({ code });
    if (!device) {
      return NextResponse.json(
        { error: `${code} is not in the shop list. Mint it first.` },
        { status: 404 }
      );
    }

    if (device.status === 'disabled') {
      return NextResponse.json({ error: `${code} is retired` }, { status: 400 });
    }

    const takenByOther =
      device.status === 'claimed' &&
      device.ownerUsername &&
      profileUsername &&
      device.ownerUsername !== profileUsername;

    if (takenByOther) {
      return NextResponse.json(
        { error: `${code} is already on @${device.ownerUsername}` },
        { status: 409 }
      );
    }

    // A card leaving stock here (ready → sold/claimed) is an in-person sale: log it in the shared sales log.
    const isNewSale = device.status === 'ready' && !device.ownerUsername;
    device.orderEmail = email;
    if (isNewSale) device.saleChannel = 'in_person';
    if (profileUsername) {
      device.ownerUsername = profileUsername;
      device.status = 'claimed';
      device.claimedAt = device.claimedAt || new Date();
    } else if (device.status === 'ready') {
      device.status = 'sold';
    }
    await device.save();

    if (isNewSale) {
      const orderId = `inperson-${device.code}-${Date.now()}`;
      await BoopOrder.create({
        orderId,
        channel: 'in_person',
        saleType: device.saleType || '',
        email,
        productType: device.productType,
        quantity: 1,
        livemode: true,
        deviceCodes: [device.code],
        shortfall: 0,
      });
      if (!device.orderId) {
        device.orderId = orderId;
        device.soldAt = device.soldAt || new Date();
        await device.save();
      }
    }

    const customer = await Customer.findOneAndUpdate(
      { email },
      {
        $set: { email, ...(profileUsername ? { username: profileUsername } : {}), status: 'customer', updatedAt: new Date() },
        $setOnInsert: { source: 'in_person_sale' },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (profileUsername && !customer.username) {
      customer.username = profileUsername;
      customer.updatedAt = new Date();
      await customer.save();
    }

    return NextResponse.json({
      message: `${code} linked to ${email}${profileUsername ? ` / @${profileUsername}` : ''}`,
      code: device.code,
      productType: device.productType,
      status: device.status,
      email: customer.email,
      username: customer.username || '',
    });
  } catch (error) {
    console.error('Assign client error:', error);
    return NextResponse.json({ error: 'Failed to assign code' }, { status: 500 });
  }
}
