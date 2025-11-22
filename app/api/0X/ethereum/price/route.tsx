// File: app/api/0x/ethereum/price/route.tsx

import { BASE_URL } from '../networkConfig'
import { apiResponse } from '@/app/api/0x/lib/apiResponse'

const api2="/swap/permit2/price"

export async function GET (req: Request) {
   return apiResponse(`${BASE_URL}${api2}`, req.url)
}
