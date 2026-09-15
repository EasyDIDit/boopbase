import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

const ALLOWED = ['pez', 'easydidit'];
const CONFIRM = 'PEASY-RETIRE-001';

export async function GET(request: NextRequest) {
  const confirm = request.nextUrl.searchParams.get('confirm');
  if (confirm !== CONFIRM) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  try {
    await connectDB();
    const result = await User.deleteMany({ username: { $in: ALLOWED } });
    return NextResponse.json({
      ok: true,
      deleted: result.deletedCount,
      usernames: ALLOWED,
    });
  } catch (error) {
    console.error('Retire legacy error:', error);
    return NextResponse.json({ error: 'Could not retire old users' }, { status: 500 });
  }
}
