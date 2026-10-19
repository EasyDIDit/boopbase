import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { getSessionUsername } from '@/lib/session';
import { claimDevice } from '@/lib/claimDevice';

export async function POST(request: NextRequest) {
  try {
    const username = getSessionUsername(request);
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

    const result = await claimDevice(code, { username, email: user.email });
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error('Claim device error:', error);
    return NextResponse.json({ error: 'Failed to claim device' }, { status: 500 });
  }
}
