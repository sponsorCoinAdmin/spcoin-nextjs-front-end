// File: app/api/spCoin/auth/verify/route.ts
import { NextResponse } from 'next/server';
import {
  consumeAuthRateLimit,
  isAuthConfigured,
  verifyNonceSignature,
} from '@/lib/server/spCoinAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    if (!isAuthConfigured()) {
      return NextResponse.json(
        { error: 'Server auth is not configured' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    const body = (await request.json()) as {
      address?: string;
      nonce?: string;
      signature?: string;
    };
    const address = String(body?.address ?? '').trim().toLowerCase();
    const forwardedFor = request.headers.get('x-forwarded-for') ?? '';
    const clientIp = forwardedFor.split(',')[0]?.trim() || 'unknown';
    const limiter = await consumeAuthRateLimit('verify', `${clientIp}:${address}`);
    if (!limiter.ok) {
      return NextResponse.json(
        { error: 'Too many verify requests. Please try again shortly.' },
        {
          status: 429,
          headers: {
            'Cache-Control': 'no-store',
            'Retry-After': String(limiter.retryAfterSeconds ?? 1),
          },
        },
      );
    }

    const result = await verifyNonceSignature({
      address: String(body?.address ?? ''),
      nonce: String(body?.nonce ?? ''),
      signature: String(body?.signature ?? ''),
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    return NextResponse.json(result, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to verify signature',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

