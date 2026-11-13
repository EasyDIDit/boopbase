import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { dayKey } from '@/lib/daily';
import { buildPublicVCard } from '@/lib/publicProfile';
import { cleanStatUsername, shouldCount } from '@/lib/analyticsGuard';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    await connectDB();

    const { username: rawUsername } = await params;
    const username = cleanStatUsername(rawUsername);
    if (!username) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const user = await User.findOne({ username }).select('username name phone company title address contactEmail');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Contact-save counter: bots, the owner and repeats (30 min) are not counted.
    if (await shouldCount(request, 'save', username)) {
      await User.updateOne({ username }, { $inc: { contactSaves: 1, [`daily.${dayKey()}.c`]: 1 } });
    }

    // Owner-entered contact fields only. Never the login email.
    const vcard = buildPublicVCard(user.toObject());

    return new NextResponse(vcard, {
      status: 200,
      headers: {
        'Content-Type': 'text/vcard',
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="${String(user.username).replace(/[^a-z0-9._-]/g, '')}.vcf"`
      }
    });
  } catch (error) {
    console.error('vCard error:', error);
    return NextResponse.json({ error: 'Failed to generate vCard' }, { status: 500 });
  }
}