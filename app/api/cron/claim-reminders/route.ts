import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Device from '@/lib/models/Device';
import BoopOrder from '@/lib/models/BoopOrder';
import { REMINDER_DAYS, provisionSecret, reminderDue } from '@/lib/provision';
import { canDeliver, notifyStore, prepareFreshLink, publicBase, storeEmailHealth } from '@/lib/cardLinks';

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
 * Max 3; stops once claimed. No-op unless CRON_SECRET, BOOPBASE_PROVISION_SECRET, STORE_NOTIFY_URL are set AND the
 * store reports Resend configured (signed health check). Links rotate only after the store confirms the email was sent.
 */
export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET?.trim()) return NextResponse.json({ ok: true, skipped: 'CRON_SECRET not set' });
  if (!authorized(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const secret = provisionSecret();
  if (!secret || !process.env.STORE_NOTIFY_URL?.trim()) return NextResponse.json({ ok: true, skipped: 'notify not configured' });

  // End-to-end check: only run when the store can really send email. Otherwise do nothing (no link rotation).
  const health = await storeEmailHealth();
  if (!health || !health.resend) return NextResponse.json({ ok: true, skipped: 'store email not configured' });

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
    const orderForMode = d.orderId ? await BoopOrder.findOne({ orderId: d.orderId }) : null;
    if (!canDeliver(health, !!orderForMode?.livemode)) {
      results['undeliverable-test-order'] = (results['undeliverable-test-order'] || 0) + 1;
      continue;
    }
    // Claim this reminder slot atomically so overlapping runs can't double-send.
    const slot = await Device.updateOne(
      { _id: d._id, remindersSent: d.remindersSent || 0, status: 'sold', $or: [{ ownerUsername: '' }, { ownerUsername: null }] },
      { $inc: { remindersSent: 1 }, $set: { lastLinkSentAt: new Date() } }
    );
    if (slot.modifiedCount !== 1) continue;
    const order = orderForMode;
    const fresh = prepareFreshLink(secret, base, d);
    const r = await notifyStore({ kind: 'reminder', orderId: d.orderId || '', email: d.orderEmail, name: order?.name || '', livemode: !!order?.livemode, cards: [fresh.link] });
    if (r.outcome === 'sent') {
      await fresh.commit(); // link rotates only after delivery
    } else {
      // Not delivered: old link stays valid; give the reminder slot back so it is retried next run.
      await Device.updateOne({ _id: d._id, remindersSent: { $gt: 0 } }, { $inc: { remindersSent: -1 } });
    }
    results[r.outcome] = (results[r.outcome] || 0) + 1;
    sent++;
  }
  console.info(JSON.stringify({ msg: 'cron.claim_reminders', checked: candidates.length, ...results }));
  return NextResponse.json({ ok: true, checked: candidates.length, ...results });
}
