import { getQueryVariable } from '@/lib/spCoin/utils'
import { getURLParams } from "@/lib/getURLParams";
import { getWagmiBalanceOfRec } from '@/lib/wagmi/getWagmiBalanceOfRec';

export async function GET(req: Request) {
  const params = getURLParams(req.url);
  const tokenAddress    = getQueryVariable(params, "tokenAddress")

  const wagmiBalance = await getWagmiBalanceOfRec(tokenAddress)
  return new Response(JSON.stringify(wagmiBalance))
}
