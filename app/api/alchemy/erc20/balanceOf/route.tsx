import { getQueryVariable } from '../@/app/lib/spCoin/utils'
import { fetchBigIntBalance, fetchStringBalance } from '../@/app/lib/wagmi/fetchBalance'
import { balanceOf } from '../@/app/lib/ethers/providers/alchemy'
import { getURLParams } from '@/app/lib/getURLParams'

export async function GET(req: Request) {
  const params = getURLParams(req.url);
  const address  = getQueryVariable(params, "walletAddress")
  const token    = getQueryVariable(params, "tokenAddress")
  const chainId  = getQueryVariable(params, "chainId")

  const wagmiBalance = await fetchStringBalance(address, token, chainId)

  const retBalanceOf = balanceOf(address, token)
  console.log("Wagmi BalanceOf = "+wagmiBalance)

  console.log("Wagmi BalanceOf = " + )
  return new Response(JSON.stringify(wagmiBalance))
}
