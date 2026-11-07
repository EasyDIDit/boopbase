import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { dayKey } from '@/lib/daily';

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
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build vCard content
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${user.name || ''}`,
      `N:${user.name || ''};;;;`,
      user.phone ? `TEL;TYPE=CELL:${user.phone}` : '',
      user.email ? `EMAIL;TYPE=INTERNET:${user.email}` : '',
      user.company ? `ORG:${user.company}` : '',
      user.title ? `TITLE:${user.title}` : '',
      user.address ? `ADR;TYPE=HOME:;;${user.address};;;;` : '',
      'END:VCARD'
    ].filter(Boolean).join('\n');

    return new NextResponse(vcard, {
      status: 200,
      headers: {
        'Content-Type': 'text/vcard',
        'Content-Disposition': `attachment; filename="${username}.vcf"`
      }
    });
  } catch (error) {
    console.error('vCard error:', error);
    return NextResponse.json({ error: 'Failed to generate vCard' }, { status: 500 });
  }
}