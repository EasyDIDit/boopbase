import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { checkClaimable, claimDevice } from '@/lib/claimDevice';
import Customer from '@/lib/models/Customer';
import { setSessionCookie } from '@/lib/session';
import { checkUsername } from '@/lib/username';
import { cleanEmail, isValidEmail, passwordProblem } from '@/lib/authTokens';
import { LIMITS, clientIp, hitLimit } from '@/lib/rateLimit';
import { sendVerificationEmail } from '@/lib/emailVerification';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json().catch(() => ({}));
    const name = String(body.name || '').trim().slice(0, 100);
    const email = cleanEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';
    const code = String(body.code || '').toUpperCase().trim().slice(0, 32);

    if (!String(body.username || '').trim() || !name || !password) {
      return NextResponse.json(
        { error: 'Username, name, and password are required' },
        { status: 400 }
      );
    }

    const checked = checkUsername(body.username);
    if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
    const username = checked.username;

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }

    const weak = passwordProblem(password);
    if (weak) return NextResponse.json({ error: weak }, { status: 400 });

    if (await hitLimit(LIMITS.registerIp, clientIp(request), { failOpen: true })) {
      return NextResponse.json(
        { error: 'Too many new accounts from here. Try again in an hour.' },
        { status: 429, headers: { 'Retry-After': '3600' } }
      );
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // If a device code is present, validate before creating the account
    if (code) {
      const blocked = await checkClaimable(code, username, email);
      if (blocked) return NextResponse.json(blocked.body, { status: blocked.status });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      name,
      email,
      password: hashedPassword,
      emailVerified: false,
    });

    // Confirm-your-email link. Never blocks sign-up; no email leaves the server unless configured.
    await sendVerificationEmail(user, request.nextUrl.origin).catch(() => null);

    // Customer CDP row from registration — shop and promo share the same path
    await Customer.findOneAndUpdate(
      { email },
      { $set: { email, username, updatedAt: new Date() }, $setOnInsert: { source: 'signup' } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    let claimedCode: string | null = null;
    let claimError: string | null = null;
    if (code) {
      const result = await claimDevice(code, { username, email });
      if (result.status === 200) claimedCode = code;
      else claimError = String(result.body.error || 'Could not claim this Boop');
    }

    const response = NextResponse.json({
      message: claimedCode
        ? 'Account created and Boop claimed'
        : 'Account created successfully',
      user: { username: user.username, name: user.name, email: user.email },
      claimedCode,
      claimError,
    });

    // Session so they land in dashboard without a second login step
    setSessionCookie(request, response, user.username);

    return response;
  } catch (error: unknown) {
    console.error('Registration error:', error);

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      return NextResponse.json({ error: 'Username or email already exists' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
