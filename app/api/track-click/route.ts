import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { username, linkId } = await request.json();

    if (!username || !linkId) {
      return NextResponse.json({ error: 'username and linkId are required' }, { status: 400 });
    }

    const updatedUser = await User.findOneAndUpdate(
      { 
        username: username.toLowerCase(),
        "links.id": linkId 
      },
      { 
        $inc: { "links.$.clicks": 1 } 
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User or link not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track click error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}