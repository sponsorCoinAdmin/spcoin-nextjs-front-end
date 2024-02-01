import { getQueryVariable } from '../../../lib/utils'
import { fetchBigIntBalance, fetchStringBalance } from '../../../lib/wagmi/api/fetchBalance'
import { getURLParams } from '../../lib/getURLParams'
import { CHAIN_ID } from '../networkConfig'

export async function GET(req: Request) {
  const params = getURLParams(req.url);
  const address  = getQueryVariable(params, "walletAddress")
  const token    = getQueryVariable(params, "tokenAddress")
  const chainId  = CHAIN_ID

  const wagmiBalance = await fetchStringBalance(address, token, chainId)
  return new Response(JSON.stringify(wagmiBalance))
}
