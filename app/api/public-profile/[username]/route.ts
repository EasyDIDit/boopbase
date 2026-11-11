import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { getSessionUsername } from '@/lib/session';
import { profileForViewer } from '@/lib/publicProfile';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    await connectDB();

    const { username } = await params;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const user = await User.findOne({ username: username.toLowerCase() })
      .select('-password')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Strangers get the display allowlist; the owner and Boop admins get the full record.
    const body = profileForViewer(user as Record<string, unknown>, getSessionUsername(request));
    return NextResponse.json(body, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Public profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
