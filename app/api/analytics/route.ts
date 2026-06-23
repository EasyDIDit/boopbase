import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '../../../lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { username } = await request.json();

    const user = await User.findOneAndUpdate(
      { username: username.toLowerCase() },
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ views: user.views });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update views' }, { status: 500 });
  }
}