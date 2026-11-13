import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { setSessionCookie } from '@/lib/session';
import { LIMITS, clientIp, hitLimit, retryAfterSeconds } from '@/lib/rateLimit';

const tooMany = (seconds: number) =>
  NextResponse.json(
    { error: 'Too many sign-in tries. Wait a few minutes and try again, or reset your password.' },
    { status: 429, headers: { 'Retry-After': String(seconds) } }
  );

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json().catch(() => ({}));
    const emailOrUsername = String(body.emailOrUsername || '').toLowerCase().trim();
    const password = String(body.password || '');

    if (!emailOrUsername || !password) {
      return NextResponse.json({ error: 'Email/Username and password are required' }, { status: 400 });
    }
    if (emailOrUsername.length > 254 || password.length > 200) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Per IP and per account, so one person can't hammer many accounts or one account from many tries.
    if (await hitLimit(LIMITS.loginIp, clientIp(request), { failOpen: true })) return tooMany(retryAfterSeconds(LIMITS.loginIp));
    if (await hitLimit(LIMITS.loginAccount, emailOrUsername, { failOpen: true })) return tooMany(retryAfterSeconds(LIMITS.loginAccount));

    const user = await User.findOne({
      $or: [
        { username: emailOrUsername },
        { email: emailOrUsername }
      ]
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.password) {
      return NextResponse.json({ error: 'Account setup incomplete' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    user.lastLogin = new Date();
    await user.save();

    const response = NextResponse.json({
      message: 'Login successful',
      user: { username: user.username, name: user.name }
    });

    setSessionCookie(request, response, user.username);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
