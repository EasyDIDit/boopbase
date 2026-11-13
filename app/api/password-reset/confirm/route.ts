import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { LIMITS, clientIp, hitLimit } from '@/lib/rateLimit';
import { finishPasswordReset } from '@/lib/passwordReset';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    await connectDB();
    if (await hitLimit(LIMITS.resetIp, `confirm:${clientIp(request)}`, { failOpen: false })) {
      return NextResponse.json({ error: 'Too many tries. Try again in an hour.' }, { status: 429 });
    }
    const result = await finishPasswordReset(body.token, body.password);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true, message: 'Password updated. Sign in with your new password.' });
  } catch (error) {
    console.error('Password reset confirm error:', (error as Error).message);
    return NextResponse.json({ error: 'Could not reset the password. Try again.' }, { status: 500 });
  }
}
