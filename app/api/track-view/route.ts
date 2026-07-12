import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Increment views by 1
    const updatedUser = await User.findOneAndUpdate(
      { username: username.toLowerCase() },
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, views: updatedUser.views });
  } catch (error) {
    console.error('Track view error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}