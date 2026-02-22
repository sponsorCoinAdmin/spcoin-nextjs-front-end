// File: app/api/spCoin/auth/nonce/route.ts
import { NextResponse } from 'next/server';
import { consumeAuthRateLimit, issueNonce, isAuthConfigured } from '@/lib/server/spCoinAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { address?: string };
    const address = String(body?.address ?? '').trim();
    if (!isAuthConfigured()) {
      return NextResponse.json(
        { error: 'Server auth is not configured' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    const forwardedFor = request.headers.get('x-forwarded-for') ?? '';
    const clientIp = forwardedFor.split(',')[0]?.trim() || 'unknown';
    const limiter = await consumeAuthRateLimit('nonce', `${clientIp}:${address.toLowerCase()}`);
    if (!limiter.ok) {
      return NextResponse.json(
        { error: 'Too many nonce requests. Please try again shortly.' },
        {
          status: 429,
          headers: {
            'Cache-Control': 'no-store',
            'Retry-After': String(limiter.retryAfterSeconds ?? 1),
          },
        },
      );
    }
    const payload = issueNonce(address);
    return NextResponse.json(payload, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to issue nonce',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

