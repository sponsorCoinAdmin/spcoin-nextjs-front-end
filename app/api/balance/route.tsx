import { 
  createConfig,
  configureChains,
  fetchBalance 
} from '@wagmi/core'

import { publicProvider } from '@wagmi/core/providers/public'
import { mainnet, polygon, sepolia } from '@wagmi/chains'

const { publicClient, webSocketPublicClient } = configureChains(
  [mainnet, polygon, sepolia],
  [publicProvider()],
)
 
const config = createConfig({
  publicClient,
  webSocketPublicClient,
})





export async function GET (req: Request) {
  const url=req.url;

  const urlPart = url.split("?");
  const params = urlPart[1];

  console.log("====================================================================================================")
  console.log("PRICE REQUEST URL = " + url)
  console.log("====================================================================================================")

  const jsonRequest = {
    address: '0xFAbed8e2f3a29aEE5002087F1140Ef4C6ACa25B4', // LEDGER 1
    token: '0x6982508145454Ce325dDbE47a25d4ec3d2311933', // PEPE
    chainId: 1, // MainNet
  }

  const balance = await fetchBalance({
    address: '0xFAbed8e2f3a29aEE5002087F1140Ef4C6ACa25B4', // LEDGER 1
    token: '0x6982508145454Ce325dDbE47a25d4ec3d2311933', // PEPE
    chainId: 1, // MainNet
  })
  console.log("mainnet           : " + JSON.stringify(mainnet, null, 2))
  console.log("polygon           : " + JSON.stringify(polygon, null, 2))
  console.log("sepolia           : " + JSON.stringify(sepolia, null, 2))
  console.log("balance.decimals  : " + balance.decimals)
  console.log("balance.formatted : " + balance.formatted)
  console.log("balance.symbol    : " + balance.symbol)
  console.log("balance.value     : " + balance.value)

  const ret = {
    decimals: balance.decimals,
    formatted: balance.formatted,
    symbol: balance.symbol,
    value: balance.value.toString()
  }

  return new Response(JSON.stringify(ret))
}