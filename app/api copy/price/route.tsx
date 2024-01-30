const FEE_RECIPIENT = process.env.FEE_RECIPIENT_WALLET
const AFFILIATE_FEE = process.env.AFFILIATE_FEE
const FEE_WALLET_DETAILS = `FEE_RECIPIENT=${FEE_RECIPIENT}&AFFILIATE_FEE=${AFFILIATE_FEE}`
const OX_API_KEY:string = process.env.OX_API_KEY === undefined ? "0" : process.env.OX_API_KEY

export async function GET (req: Request) {
  const url=req.url;

  const network = 'https://polygon.api.0x.org'
  const api = '/swap/v1/price'
  const urlPart = url.split("?");
  const params = urlPart[1];
  const apiQuery = `https://polygon.api.0x.org/swap/v1/price?${params}&${FEE_WALLET_DETAILS}`;

  console.log("====================================================================================================")
  console.log("OX_API_KEY:                  " + OX_API_KEY)
  console.log("QUOTE REQUEST URL:           " + url)
  console.log("Executing API Price Request: " + apiQuery)
  console.log("FEE RECIPIENT WALLET:        " + FEE_RECIPIENT)
  console.log("AFFILIATE_FEE PERCENT:       " + AFFILIATE_FEE)
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