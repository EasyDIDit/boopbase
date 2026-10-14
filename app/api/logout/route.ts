import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/session';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  clearSessionCookie(request, response);
  return response;
}

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', request.url));
  clearSessionCookie(request, response);
  return response;
}
