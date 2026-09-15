import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Device from '@/lib/models/Device';

const CODE = 'PEASY2';
const URL = `https://www.boopbase.com/p/${CODE}`;

export async function GET() {
  try {
    await connectDB();

    const existing = await Device.findOne({ code: CODE });
    if (existing) {
      if (!existing.ownerUsername) {
        existing.ownerUsername = 'peasy1';
        existing.status = 'claimed';
        existing.claimedAt = existing.claimedAt || new Date();
        existing.programmedUrl = existing.programmedUrl || URL;
        await existing.save();
      }
      return NextResponse.json({
        code: existing.code,
        productType: existing.productType,
        status: existing.status,
        ownerUsername: existing.ownerUsername,
        programmedUrl: existing.programmedUrl || URL,
        created: false,
      });
    }

    const device = await Device.create({
      code: CODE,
      productType: 'card',
      status: 'claimed',
      ownerUsername: 'peasy1',
      programmedUrl: URL,
      claimedAt: new Date(),
    });

    return NextResponse.json({
      code: device.code,
      productType: device.productType,
      status: device.status,
      ownerUsername: device.ownerUsername,
      programmedUrl: device.programmedUrl,
      created: true,
    });
  } catch (error) {
    console.error('Peasy card seed error:', error);
    return NextResponse.json({ error: 'Could not create card code' }, { status: 500 });
  }
}
