import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Device from '@/lib/models/Device';
import User from '@/lib/models/User';
import Customer from '@/lib/models/Customer';

export async function POST(request: NextRequest) {
  try {
    const username = request.cookies.get('user')?.value?.toLowerCase();
    if (!username) {
      return NextResponse.json({ error: 'Sign in to claim this Boop' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const code = String(body.code || '').toUpperCase().trim();
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json({ error: 'Account not found' }, { status: 401 });
    }

    const device = await Device.findOne({ code });
    if (!device) {
      return NextResponse.json({ error: 'That code is not in our shop' }, { status: 404 });
    }

    if (device.status === 'disabled') {
      return NextResponse.json({ error: 'This Boop is retired' }, { status: 400 });
    }

    if (device.status === 'claimed' && device.ownerUsername === username) {
      // Still ensure Customer row exists for owner client list
      if (user.email) {
        await Customer.findOneAndUpdate(
          { email: user.email.toLowerCase() },
          {
            email: user.email.toLowerCase(),
            username,
            updatedAt: new Date(),
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
      return NextResponse.json({
        message: 'Already yours',
        code: device.code,
        username,
      });
    }

    if (device.status === 'claimed' && device.ownerUsername !== username) {
      return NextResponse.json({ error: 'This Boop is already claimed' }, { status: 409 });
    }

    device.status = 'claimed';
    device.ownerUsername = username;
    device.claimedAt = new Date();
    if (user.email) {
      device.orderEmail = user.email.toLowerCase();
    }
    await device.save();

    // Pull customer into CDP from account login data — no manual owner entry required
    if (user.email) {
      await Customer.findOneAndUpdate(
        { email: user.email.toLowerCase() },
        {
          email: user.email.toLowerCase(),
          username,
          updatedAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    return NextResponse.json({
      message: 'This Boop is now yours',
      code: device.code,
      productType: device.productType,
      username,
    });
  } catch (error) {
    console.error('Claim device error:', error);
    return NextResponse.json({ error: 'Failed to claim device' }, { status: 500 });
  }
}
