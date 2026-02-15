// File: app/api/0x/polygon/quote/route.tsx

'use server';

import { BASE_URL } from '../networkConfig'
import { apiResponse } from '@/app/api/0x/lib/apiResponse'

const api="/swap/v1/quote"

export async function GET (req: Request) {
   return apiResponse(`${BASE_URL}${api}`, req.url)
}
