import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { username, name, email, password } = await request.json();

    if (!username || !name || !password) {
      return NextResponse.json({ error: 'Username, name, and password are required' }, { status: 400 });
    }

    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: username.toLowerCase(),
      name,
      email: email ? email.toLowerCase() : '',
      password: hashedPassword,
    });

    return NextResponse.json({ 
      message: 'User registered successfully', 
      user: { username: user.username, name: user.name } 
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}