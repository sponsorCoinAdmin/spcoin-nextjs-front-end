import { NETWORK } from '../networkConfig'
import { apiResponse } from '../../apiUtils'

const api="/swap/v1/price"

export async function GET (req: Request) {
   return apiResponse(`https://${NETWORK}${api}`, req.url)
}
