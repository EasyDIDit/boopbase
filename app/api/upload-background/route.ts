import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '../../../lib/models/User';
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

    const backgroundColor = formData.get('backgroundColor') as string;
    const file = formData.get('file') as File | null;

    console.log("Background Update Request - Color:", backgroundColor, "File:", !!file);

    const user = await User.findById(decoded.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const filename = `bg-${decoded.userId}-${Date.now()}${path.extname(file.name)}`;
      const filepath = path.join(process.cwd(), 'public/uploads', filename);

      const fs = require('fs');
      if (!fs.existsSync(path.join(process.cwd(), 'public/uploads'))) {
        fs.mkdirSync(path.join(process.cwd(), 'public/uploads'), { recursive: true });
      }

      await writeFile(filepath, buffer);
      user.backgroundImage = `/uploads/${filename}`;
      user.backgroundColor = '';
      console.log("Background image saved:", user.backgroundImage);
    } 
    else if (backgroundColor) {
      user.backgroundColor = backgroundColor;
      user.backgroundImage = '';
      console.log("Background color updated to:", backgroundColor);
    }

    await user.save();
    console.log("User saved successfully");

    return NextResponse.json({ 
      message: 'Background updated',
      backgroundImage: user.backgroundImage,
      backgroundColor: user.backgroundColor 
    });

  } catch (error: any) {
    console.error("Background Error:", error);
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}