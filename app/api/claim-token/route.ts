import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { getSessionUsername } from '@/lib/session';
import { redeemClaimToken } from '@/lib/claimOrder';

export async function POST(request: NextRequest) {
  try {
    const username = getSessionUsername(request);
    if (!username) return NextResponse.json({ error: 'Sign in to finish setup' }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const token = String(body.token || '');
    await connectDB();
    const user = await User.findOne({ username });
    if (!user) return NextResponse.json({ error: 'Account not found' }, { status: 401 });
    const result = await redeemClaimToken(token, { username, email: user.email });
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error('Claim token error:', (error as Error).message);
    return NextResponse.json({ error: 'Could not finish setup' }, { status: 500 });
  }
}
