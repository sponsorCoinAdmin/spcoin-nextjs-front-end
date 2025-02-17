import { BASE_URL } from '../networkConfig'
import { apiResponse } from '@/app/api/0X/lib/apiResponse'

const api="/swap/v1/quote"

export async function GET (req: Request) {
   return apiResponse(`${BASE_URL}${api}`, req.url)
}
