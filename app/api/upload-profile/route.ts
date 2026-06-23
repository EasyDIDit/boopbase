import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { writeFile } from 'fs/promises';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded: any = jwt.verify(token, JWT_SECRET);

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const filename = `${decoded.userId}-${Date.now()}${path.extname(file.name)}`;
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
      decoded.userId,
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