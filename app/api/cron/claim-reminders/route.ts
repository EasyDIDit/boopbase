import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Device from '@/lib/models/Device';
import BoopOrder from '@/lib/models/BoopOrder';
import { REMINDER_DAYS, provisionSecret, reminderDue } from '@/lib/provision';
import { issueFreshLink, notifyStore, publicBase } from '@/lib/cardLinks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_PER_RUN = 100;

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const given = Buffer.from(request.headers.get('authorization') || '');
  const want = Buffer.from(`Bearer ${secret}`);
  return given.length === want.length && crypto.timingSafeEqual(given, want);
}

/**
 * Daily (vercel.json). For each sold, unclaimed card: reminder with a fresh link at ~day 7, 25, 55 after sale.
 * Max 3; stops once claimed. No-op unless CRON_SECRET, BOOPBASE_PROVISION_SECRET and STORE_NOTIFY_URL are set.
 */
export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET?.trim()) return NextResponse.json({ ok: true, skipped: 'CRON_SECRET not set' });
  if (!authorized(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const secret = provisionSecret();
  if (!secret || !process.env.STORE_NOTIFY_URL?.trim()) return NextResponse.json({ ok: true, skipped: 'notify not configured' });

  await connectDB();
  const now = Date.now();
  const base = publicBase(request.nextUrl.origin);
  const candidates = await Device.find({
    status: 'sold',
    soldAt: { $ne: null, $lte: new Date(now - REMINDER_DAYS[0] * 86400000) },
    remindersSent: { $lt: REMINDER_DAYS.length },
    orderEmail: { $nin: ['', null] },
    $or: [{ ownerUsername: '' }, { ownerUsername: null }],
  })
    .sort({ soldAt: 1 })
    .limit(MAX_PER_RUN * 2);

  const results: Record<string, number> = {};
  let sent = 0;
  for (const d of candidates) {
    if (sent >= MAX_PER_RUN) break;
    if (!reminderDue(d, now)) continue;
    // Claim this reminder slot atomically so overlapping runs can't double-send.
    const slot = await Device.updateOne(
      { _id: d._id, remindersSent: d.remindersSent || 0, status: 'sold', $or: [{ ownerUsername: '' }, { ownerUsername: null }] },
      { $inc: { remindersSent: 1 }, $set: { lastLinkSentAt: new Date() } }
    );
    if (slot.modifiedCount !== 1) continue;
    const order = d.orderId ? await BoopOrder.findOne({ orderId: d.orderId }) : null;
    const link = await issueFreshLink(secret, base, d);
    const r = await notifyStore({ kind: 'reminder', orderId: d.orderId || '', email: d.orderEmail, name: order?.name || '', livemode: !!order?.livemode, cards: [link] });
    // Not delivered (email off / store down): give the reminder slot back so it is retried next run.
    if (r.outcome !== 'sent') await Device.updateOne({ _id: d._id, remindersSent: { $gt: 0 } }, { $inc: { remindersSent: -1 } });
    results[r.outcome] = (results[r.outcome] || 0) + 1;
    sent++;
  }
  console.info(JSON.stringify({ msg: 'cron.claim_reminders', checked: candidates.length, ...results }));
  return NextResponse.json({ ok: true, checked: candidates.length, ...results });
}
