// File: app/api/0x/sepolia/price/route.tsx

'use server';

import { BASE_URL } from '../networkConfig'
import { apiResponse } from '@/app/api/0x/lib/apiResponse'

const api="/swap/v1/price"

export async function GET (req: Request) {
   return apiResponse(`${BASE_URL}${api}`, req.url)
}
