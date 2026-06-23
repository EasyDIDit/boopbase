import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const data = await request.json();
    const { username, ...updateData } = data;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const user = await User.findOneAndUpdate(
      { username: username.toLowerCase() },
      { $set: updateData },
      { new: true, upsert: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'Failed to save user data' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Data saved successfully', 
      user 
    });
  } catch (error) {
    console.error('Save dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}