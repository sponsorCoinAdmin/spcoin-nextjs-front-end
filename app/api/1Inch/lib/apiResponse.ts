// File: lib/api/oneInchResponse.ts
import { getURLParams } from '@/lib/getURLParams'
import { getJson } from '@/lib/rest/http'
import { createDebugLogger } from '@/lib/utils/debugLogger'

const FEE_RECIPIENT = process.env.FEE_RECIPIENT_WALLET
const AFFILIATE_FEE = process.env.AFFILIATE_FEE

const LOG_TIME = false
const DEBUG_ENABLED = process.env.DEBUG_LOG_API_1INCH_SERVER_RESPONSE === 'true'
const debugLog = createDebugLogger('apiResponse:1inch', DEBUG_ENABLED, LOG_TIME)

/** Normalize host/path like `api.1inch.dev/swap/...` to a full https URL */
function toHttpsUrl(input: string): string {
  if (input.startsWith('http://') || input.startsWith('https://')) return input
  return `https://${input}`
}

/**
 * RESTful wrapper around 1inch endpoints.
 * - `request`: host + path with or without protocol (e.g., `api.1inch.dev/swap/v6.0/137/quote`)
 * - `urlParms`: raw querystring you already build elsewhere (e.g., `src=...&dst=...`)
 */
export const apiResponse = async (request: string, urlParms: string) => {
  // Extract the existing params as a URLSearchParams string (no leading `?`)
  const urlParamsOnly = getURLParams(urlParms)
  const isSwap = request.includes('/swap')

  // Append affiliate fees only for swap calls
  const fullParams = new URLSearchParams(urlParamsOnly)
  if (isSwap) {
    if (FEE_RECIPIENT) fullParams.set('feeRecipient', FEE_RECIPIENT)
    if (AFFILIATE_FEE) fullParams.set('AFFILIATE_FEE', `${AFFILIATE_FEE}`)
  }

  // Build final URL safely
  const url = new URL(toHttpsUrl(request))
  // copy params into the URL
  fullParams.forEach((v, k) => url.searchParams.set(k, v))

  debugLog.log?.('====================================================================================================')
  debugLog.log?.('Executing 1inch API Request: ' + url.toString())
  debugLog.log?.('====================================================================================================')

  try {
    const data = await getJson<unknown>(url.toString(), {
      timeoutMs: 10_000,
      retries: 1,
      accept: 'application/json',
      init: {
        // If your 1inch plan needs headers, add them here:
        // headers: { Authorization: `Bearer ${process.env.ONEINCH_API_KEY}` },
      },
    })

    debugLog.log?.(JSON.stringify(data, null, 2))

    return new Response(JSON.stringify(data, null, 2), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  } catch (err) {
    debugLog.error?.('Failed to get from 1inch API:', err)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 })
  }
}

export default apiResponse
