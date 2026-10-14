import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { getSessionUsername } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const username = getSessionUsername(request);

    if (!username) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ username }).select('-password').lean();

    if (!user) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}