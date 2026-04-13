import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const RSVP_PATH = '/api/rsvp';
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;
const store = new Map<string, { count: number; windowStart: number }>();

function getClientKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname !== RSVP_PATH || request.method !== 'POST') {
    return NextResponse.next();
  }

  const key = getClientKey(request);
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    store.set(key, { count: 1, windowStart: now });
    return NextResponse.next();
  }

  if (entry.count >= MAX_REQUESTS) {
    return NextResponse.json(
      { success: false, message: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  entry.count += 1;
  return NextResponse.next();
}

export const config = {
  matcher: '/api/rsvp',
};
