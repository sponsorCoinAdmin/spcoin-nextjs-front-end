// File: lib/rest/zeroX.ts
// import { getJson } from '@/lib/rest/http'
// import { getURLParams } from '@/lib/getURLParams'

// const OX_API_KEY = process.env.OX_API_KEY ?? '0'
// const FEE_RECIPIENT = process.env.FEE_RECIPIENT_WALLET ?? ''
// const AFFILIATE_FEE = process.env.AFFILIATE_FEE ?? ''

// const fees = `feeRecipient=${encodeURIComponent(FEE_RECIPIENT)}&AFFILIATE_FEE=${encodeURIComponent(AFFILIATE_FEE)}`

// export async function fetchZeroX<T = any>(request: string, urlParams: string): Promise<T> {
//   const host = request.startsWith('http') ? request.replace(/^https?:\/\//, '') : request
//   const url = `https://${host}?${getURLParams(urlParams)}&${fees}`

//   return getJson<T>(url, {
//     init: {
//       headers: {
//         '0x-api-key': OX_API_KEY,
//         '0x-version': 'v2',
//       },
//     },
//   })
// }
