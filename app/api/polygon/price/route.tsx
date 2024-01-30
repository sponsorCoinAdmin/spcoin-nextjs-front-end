import { NETWORK } from '../networkConfig'
import { apiResponse } from '../../apiUtils'

const api="/swap/v1/price"

export async function GET (req: Request) {
   return apiResponse(`${NETWORK}${api}`, req.url)
}
