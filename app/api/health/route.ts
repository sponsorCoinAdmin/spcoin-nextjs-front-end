// File: app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { ok: true, service: 'sponsorcoin-front', ts: Date.now() },
    { status: 200 }
  );
}
