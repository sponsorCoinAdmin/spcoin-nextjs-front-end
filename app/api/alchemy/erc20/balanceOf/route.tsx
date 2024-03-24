import { getURLParams } from "@/app/api/lib/getURLParams";
import { getQueryVariable } from "@/app/lib/spCoin/utils";
import { fetchStringBalance } from "@/app/lib/wagmi/fetchBalance";

export async function GET(req: Request) {
  const params = getURLParams(req.url);
  const address  = getQueryVariable(params, "walletAddress")
  const token    = getQueryVariable(params, "tokenAddress")
  const chainId  = getQueryVariable(params, "chainId")

  const wagmiBalance = await fetchStringBalance(address, token, chainId)

  console.log(`wagmiBalance+${JSON.stringify(wagmiBalance)}`)
  return new Response(JSON.stringify(wagmiBalance))
}
