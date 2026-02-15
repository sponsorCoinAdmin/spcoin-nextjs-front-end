// File: app/api/0x/ethereum/price/route.tsx
'use server';

import { BASE_URL } from '../networkConfig';
import { apiResponse } from '@/app/api/0x/lib/apiResponse';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_SERVER_DEBUG_LOG_API_0X_PRICE_REQUEST === 'true';

const debugLog = createDebugLogger('0x-swap-permit2-price', DEBUG_ENABLED, LOG_TIME);

// Upstream 0x path
const api = '/swap/permit2/price/';

export async function GET(req: Request) {
  const urlObj = new URL(req.url);
  const path = urlObj.pathname;
  const search = urlObj.search;
  const origin = req.headers.get('origin');

  if (process.env.NEXT_SERVER_DEBUG_LOG_API_0X_PRICE_REQUEST === 'true') {
    debugLog.log?.('📥 Incoming request to 0x permit2 price route', {
      method: 'GET',
      url: req.url,
      origin,
      path,
      search,
    });
  }

  const upstreamBase = `${BASE_URL}${api}`;

  try {
    const res = await apiResponse(upstreamBase, req.url);

    if (process.env.NEXT_SERVER_DEBUG_LOG_API_0X_SERVER_RESPONSE === 'true') {
      debugLog.log?.('📤 Upstream response from 0x proxy', {
        upstreamBase,
        status: res.status,
        'access-control-allow-origin': res.headers.get('access-control-allow-origin'),
        'access-control-allow-headers': res.headers.get('access-control-allow-headers'),
        'access-control-allow-methods': res.headers.get('access-control-allow-methods'),
      });
    }

    return res;
  } catch (err: any) {
    debugLog.error?.('❌ 0x permit2 price route error', {
      message: err?.message ?? String(err),
      name: err?.name,
      stack: err?.stack,
      upstreamBase,
    });

    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        details: err?.message ?? String(err),
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      },
    );
  }
}
