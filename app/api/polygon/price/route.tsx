import { getURLParams, NETWORK_URL } from '../networkConfig'
import {  apiResponse } from '../../apiUtils'

const api="/swap/v1/price"

export async function GET (req: Request) {
  const params = getURLParams(req.url);
  const apiQuery = `${NETWORK_URL}${api}?${params}`;

  return apiResponse(apiQuery)
}
