import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Device from '@/lib/models/Device';
import { isOwner } from '@/lib/ownerAuth';
import { getSessionUsername } from '@/lib/session';

const PUBLIC_ORIGIN = 'https://www.boopbase.com';

/** Owner: record that a chip was written (and read back) with this device's tap URL. */
export async function POST(request: NextRequest) {
  try {
    if (!isOwner(getSessionUsername(request))) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const code = String(body.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const url = String(body.url || '');
    const serial = String(body.serial || '').slice(0, 64).replace(/[^0-9A-Fa-f:]/g, '');
    if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    const expected = `${PUBLIC_ORIGIN}/p/${code}`;
    if (url !== expected) return NextResponse.json({ error: `Written URL must be ${expected}` }, { status: 400 });

    await connectDB();
    const device = await Device.findOne({ code });
    if (!device) return NextResponse.json({ error: `${code} is not in the shop list` }, { status: 404 });

    device.chipWrittenAt = new Date();
    device.chipWrittenUrl = url;
    if (serial) device.chipSerial = serial;
    if (body.locked === true) device.chipLocked = true;
    if (!device.programmedUrl) device.programmedUrl = expected;
    await device.save();

    return NextResponse.json({ code: device.code, chipWrittenAt: device.chipWrittenAt, chipLocked: device.chipLocked });
  } catch (error) {
    console.error('Mark programmed error:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
