import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { getSessionUsername, unauthorized } from '@/lib/session';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Signed session only; any username sent with the request is ignored.
    const username = getSessionUsername(request);
    if (!username) return unauthorized();

    await connectDB();

    const sessionUser = await User.findOne({ username }).select('_id');
    if (!sessionUser) return unauthorized();
    const userId = String(sessionUser._id);

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const filename = `${userId}-${Date.now()}${path.extname(file.name)}`;
    const filepath = path.join(process.cwd(), 'public/uploads', filename);

    // Ensure uploads folder exists
    const fs = require('fs');
    if (!fs.existsSync(path.join(process.cwd(), 'public/uploads'))) {
      fs.mkdirSync(path.join(process.cwd(), 'public/uploads'), { recursive: true });
    }

    await writeFile(filepath, buffer);

    const imageUrl = `/uploads/${filename}`;

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { profileImage: imageUrl },
      { new: true }
    );

    return NextResponse.json({ 
      message: 'Profile photo uploaded',
      profileImage: imageUrl 
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}