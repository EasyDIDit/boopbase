import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Subscriber from '@/lib/models/Subscriber';
import { isOwner } from '@/lib/ownerAuth';
import { getSessionUsername } from '@/lib/session';
import { csvCell } from '@/lib/leads';

export const dynamic = 'force-dynamic';

type Row = {
  email: string; name?: string; phone?: string; interests?: string[]; sources?: string[];
  consentAt?: Date | null; textConsentAt?: Date | null; isCustomer?: boolean; customerSince?: Date | null; createdAt?: Date;
};

/** Owner only: the Boop mailing list (sign-ups + customers). JSON, or CSV with ?format=csv. */
export async function GET(request: NextRequest) {
  if (!isOwner(getSessionUsername(request))) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  try {
    await connectDB();
    const list = await Subscriber.find({}).sort({ createdAt: -1 }).limit(10_000).lean<Row[]>();
    const rows = list.map((s) => ({
      email: s.email,
      name: s.name || '',
      phone: s.phone || '',
      interests: s.interests || [],
      sources: s.sources || [],
      emailConsent: Boolean(s.consentAt),
      consentAt: s.consentAt || null,
      textConsent: Boolean(s.textConsentAt),
      isCustomer: Boolean(s.isCustomer),
      customerSince: s.customerSince || null,
      createdAt: s.createdAt || null,
    }));
    if (request.nextUrl.searchParams.get('format') === 'csv') {
      const head = ['name', 'email', 'phone', 'type', 'email_consent', 'email_consent_at', 'text_consent', 'interests', 'sources', 'customer_since', 'added_at'];
      const lines = rows.map((r) =>
        [r.name, r.email, r.phone, r.isCustomer ? 'customer' : 'sign-up', r.emailConsent ? 'yes' : 'no', r.consentAt, r.textConsent ? 'yes' : 'no', r.interests, r.sources, r.customerSince, r.createdAt]
          .map(csvCell)
          .join(',')
      );
      return new NextResponse([head.join(','), ...lines].join('\r\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="boop-mailing-list-${new Date().toISOString().slice(0, 10)}.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }
    return NextResponse.json({ subscribers: rows }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('mailing list error', (err as Error).message);
    return NextResponse.json({ error: 'Failed to load mailing list' }, { status: 500 });
  }
}
