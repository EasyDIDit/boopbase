import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const backgroundColor = formData.get('backgroundColor') as string | null;
    const username = formData.get('username') as string;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Handle background color update
    if (backgroundColor) {
      user.backgroundColor = backgroundColor;
    }

    // Handle background image upload
    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const filename = `bg-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const filepath = path.join(process.cwd(), 'public', 'uploads', filename);

      await writeFile(filepath, buffer);

      user.backgroundImage = `/uploads/${filename}`;
      console.log("Background image saved:", user.backgroundImage);
    }

    await user.save();

    return NextResponse.json({ 
      message: 'Background updated successfully',
      backgroundImage: user.backgroundImage,
      backgroundColor: user.backgroundColor 
    });
  } catch (error: any) {
    console.error('Background upload error:', error);
    return NextResponse.json({ error: 'Failed to update background' }, { status: 500 });
  }
}