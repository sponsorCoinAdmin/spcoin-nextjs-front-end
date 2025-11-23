// File: @/lib/api/apiResponse.ts
import { getURLParams } from '@/lib/getURLParams'
import { getJson } from '@/lib/rest/http'
import { createDebugLogger } from '@/lib/utils/debugLogger'

const OX_API_KEY: string = process.env.OX_API_KEY === undefined ? '0' : process.env.OX_API_KEY
const FEE_RECIPIENT = process.env.FEE_RECIPIENT_WALLET
const AFFILIATE_FEE = process.env.AFFILIATE_FEE
const FEE_WALLET_DETAILS = `feeRecipient=${FEE_RECIPIENT}&AFFILIATE_FEE=${AFFILIATE_FEE}`

// 🌐 Debug logging flag and logger controlled by .env.local
const LOG_TIME = false
const DEBUG_ENABLED = process.env.NEXT_SERVER_DEBUG_LOG_API_0X_SERVER_RESPONSE === 'true'
const debugLog = createDebugLogger('apiResponse', DEBUG_ENABLED, LOG_TIME)

/**
 * RESTful version using shared helpers (timeout, retries, typed JSON).
 * `request` should be like `api.0x.org/swap/v1/quote` (without protocol).
 * `urlParms` is your raw querystring (e.g., `sellToken=...&buyToken=...`).
 */
export const apiResponse = async (request: string, urlParms: string) => {
  const apiQuery = `https://${request}?${getURLParams(urlParms)}&${FEE_WALLET_DETAILS}`

  debugLog.log?.('====================================================================================================')
  debugLog.log?.('OX_API_KEY:               ' + (OX_API_KEY ? '[set]' : '[missing]'))
  debugLog.log?.('Executing 0x API Request: ' + apiQuery)
  debugLog.log?.('====================================================================================================')

  // Use REST helper with headers passed via `init`
  const data = await getJson<unknown>(apiQuery, {
    init: {
      headers: {
        '0x-api-key': OX_API_KEY,
        '0x-version': 'v2',
        // Accept is already set by getJson via opts.accept, but adding here is fine too:
        Accept: 'application/json',
      },
    },
  })

  debugLog.log?.(`API Response: ${JSON.stringify(data, null, 2)}`)

  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

export { apiResponse as default }
