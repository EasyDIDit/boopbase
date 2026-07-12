import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { username, title, url } = await request.json();

    if (!username || !title || !url) {
      return NextResponse.json(
        { error: 'Username, title, and url are required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const newLink = {
      id: Date.now(),
      title,
      url,
      isActive: true,
      clicks: 0,
    };

    // Fix: Ensure links array exists before pushing
    if (!user.links) {
      user.links = [];
    }

    user.links.push(newLink);
    await user.save();

    return NextResponse.json({ 
      message: 'Link added successfully', 
      link: newLink 
    });

  } catch (error) {
    console.error('Add link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}