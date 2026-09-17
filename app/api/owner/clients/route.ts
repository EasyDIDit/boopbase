import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/lib/models/Customer';
import Device from '@/lib/models/Device';

const OWNER_USERNAMES = (process.env.OWNER_USERNAMES || 'easydidit,pez')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

function isOwner(username: string | undefined) {
  if (!username) return false;
  return OWNER_USERNAMES.includes(username.toLowerCase());
}

export async function GET(request: NextRequest) {
  try {
    const username = request.cookies.get('user')?.value;
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
        devices: linked.map((d) => ({
          code: d.code,
          productType: d.productType,
          status: d.status,
          programmedUrl: d.programmedUrl,
          ownerUsername: d.ownerUsername || '',
        })),
      };
    });

    return NextResponse.json({ clients: rows });
  } catch (error) {
    console.error('List clients error:', error);
    return NextResponse.json({ error: 'Failed to list clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const username = request.cookies.get('user')?.value;
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
