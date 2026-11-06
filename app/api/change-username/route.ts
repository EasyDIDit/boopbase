import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Device from '@/lib/models/Device';
import Customer from '@/lib/models/Customer';
import { getSessionUsername, setSessionCookie, unauthorized } from '@/lib/session';

function cleanUsername(raw: string) {
  return String(raw || '')
    .toLowerCase()
    .trim()
    .replace(/@/g, '')
    .replace(/[^a-z0-9._-]/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const current = getSessionUsername(request);
    if (!current) return unauthorized();

    await connectDB();

    const body = await request.json().catch(() => ({}));
    const next = cleanUsername(body.username);

    if (String(body.username || '').includes('@')) {
      return NextResponse.json(
        { error: 'No @. Your link is just yourname.' },
        { status: 400 }
      );
    }

    if (!next || next.length < 3 || next.length > 30) {
      return NextResponse.json(
        { error: 'Username must be 3–30 letters or numbers.' },
        { status: 400 }
      );
    }

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
