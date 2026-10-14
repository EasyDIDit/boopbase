import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { getSessionUsername, unauthorized } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const username = getSessionUsername(request);
    if (!username) return unauthorized();
    await connectDB();

    const { title, url } = await request.json();

    if (!title || !url) {
      return NextResponse.json(
        { error: 'Title and url are required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ username });

    if (!user) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
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