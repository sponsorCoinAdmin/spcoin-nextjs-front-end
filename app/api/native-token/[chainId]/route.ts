// File: app/api/native-token/[chainId]/route.ts
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { createDebugLogger } from '@/lib/utils/debugLogger';

export const runtime = 'nodejs';

// 🌐 Debug logging flag and logger controlled by .env.local
const LOG_TIME = false;
const DEBUG_ENABLED = process.env.DEBUG_LOG_API_SPCOIN_TOKEN === 'true';
const debugLog = createDebugLogger('api/native-token', DEBUG_ENABLED, LOG_TIME);

function validateTokenInfo(data: any): data is {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
} {
  return (
    typeof data?.chainId === 'number' &&
    typeof data?.address === 'string' &&
    typeof data?.name === 'string' &&
    typeof data?.symbol === 'string'
  );
}

// ✅ Use ONLY the Request parameter to satisfy Next's route handler validator.
//    We extract chainId from the URL path instead of using the `context` arg.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const match = url.pathname.match(/\/api\/native-token\/([^/]+)\/?$/);
  const chainId = match?.[1];

  if (!chainId) {
    return NextResponse.json({ error: 'Missing chainId in route' }, { status: 400 });
  }

  const infoPath = path.join(
    process.cwd(),
    'public',
    'assets',
    'blockchains',
    `${chainId}`,
    'contracts',
    '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    'info.json'
  );

  debugLog.log(`🟢 GET called for chainId: ${chainId}`);
  debugLog.log(`📁 Looking for file at: ${infoPath}`);

  try {
    const exists = fs.existsSync(infoPath);
    debugLog.log(`🔍 File exists: ${exists}`);

    if (!exists) {
      debugLog.warn(`⚠️ File not found for chainId ${chainId}`);
      return NextResponse.json({ error: 'Chain info not found' }, { status: 404 });
    }

    const rawData = fs.readFileSync(infoPath, 'utf-8');
    debugLog.log(`📄 Raw file contents (truncated): ${rawData.slice(0, 300)}...`);

    let data: unknown;
    try {
      data = JSON.parse(rawData);
    } catch (err) {
      debugLog.error('❌ Failed to parse JSON', err);
      return NextResponse.json({ error: 'Malformed token info file' }, { status: 422 });
    }

    if (!validateTokenInfo(data)) {
      debugLog.warn('⚠️ Invalid token info structure', data as any);
      return NextResponse.json({ error: 'Invalid token info structure' }, { status: 400 });
    }

    debugLog.log('✅ JSON validated and parsed successfully');

    const response = NextResponse.json(data);
    response.headers.set('Cache-Control', 'public, max-age=60');
    return response;
  } catch (e) {
    debugLog.error('❌ Unexpected error reading token info', e);
    return NextResponse.json({ error: 'Server error reading token info' }, { status: 500 });
  }
}
