// File: app/api/0x/swap/permit2/price/route.ts

import { BASE_URL } from '../networkConfig'
import { apiResponse } from '@/app/api/0x/lib/apiResponse'
import { createDebugLogger } from '@/lib/utils/debugLogger'

const LOG_TIME = false
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_END_USER_API === 'true'
const debugLog = createDebugLogger('0x-swap-permit2-price', DEBUG_ENABLED, LOG_TIME)

const API_PATH = '/swap/permit2/price/'

export async function GET(req: Request) {
  if (DEBUG_ENABLED) {
    const url = new URL(req.url)
    const origin = req.headers.get('origin')

    debugLog.log?.('📥 Incoming request to 0x permit2 price route', {
      method: req.method,
      url: req.url,
      origin,
      path: url.pathname,
      search: url.search,
    })
  }

  const upstreamBase = `${BASE_URL}${API_PATH}`

  try {
    const res = await apiResponse(upstreamBase, req.url)

    if (DEBUG_ENABLED) {
      debugLog.log?.('📤 Upstream response from 0x proxy', {
        upstreamBase,
        status: res.status,
        'access-control-allow-origin': res.headers.get('access-control-allow-origin'),
        'access-control-allow-headers': res.headers.get('access-control-allow-headers'),
        'access-control-allow-methods': res.headers.get('access-control-allow-methods'),
      })
    }

    return res
  } catch (error: any) {
    debugLog.error?.('❌ Error in 0x permit2 price route', {
      upstreamBase,
      error: error?.message ?? String(error),
    })

    return new Response(
      JSON.stringify(
        {
          error: 'Internal error calling 0x price API',
          details: DEBUG_ENABLED ? String(error) : undefined,
        },
        null,
        2,
      ),
      {
        status: 500,
        headers: {
          'content-type': 'application/json',
        },
      },
    )
  }
}
