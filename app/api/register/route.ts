import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Device from '@/lib/models/Device';
import Customer from '@/lib/models/Customer';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json().catch(() => ({}));
    const username = String(body.username || '').toLowerCase().trim();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').toLowerCase().trim();
    const password = String(body.password || '');
    const code = String(body.code || '').toUpperCase().trim();

    if (!username || !name || !password) {
      return NextResponse.json(
        { error: 'Username, name, and password are required' },
        { status: 400 }
      );
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // If a device code is present, validate before creating the account
    let device = null;
    if (code) {
      device = await Device.findOne({ code });
      if (!device) {
        return NextResponse.json({ error: 'That code is not in our shop' }, { status: 404 });
      }
      if (device.status === 'disabled') {
        return NextResponse.json({ error: 'This Boop is retired' }, { status: 400 });
      }
      if (device.status === 'claimed' && device.ownerUsername && device.ownerUsername !== username) {
        return NextResponse.json({ error: 'This Boop is already claimed' }, { status: 409 });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      name,
      email,
      password: hashedPassword,
    });

    // Customer CDP row from registration — shop and promo share the same path
    await Customer.findOneAndUpdate(
      { email },
      {
        email,
        username,
        updatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    let claimedCode: string | null = null;
    if (device) {
      device.status = 'claimed';
      device.ownerUsername = username;
      device.orderEmail = email;
      device.claimedAt = new Date();
      await device.save();
      claimedCode = device.code;
    }

    const response = NextResponse.json({
      message: claimedCode
        ? 'Account created and Boop claimed'
        : 'Account created successfully',
      user: { username: user.username, name: user.name, email: user.email },
      claimedCode,
    });

    // Session so they land in dashboard without a second login step
    response.cookies.set('user', user.username, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    console.error('Registration error:', error);

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      return NextResponse.json({ error: 'Username or email already exists' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
