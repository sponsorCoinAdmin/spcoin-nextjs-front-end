import { getURLParams, OX_API_KEY, networkURL, FEE_WALLET_DETAILS } from './networkConfig'
const api="/swap/v1/price"

export async function GET (req: Request) {
  const params = getURLParams(req.url);
  const apiQuery = `${networkURL}${api}?${params}&${FEE_WALLET_DETAILS}`;

  console.log("====================================================================================================")
  console.log("OX_API_KEY:                  " + OX_API_KEY)
  console.log("Executing API Price Request: " + apiQuery)
  console.log("FEE RECIPIENT WALLET:        " + FEE_WALLET_DETAILS)
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

  return new Response(JSON.stringify(data, null, 2))
}