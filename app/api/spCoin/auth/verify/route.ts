// File: app/api/spCoin/auth/verify/route.ts
import { NextResponse } from 'next/server';
import { verifyNonceSignature } from '@/lib/server/spCoinAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      address?: string;
      nonce?: string;
      signature?: string;
    };

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

