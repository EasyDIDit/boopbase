import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { dayKey } from '@/lib/daily';
import { buildPublicVCard } from '@/lib/publicProfile';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    await connectDB();

    const { username } = await params;
    const user = await User.findOneAndUpdate(
      { username: username.toLowerCase() },
      { $inc: { contactSaves: 1, [`daily.${dayKey()}.c`]: 1 } },
      { new: true }
    ).select('username name phone company title address');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Owner-entered contact fields only. Never the login email.
    const vcard = buildPublicVCard(user.toObject());

    return new NextResponse(vcard, {
      status: 200,
      headers: {
        'Content-Type': 'text/vcard',
        'Content-Disposition': `attachment; filename="${String(user.username).replace(/[^a-z0-9._-]/g, '')}.vcf"`
      }
    });
  } catch (error) {
    console.error('vCard error:', error);
    return NextResponse.json({ error: 'Failed to generate vCard' }, { status: 500 });
  }
}