import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { getSessionUsername, unauthorized } from '@/lib/session';
import { LIMITS, clientIp, hitLimit } from '@/lib/rateLimit';
import { sendVerificationEmail } from '@/lib/emailVerification';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Signed-in owner: email a new confirm link to their login email. */
export async function POST(request: NextRequest) {
  const username = getSessionUsername(request);
  if (!username) return unauthorized();
  try {
    await connectDB();
    if (await hitLimit(LIMITS.verifyIp, `${username}:${clientIp(request)}`, { failOpen: false })) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }
    const user = await User.findOne({ username }).select('_id email emailVerified');
    if (!user) return unauthorized();
    if (user.emailVerified === true) return NextResponse.json({ ok: true, alreadyVerified: true });
    await sendVerificationEmail(user, request.nextUrl.origin);
    return NextResponse.json({ ok: true, message: 'We sent a new confirm link to your login email.' });
  } catch (error) {
    console.error('Verify resend error:', (error as Error).message);
    return NextResponse.json({ error: 'Could not send the link. Try again.' }, { status: 500 });
  }
}
