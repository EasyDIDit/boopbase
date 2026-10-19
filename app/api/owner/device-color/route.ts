import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Device from '@/lib/models/Device';
import { isOwner } from '@/lib/ownerAuth';
import { getSessionUsername } from '@/lib/session';

/**
 * Owner: set the physical color of cards (Black and White are separate stock). Only unowned `ready` cards change,
 * so sold/claimed records are never rewritten.
 */
export async function POST(request: NextRequest) {
  if (!isOwner(getSessionUsername(request))) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const codes: string[] = Array.isArray(body.codes)
    ? body.codes.map((c: unknown) => String(c).toUpperCase().replace(/[^A-Z0-9]/g, '')).filter(Boolean).slice(0, 500)
    : [];
  const color = ['black', 'white', ''].includes(body.color) ? body.color : null;
  if (!codes.length || color === null) return NextResponse.json({ error: 'Pick cards and a color' }, { status: 400 });
  await connectDB();
  const res = await Device.updateMany(
    { code: { $in: codes }, status: 'ready', $or: [{ ownerUsername: '' }, { ownerUsername: null }, { ownerUsername: { $exists: false } }] },
    { $set: { color } }
  );
  return NextResponse.json({ updated: res.modifiedCount, skipped: codes.length - res.matchedCount, color });
}
