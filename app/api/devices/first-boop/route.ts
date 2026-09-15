import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Device from '@/lib/models/Device';

const FIRST_CODE = 'PEASY1';
const FIRST_URL = `https://boopbase.com/p/${FIRST_CODE}`;

export async function POST() {
  try {
    await connectDB();

    const existing = await Device.findOne({ code: FIRST_CODE });
    if (existing) {
      return NextResponse.json({
        code: existing.code,
        status: existing.status,
        ownerUsername: existing.ownerUsername || '',
        programmedUrl: existing.programmedUrl || FIRST_URL,
        created: false,
      });
    }

    const device = await Device.create({
      code: FIRST_CODE,
      productType: 'band',
      status: 'ready',
      programmedUrl: FIRST_URL,
    });

    return NextResponse.json({
      code: device.code,
      status: device.status,
      ownerUsername: '',
      programmedUrl: device.programmedUrl,
      created: true,
    });
  } catch (error) {
    console.error('First Boop seed error:', error);
    return NextResponse.json({ error: 'Could not create first Boop' }, { status: 500 });
  }
}
