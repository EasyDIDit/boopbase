import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Device from '@/lib/models/Device';
import Customer from '@/lib/models/Customer';
import { getSessionUsername, setSessionCookie, unauthorized } from '@/lib/session';
import { checkUsername, cleanUsername } from '@/lib/username';

export async function POST(request: NextRequest) {
  try {
    const current = getSessionUsername(request);
    if (!current) return unauthorized();

    await connectDB();

    const body = await request.json().catch(() => ({}));
    // Keeping the same name is always fine (even names now reserved, e.g. the admin accounts).
    if (!String(body.username || '').includes('@') && cleanUsername(body.username) === current) {
      return NextResponse.json({ success: true, username: current });
    }
    const checked = checkUsername(body.username);
    if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
    const next = checked.username;

    if (next === current) {
      return NextResponse.json({ success: true, username: next });
    }

    const taken = await User.findOne({ username: next });
    if (taken) {
      return NextResponse.json({ error: 'That username is taken.' }, { status: 400 });
    }

    const user = await User.findOne({ username: current });
    if (!user) return unauthorized();

    user.username = next;
    await user.save();

    await Device.updateMany({ ownerUsername: current }, { $set: { ownerUsername: next } });
    await Customer.updateMany({ username: current }, { $set: { username: next } });

    const response = NextResponse.json({
      success: true,
      username: next,
      message: 'Username updated. Your card still works.',
    });
    setSessionCookie(request, response, next);
    return response;
  } catch (error) {
    console.error('change-username error:', error);
    return NextResponse.json({ error: 'Could not change username' }, { status: 500 });
  }
}
