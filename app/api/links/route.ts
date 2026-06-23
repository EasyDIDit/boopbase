import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '../../../lib/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const { title, url } = await request.json();

    if (!title || !url) {
      return NextResponse.json({ error: 'Title and URL required' }, { status: 400 });
    }

    const user = await User.findById(decoded.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const newLink = {
      id: Date.now().toString(),
      title,
      url,
      icon: '',
      isActive: true
    };

    user.links.push(newLink);
    await user.save();

    return NextResponse.json({ message: 'Link added', link: newLink });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add link' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const { linkId } = await request.json();

    const user = await User.findById(decoded.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    user.links = user.links.filter((link: any) => link.id !== linkId);
    await user.save();

    return NextResponse.json({ message: 'Link deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 });
  }
}

// NEW: Reorder links
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const { links } = await request.json();   // array of links in new order

    const user = await User.findById(decoded.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    user.links = links;
    await user.save();

    return NextResponse.json({ message: 'Links reordered' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reorder links' }, { status: 500 });
  }
}