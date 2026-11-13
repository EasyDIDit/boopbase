import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { cleanEmail, isValidEmail } from '@/lib/authTokens';
import { LIMITS, clientIp, hitLimit } from '@/lib/rateLimit';
import { RESET_GENERIC, startPasswordReset } from '@/lib/passwordReset';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** "Forgot password": always the same answer, rate limited per IP and per email. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = cleanEmail((body as Record<string, unknown>)?.email);
  if (!isValidEmail(email)) return NextResponse.json({ error: 'Enter the email you use to sign in.' }, { status: 400 });
  try {
    await connectDB();
    if (await hitLimit(LIMITS.resetIp, clientIp(request), { failOpen: false })) {
      return NextResponse.json({ error: 'Too many reset requests. Try again in an hour.' }, { status: 429 });
    }
    // Over the per-email limit: quietly do nothing (same answer, no extra emails).
    if (!(await hitLimit(LIMITS.resetEmail, email, { failOpen: false }))) {
      await startPasswordReset(email, request.nextUrl.origin);
    }
  } catch (error) {
    console.error('Password reset request error:', (error as Error).message);
  }
  return NextResponse.json(RESET_GENERIC);
}
