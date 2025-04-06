import { getQueryVariable } from '@/lib/spCoin/coreUtils'
import { getWagmiBalanceOfRec } from '@/lib/wagmi/getWagmiBalanceOfRec'
import { getURLParams } from "@/lib/getURLParams";

export async function GET(req: Request) {
  const params = getURLParams(req.url);
  const tokenAddress = getQueryVariable(params, "tokenAddress")

  const wagmiBalance = await getWagmiBalanceOfRec(tokenAddress)
  return new Response(JSON.stringify(wagmiBalance))
}
