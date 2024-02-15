import { getQueryVariable } from '../../../../lib/utils'
import { fetchBigIntBalance, fetchStringBalance } from '../../../../lib/wagmi/fetchBalance'
import { getURLParams } from '../../../lib/getURLParams'

export async function GET(req: Request) {
  const params = getURLParams(req.url);
  const address  = getQueryVariable(params, "walletAddress")
  const token    = getQueryVariable(params, "tokenAddress")
  const chainId  = getQueryVariable(params, "chainId")

  const wagmiBalance = await fetchStringBalance(address, token, chainId)
  console.log("BalanceOf = "+wagmiBalance)
  return new Response(JSON.stringify(wagmiBalance))
}
