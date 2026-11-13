import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { dayKey } from '@/lib/daily';
import { cleanLinkId, cleanStatUsername, shouldCount } from '@/lib/analyticsGuard';

/** Link tap counter. Inputs are plain strings only; repeats within a minute are not counted. */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const username = cleanStatUsername(body?.username);
    const linkId = cleanLinkId(body?.linkId);
    if (!username || !linkId) {
      return NextResponse.json({ error: 'username and linkId are required' }, { status: 400 });
    }

    await connectDB();
    if (!(await shouldCount(request, 'tap', username, linkId))) return NextResponse.json({ success: true });

    await User.updateOne(
      { username, 'links.id': linkId },
      { $inc: { 'links.$.clicks': 1, [`daily.${dayKey()}.t`]: 1 } }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track click error:', (error as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
