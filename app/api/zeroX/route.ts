// File: app/api/zeroX/route.ts  (example wrapper if you need one)
import { NextRequest } from 'next/server'
import { fetchZeroX } from '@/lib/rest/zeroX'

export async function GET(req: NextRequest) {
  const request = req.nextUrl.searchParams.get('request') ?? ''
  const urlParams = req.nextUrl.searchParams.get('params') ?? ''
  const json = await fetchZeroX(request, urlParams)
  return new Response(JSON.stringify(json, null, 2), {
    headers: { 'content-type': 'application/json' },
  })
}
