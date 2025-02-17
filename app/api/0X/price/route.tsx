import { BASE_URL } from '../networkConfig'
import { apiResponse } from '@/app/api/0X/lib/apiResponse'

const api="/swap/permit2/price/"

export async function GET (req: Request) {
   return apiResponse(`${BASE_URL}${api}`, req.url)
}
