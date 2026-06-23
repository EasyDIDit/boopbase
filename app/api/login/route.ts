import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { emailOrUsername, password } = await request.json();

    if (!emailOrUsername || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const user = await User.findOne({
      $or: [
        { username: emailOrUsername.toLowerCase() },
        { email: emailOrUsername.toLowerCase() }
      ]
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Simple password check (we'll improve later)
    if (user.password !== password) {
      return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
    }

    const response = NextResponse.json({ 
      message: 'Login successful', 
      user: { username: user.username, name: user.name } 
    });

    response.cookies.set('user', user.username, { 
      httpOnly: true, 
      maxAge: 60 * 60 * 24 * 7 
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}