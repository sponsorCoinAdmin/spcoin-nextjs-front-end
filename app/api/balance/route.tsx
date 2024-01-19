import { getQueryVariable } from '../../lib/utils'
import { fetchBigIntBalance, fetchStringBalance } from '../../lib/wagmi/api/fetchBalance'

export async function GET (req: Request) {
  const url=req.url;

  const urlPart = url.split("?");
  const params = urlPart[1];

  // console.debug("=== balance =================================================================================================")
  // console.debug("PRICE REQUEST URL = " + url)

  let address = getQueryVariable(params, "walletAddress")
  let token = getQueryVariable(params, "tokenAddress")
  let chainId = getQueryVariable(params, "chainId")

  let wagmiBalance = await fetchStringBalance(address, token, chainId)
  // console.debug("*** wagmiBalance *** " + JSON.stringify(wagmiBalance, null, 2))
  // console.debug("=== balance =================================================================================================")

  return new Response(JSON.stringify(wagmiBalance))
}
