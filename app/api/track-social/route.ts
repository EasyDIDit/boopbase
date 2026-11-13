import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { dayKey } from '@/lib/daily';
import { cleanStatUsername, shouldCount } from '@/lib/analyticsGuard';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const username = cleanStatUsername(body?.username);
    if (!username) return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    await connectDB();
    if (!(await shouldCount(request, 'social', username))) return NextResponse.json({ success: true });
    await User.updateOne({ username }, { $inc: { socialTaps: 1, [`daily.${dayKey()}.s`]: 1 } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
