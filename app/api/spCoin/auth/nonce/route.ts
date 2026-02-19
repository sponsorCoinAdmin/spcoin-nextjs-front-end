// File: app/api/spCoin/auth/nonce/route.ts
import { NextResponse } from 'next/server';
import { issueNonce } from '@/lib/server/spCoinAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { address?: string };
    const address = String(body?.address ?? '').trim();
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

