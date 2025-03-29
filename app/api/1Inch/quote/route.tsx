// /app/api/1Inch/price/route.ts
import { BASE_URL } from '../networkConfig'
import { apiResponse } from '@/app/api/1Inch/lib/apiResponse'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const chainId = url.searchParams.get('chainId') ?? '1'
  const api = `v5.0/${chainId}/quote`

  // Remove 1inch-unfriendly params before passing to real API
  const cleanedParams = new URLSearchParams(url.searchParams)
  cleanedParams.delete('chainId')
  cleanedParams.delete('slippage')               // ❌ Not allowed in /quote
  cleanedParams.delete('feeRecipient')           // ❌ Not allowed in /quote
  cleanedParams.delete('AFFILIATE_FEE')          // ❌ Not allowed in /quote
  cleanedParams.delete('fromAddress'); // 👈 Remove this too


  const cleanQuery = cleanedParams.toString()

  return apiResponse(`${BASE_URL}/${api}`, `?${cleanQuery}`)
}
