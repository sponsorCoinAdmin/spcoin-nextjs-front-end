import { getURLParams } from "@/lib/getURLParams";
import { getQueryVariable } from "@/lib/spCoin/utils";
import { getWagmiBalanceOfRec } from "@/app/lib/wagmi/getWagmiBalanceOfRec";

export async function GET(req: Request) {
  const params = getURLParams(req.url);
  const tokenAddress    = getQueryVariable(params, "tokenAddress")

  const wagmiBalance = await getWagmiBalanceOfRec(tokenAddress)
  console.log("BalanceOf = "+wagmiBalance)
  return new Response(JSON.stringify(wagmiBalance))
}
