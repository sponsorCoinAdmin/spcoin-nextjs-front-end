import { getURLParams, OX_API_KEY, networkURL, feeWalletDetails } from '../networkConfig'
import {  apiResponse } from '../../apiUtils'

const api="/swap/v1/price"

export async function GET (req: Request) {
  const params = getURLParams(req.url);
  const apiQuery = `${networkURL}${api}?${params}&${feeWalletDetails}`;

  return apiResponse(apiQuery)
}
