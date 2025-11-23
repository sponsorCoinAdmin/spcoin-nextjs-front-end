// File: @/app/api/0x/price/route.ts
'use server';

import { BASE_URL } from '../networkConfig';
import { apiResponse } from '@/app/api/0x/lib/apiResponse';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const api = '/swap/permit2/price/';
const ROUTE_TAG = '[api/0x/price]';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_SERVER_DEBUG_LOG_0X_PRICE_API === 'true';
const debugLog = createDebugLogger('0xPriceRoute', DEBUG_ENABLED, LOG_TIME);

// This runs once when the route module is loaded by Next.js
debugLog.log?.(`${ROUTE_TAG} 📦 route module loaded — BASE_URL='${BASE_URL}', api='${api}'`);

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Request logging (gated by DEBUG_ENABLED)
  debugLog.log?.(`${ROUTE_TAG} 📥 Incoming request`, {
    method: 'GET',
    url: req.url,
    path: url.pathname,
    search: url.search,
    origin: req.headers.get('origin'),
    host: req.headers.get('host'),
    referer: req.headers.get('referer'),
    userAgent: req.headers.get('user-agent'),
  });

  const upstreamBase = `${BASE_URL}${api}`;

  debugLog.log?.(`${ROUTE_TAG} 🔗 Proxying to upstream`, {
    upstreamBase,
    originalUrl: req.url,
  });

  try {
    // Delegate to your shared helper (which actually calls 0x)
    const res = await apiResponse(upstreamBase, req.url);

    debugLog.log?.(`${ROUTE_TAG} 📤 Upstream response`, {
      status: res.status,
      ok: res.ok,
      'access-control-allow-origin': res.headers.get('access-control-allow-origin'),
      'access-control-allow-headers': res.headers.get('access-control-allow-headers'),
      'access-control-allow-methods': res.headers.get('access-control-allow-methods'),
    });

    return res;
  } catch (err: any) {
    debugLog.error?.(`${ROUTE_TAG} ❌ Error in route handler`, {
      message: err?.message ?? String(err),
      name: err?.name,
      stack: err?.stack,
    });

    // Even on error we return a JSON body so the client sees *something*
    return new Response(
      JSON.stringify({
        error: 'PROXY_ERROR',
        message: err?.message ?? 'Unknown error in /api/0x/price route',
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
}
