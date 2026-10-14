import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { getSessionUsername, unauthorized } from '@/lib/session';

const ALLOWED_FIELDS = [
  'name',
  'bio',
  'backgroundImage',
  'profileImage',
  'outerBackgroundColor',
  'innerBackgroundColor',
  'useThemeBackground',
  'themeOverridesHero',
  'themeId',
  'links',
  'socials',
  'instagram',
  'tiktok',
  'youtube',
  'facebook',
  'phone',
  'email',
  'company',
  'title',
  'address',
  'buttonStyle',
  'backgroundColor',
] as const;

export async function POST(request: NextRequest) {
  try {
    // Only the signed-in user can save; any username in the body is ignored.
    const username = getSessionUsername(request);
    if (!username) return unauthorized();

    await connectDB();

    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(body, key) && body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }

    // Keep legacy flat fields in sync when socials[] is saved (backward compatible reads)
    if (Array.isArray(body.socials)) {
      const by = (id: string) =>
        body.socials.find((s: { platform?: string; url?: string }) => s?.platform === id)?.url || '';
      updateData.instagram = by('instagram');
      updateData.tiktok = by('tiktok');
      updateData.youtube = by('youtube');
      updateData.facebook = by('facebook');
    }

    const user = await User.findOneAndUpdate(
      { username },
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, username: user.username });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json({ error: 'Failed to save changes' }, { status: 500 });
  }
}
