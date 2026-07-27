import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const username = request.cookies.get('user')?.value;

    if (!username) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const user = await User.findOne({ username: username.toLowerCase() }).lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}