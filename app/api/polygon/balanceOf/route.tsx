import { getQueryVariable } from '@/app/lib/spCoin/utils2'
import { fetchBigIntBalance, fetchStringBalance } from '@/app/lib/wagmi/fetchBalance'
import { getURLParams } from '@/app/lib/getURLParams'
import { CHAIN_ID } from '../networkConfig'

export async function GET(req: Request) {
  const params = getURLParams(req.url);
  const address  = getQueryVariable(params, "walletAddress")
  const token    = getQueryVariable(params, "tokenAddress")
  const chainId  = CHAIN_ID

  const wagmiBalance = await fetchStringBalance(address, token, chainId)
  return new Response(JSON.stringify(wagmiBalance))
}
