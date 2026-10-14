import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { setSessionCookie } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json().catch(() => ({}));
    const emailOrUsername = String(body.emailOrUsername || '').toLowerCase().trim();
    const password = String(body.password || '');

    if (!emailOrUsername || !password) {
      return NextResponse.json({ error: 'Email/Username and password are required' }, { status: 400 });
    }

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
