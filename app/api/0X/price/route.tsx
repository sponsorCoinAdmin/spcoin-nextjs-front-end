// ToDo Fix this to do networking by chainId
import { NETWORK } from '../../networkConfig'
import { apiResponse } from '../../../lib/0X/apiResponse'

const api="/swap/v1/price"

export async function GET (req: Request) {
   return apiResponse(`${NETWORK}${api}`, req.url)
}
