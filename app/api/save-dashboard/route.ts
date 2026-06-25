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

    // Only keep fields that exist in the schema
    const allowedFields = [
      'name', 'bio', 'profileImage', 'backgroundImage', 'backgroundColor',
      'buttonStyle', 'links', 'instagram', 'tiktok', 'youtube', 'facebook',
      'phone', 'email', 'company', 'title', 'address'
    ];

    const cleanData: any = {};
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        cleanData[key] = updateData[key];
      }
    }

    const user = await User.findOneAndUpdate(
      { username: username.toLowerCase() },
      { $set: cleanData },
      { new: true, upsert: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Saved successfully' });
  } catch (error: any) {
    console.error('Save dashboard error:', error);
    return NextResponse.json({ error: error.message || 'Save failed' }, { status: 500 });
  }
}