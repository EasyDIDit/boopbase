import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    await connectDB();

    const { username } = await params;

    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${user.name}`,
      `N:${user.name};;;;`,
      user.title ? `TITLE:${user.title}` : '',
      user.company ? `ORG:${user.company}` : '',
      user.phone ? `TEL;TYPE=CELL:${user.phone}` : '',
      user.email ? `EMAIL;TYPE=WORK:${user.email}` : '',
      user.address ? `ADR;TYPE=WORK:;;${user.address};;;` : '',
      user.bio ? `NOTE:${user.bio}` : '',
      user.profileImage ? `PHOTO;VALUE=URI:${user.profileImage}` : '',
      'END:VCARD',
    ]
      .filter(Boolean)
      .join('\r\n');

    return new NextResponse(vcard, {
      status: 200,
      headers: {
        'Content-Type': 'text/vcard',
        'Content-Disposition': `attachment; filename="${user.username}.vcf"`,
      },
    });
  } catch (error) {
    console.error('vCard generation error:', error);
    return NextResponse.json({ error: 'Failed to generate vCard' }, { status: 500 });
  }
}