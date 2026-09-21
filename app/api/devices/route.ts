import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Device from '@/lib/models/Device';
import { isOwner } from '@/lib/ownerAuth';

/** Live host — apex boopbase.com can 402 when that deployment is paused */
const PUBLIC_ORIGIN = 'https://www.boopbase.com';

function makeCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

function cleanCustomCode(raw: string) {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export async function GET(request: NextRequest) {
  try {
    const username = request.cookies.get('user')?.value;
    if (!isOwner(username)) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }

    await connectDB();
    const devices = await Device.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ devices });
  } catch (error) {
    console.error('List devices error:', error);
    return NextResponse.json({ error: 'Failed to list devices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const username = request.cookies.get('user')?.value;
    if (!isOwner(username)) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const productType = ['band', 'card', 'sticker'].includes(body.productType)
      ? body.productType
      : 'card';
    const orderEmail = (body.orderEmail || '').toLowerCase().trim();
    const ownerUsername = (body.ownerUsername || '').toLowerCase().trim();
    const requested = cleanCustomCode(String(body.code || ''));

    await connectDB();

    let code = requested;
    if (code) {
      if (code.length < 4 || code.length > 12) {
        return NextResponse.json(
          { error: 'Custom code must be 4 to 12 letters or numbers' },
          { status: 400 }
        );
      }
      const exists = await Device.findOne({ code });
      if (exists) {
        return NextResponse.json({ error: `${code} is already used` }, { status: 409 });
      }
    } else {
      code = makeCode();
      for (let attempt = 0; attempt < 8; attempt++) {
        const exists = await Device.findOne({ code });
        if (!exists) break;
        code = makeCode();
      }
    }

    const programmedUrl = `${PUBLIC_ORIGIN}/p/${code}`;

    const device = await Device.create({
      code,
      productType,
      status: ownerUsername ? 'claimed' : 'ready',
      orderEmail,
      ownerUsername,
      programmedUrl,
      claimedAt: ownerUsername ? new Date() : null,
    });

    return NextResponse.json({
      code: device.code,
      productType: device.productType,
      status: device.status,
      programmedUrl: device.programmedUrl,
      orderEmail: device.orderEmail,
      ownerUsername: device.ownerUsername,
    });
  } catch (error) {
    console.error('Create device error:', error);
    return NextResponse.json({ error: 'Failed to create device' }, { status: 500 });
  }
}
