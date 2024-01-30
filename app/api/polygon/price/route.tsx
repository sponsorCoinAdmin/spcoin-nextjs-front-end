import { getURLParams, OX_API_KEY, networkURL, feeWalletDetails } from '../networkConfig'
import {  apiResponse } from './apiResponse'

const api="/swap/v1/price"

export async function GET (req: Request) {
  const params = getURLParams(req.url);
  const apiQuery = `${networkURL}${api}?${params}&${feeWalletDetails}`;

  console.log("====================================================================================================")
  console.log("OX_API_KEY:                  " + OX_API_KEY)
  console.log("Executing API Price Request: " + apiQuery)
  console.log("FEE RECIPIENT WALLET:        " + feeWalletDetails)
  console.log("====================================================================================================")

  const response = await fetch(
    apiQuery,
    {
      headers: {
        "0x-api-key": OX_API_KEY, // process.env.NEXT_PUBLIC_0X_API_KEY,
      },
    }
  );

  const data = await response.json();
  // console.log("Executed Price Response : " + JSON.stringify(data,null,2))

  return apiResponse(apiQuery)
}
