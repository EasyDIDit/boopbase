import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Device from '@/lib/models/Device';
import { isOwner } from '@/lib/ownerAuth';
import { getSessionUsername } from '@/lib/session';
import { releaseUpdate } from '@/lib/releaseCard';

/**
 * Owner: release a claimed card (e.g. taken back, never paid). Same code; the card goes back to in-person ready stock.
 * The person's account, profile and customer row are NOT touched; the card just stops opening their profile.
 * Atomic: only releases if the card is still owned by `expectOwner` (what the owner saw on screen).
 */
export async function POST(request: NextRequest) {
  const by = getSessionUsername(request);
  if (!isOwner(by)) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const code = String(body.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 32);
  const expectOwner = String(body.expectOwner || '').toLowerCase().trim();
  if (!code || !expectOwner) return NextResponse.json({ error: 'Card code and current owner are required' }, { status: 400 });
  await connectDB();
  const before = await Device.findOne({ code, ownerUsername: expectOwner });
  if (!before) return NextResponse.json({ error: `${code} is not claimed by @${expectOwner} (refresh the list)` }, { status: 409 });
  const after = await Device.findOneAndUpdate(
    { _id: before._id, ownerUsername: expectOwner },
    releaseUpdate(before, by as string),
    { returnDocument: 'after' }
  );
  if (!after) return NextResponse.json({ error: 'The card changed while releasing. Refresh and try again.' }, { status: 409 });
  console.info(JSON.stringify({ msg: 'owner.release_card', code, by, previousOwner: expectOwner }));
  return NextResponse.json({ released: after.code, previousOwner: expectOwner, status: after.status });
}
