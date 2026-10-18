import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/lib/models/Customer';
import LeadThrottle from '@/lib/models/LeadThrottle';
import { LEAD_RATE_LIMIT, leadUpdate, leadsEnabled, leadsSecret, parseLeadBody, throttleKeys, verifyLeadSignature } from '@/lib/leads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Store → BOOPbase: Boop sign-up form. HMAC-signed (BOOPBASE_LEADS_SECRET). Upserts Customer by email.
 * Off (503) unless BOOP_LEADS_ENABLED=true and the secret is set. Rate limited per email and per hashed IP.
 */
export async function POST(request: NextRequest) {
  const secret = leadsSecret();
  if (!leadsEnabled() || !secret) return NextResponse.json({ error: 'sign-ups not enabled' }, { status: 503 });

  const raw = await request.text();
  if (raw.length > 4_000) return NextResponse.json({ error: 'too large' }, { status: 413 });
  if (!verifyLeadSignature(secret, raw, request.headers.get('x-boop-timestamp'), request.headers.get('x-boop-signature'))) {
    return NextResponse.json({ error: 'bad signature' }, { status: 401 });
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }
  const body = parseLeadBody(parsed);
  if (!body) return NextResponse.json({ error: 'invalid body' }, { status: 400 });

  try {
    await connectDB();
    const expiresAt = new Date(Date.now() + 2 * 3_600_000);
    for (const key of throttleKeys(body)) {
      const row = await LeadThrottle.findOneAndUpdate(
        { key },
        { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
        { upsert: true, new: true }
      ).lean<{ count: number }>();
      if ((row?.count ?? 0) > LEAD_RATE_LIMIT) return NextResponse.json({ error: 'too many sign-ups' }, { status: 429 });
    }
    await Customer.updateOne({ email: body.email }, leadUpdate(body), { upsert: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('lead upsert failed', (err as Error).message);
    return NextResponse.json({ error: 'could not save' }, { status: 500 });
  }
}
