import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/lib/models/Customer';
import Device from '@/lib/models/Device';
import { isOwner } from '@/lib/ownerAuth';
import { getSessionUsername } from '@/lib/session';
import { csvCell, customerStatus } from '@/lib/leads';

export async function GET(request: NextRequest) {
  try {
    const username = getSessionUsername(request);
    if (!isOwner(username)) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }

    await connectDB();

    const [customers, devices] = await Promise.all([
      Customer.find({}).sort({ updatedAt: -1 }).lean(),
      Device.find({}).sort({ createdAt: -1 }).lean(),
    ]);

    const rows = customers.map((c) => {
      const email = (c.email || '').toLowerCase();
      const uname = (c.username || '').toLowerCase();
      const linked = devices.filter((d) => {
        const deviceEmail = (d.orderEmail || '').toLowerCase();
        const deviceUser = (d.ownerUsername || '').toLowerCase();
        return (email && deviceEmail === email) || (uname && deviceUser === uname);
      });

      return {
        email: c.email,
        username: c.username || '',
        name: c.name || '',
        phone: c.phone || '',
        interests: c.interests || [],
        sources: c.sources || [],
        source: c.source || '',
        status: customerStatus(c, linked.length),
        consentAt: c.consentAt || null,
        textConsent: Boolean(c.textConsentAt),
        marketingOptOut: Boolean(c.marketingOptOut),
        createdAt: c.createdAt || null,
        devices: linked.map((d) => ({
          code: d.code,
          productType: d.productType,
          status: d.status,
          programmedUrl: d.programmedUrl,
          ownerUsername: d.ownerUsername || '',
        })),
      };
    });

    if (request.nextUrl.searchParams.get('format') === 'csv') {
      const head = ['name', 'email', 'phone', 'status', 'interests', 'sources', 'first_source', 'username', 'email_consent_at', 'text_consent', 'opted_out', 'created_at', 'cards'];
      const lines = rows.map((r) =>
        [r.name, r.email, r.phone, r.status, r.interests, r.sources, r.source, r.username, r.consentAt, r.textConsent ? 'yes' : 'no', r.marketingOptOut ? 'yes' : 'no', r.createdAt, r.devices.map((d) => d.code)]
          .map(csvCell)
          .join(',')
      );
      return new NextResponse([head.join(','), ...lines].join('\r\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="boop-clients-${new Date().toISOString().slice(0, 10)}.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json({ clients: rows }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('List clients error:', error);
    return NextResponse.json({ error: 'Failed to list clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const username = getSessionUsername(request);
    if (!isOwner(username)) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').toLowerCase().trim();
    const profileUsername = String(body.username || '').toLowerCase().trim();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A purchase email is required' }, { status: 400 });
    }

    await connectDB();

    const customer = await Customer.findOneAndUpdate(
      { email },
      {
        email,
        username: profileUsername,
        status: 'customer',
        updatedAt: new Date(),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      email: customer.email,
      username: customer.username || '',
    });
  } catch (error) {
    console.error('Save client error:', error);
    return NextResponse.json({ error: 'Failed to save client' }, { status: 500 });
  }
}
