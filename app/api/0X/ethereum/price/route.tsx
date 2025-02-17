import { BASE_URL } from '../networkConfig'
import { apiResponse } from '@/app/api/0X/lib/apiResponse'

const api="/swap/v1/price"
const api2="/swap/permit2/price"

export async function GET (req: Request) {
   return apiResponse(`${BASE_URL}${api2}`, req.url)
}
