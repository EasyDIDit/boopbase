import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { username, linkId } = await request.json();

    if (!username || !linkId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    await User.updateOne(
      { username },
      { $inc: { 'links.$[elem].clicks': 1 } },
      { arrayFilters: [{ 'elem.id': linkId }] }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Click tracking error:', error);
    return NextResponse.json({ error: 'Failed to track click' }, { status: 500 });
  }
}