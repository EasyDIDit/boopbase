import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { isSessionAdmin } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Only allow pez or easydidit for now (from the verified session)
    if (!isSessionAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await User.find({})
      .select('username name email links createdAt lastLogin')
      .sort({ createdAt: -1 });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}