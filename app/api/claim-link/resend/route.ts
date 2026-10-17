import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { hashClaimToken } from '@/lib/provision';
import { publicBase, selfServiceResend } from '@/lib/cardLinks';

const GENERIC = {
  message: 'If this card is waiting to be set up, we emailed a new setup link to the email used at checkout.',
};

// Best-effort per-instance IP limiter on top of the per-card DB limit.
const hits = new Map<string, number[]>();
function ipLimited(ip: string, now = Date.now()) {
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 10;
}

/**
 * Self-service "email me a new setup link". Input: { token } (old/expired link) or { code } (tap screen).
 * Only ever sends to the card's checkout email. Same response whatever happens (no enumeration).
 */
export async function POST(request: NextRequest) {
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  const body = await request.json().catch(() => ({}));
  const token = String(body.token || '');
  const code = String(body.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 32);
  if (ipLimited(ip) || (!token && !code)) return NextResponse.json(GENERIC);
  try {
    await connectDB();
    let filter: Record<string, unknown>;
    if (token && /^[A-Za-z0-9_-]{20,100}$/.test(token)) {
      const h = hashClaimToken(token);
      filter = { $or: [{ claimTokenHash: h }, { prevTokenHashes: h }] };
    } else if (code) {
      filter = { code };
    } else {
      return NextResponse.json(GENERIC);
    }
    const outcome = await selfServiceResend(filter, publicBase(request.nextUrl.origin));
    console.info(JSON.stringify({ msg: 'claim_link.resend', outcome }));
  } catch (error) {
    console.error('Resend link error:', (error as Error).message);
  }
  return NextResponse.json(GENERIC);
}
