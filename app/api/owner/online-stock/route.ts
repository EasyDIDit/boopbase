import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Device from '@/lib/models/Device';
import { isOwner } from '@/lib/ownerAuth';
import { getSessionUsername } from '@/lib/session';

/**
 * Owner: move ready cards into (or out of) online stock. Only unowned `ready` cards change;
 * sold/claimed/in-person records are never touched.
 */
export async function POST(request: NextRequest) {
  if (!isOwner(getSessionUsername(request))) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const codes: string[] = Array.isArray(body.codes)
    ? body.codes.map((c: unknown) => String(c).toUpperCase().replace(/[^A-Z0-9]/g, '')).filter(Boolean).slice(0, 500)
    : [];
  const online = body.online === true;
  if (!codes.length) return NextResponse.json({ error: 'Pick at least one card' }, { status: 400 });
  await connectDB();
  const res = await Device.updateMany(
    { code: { $in: codes }, status: 'ready', $or: [{ ownerUsername: '' }, { ownerUsername: null }, { ownerUsername: { $exists: false } }] },
    { $set: { onlineStock: online } }
  );
  return NextResponse.json({ updated: res.modifiedCount, skipped: codes.length - res.matchedCount, online });
}
