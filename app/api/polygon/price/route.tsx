import { NETWORK_URL } from '../networkConfig'
import { apiResponse } from '../../apiUtils'

const api="/swap/v1/price"

export async function GET (req: Request) {
  const apiQuery = `${NETWORK_URL}${api}`;

  return apiResponse(apiQuery, req.url)
}
