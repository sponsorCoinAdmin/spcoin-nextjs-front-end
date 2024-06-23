import { NETWORK } from '../../networkConfig'
import { apiResponse } from '@/lib/0X/apiResponse'

const api="/swap/v1/quote"

export async function GET (req: Request) {
   return apiResponse(`${NETWORK}${api}`, req.url)
}
