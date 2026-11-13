import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { dayKey } from '@/lib/daily';
import { cleanStatUsername, shouldCount } from '@/lib/analyticsGuard';

/** Profile view counter. Bots, the owner, and repeat visits (30 min) are not counted. Response never reveals totals. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const username = cleanStatUsername((body as Record<string, unknown>)?.username);
    if (!username) return NextResponse.json({ error: 'Username is required' }, { status: 400 });

    await connectDB();
    if (!(await shouldCount(request, 'view', username))) return NextResponse.json({ success: true });

    await User.updateOne({ username }, { $inc: { views: 1, [`daily.${dayKey()}.v`]: 1 } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track view error:', (error as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
