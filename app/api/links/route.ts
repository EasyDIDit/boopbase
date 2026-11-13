import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { getSessionUsername, unauthorized } from '@/lib/session';
import { normalizeLinkUrl } from '@/lib/safeUrl';

export async function POST(request: NextRequest) {
  try {
    const username = getSessionUsername(request);
    if (!username) return unauthorized();
    await connectDB();

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 75) : '';
    // Only http(s) links (no javascript:/data:).
    const url = normalizeLinkUrl(body.url);

    if (!title || !url) {
      return NextResponse.json(
        { error: 'Title and an http(s) link are required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ username });

    if (!user) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const newLink = {
      id: String(Date.now()),
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