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


function getQueryVariable(_urlParams:string, _searchParam:string)
{
  console.debug("Searching " + _searchParam + " in _urlParams " + _urlParams)
   var vars = _urlParams.split("&");
   for (var i=0; i<vars.length; i++) {
           var pair = vars[i].split("=");
           if(pair[0] == _searchParam){
            console.debug("FOUND Search Param " + _searchParam + ": " + pair[1])
            return pair[1];
          }
   }
   console.debug("*** ERROR *** Search Param " + _searchParam + " Not Found")

   return null;
}

export async function GET (req: Request) {
  const url=req.url;

  const urlPart = url.split("?");
  const params = urlPart[1];

  console.debug("====================================================================================================")
  console.debug("PRICE REQUEST URL = " + url)

  let walletAddress = getQueryVariable(params, "walletAddress")
  let tokenAddress  = getQueryVariable(params, "tokenAddress")
  let chainId       = getQueryVariable(params, "chainId")
  console.debug("====================================================================================================")

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
  // console.debug("mainnet           : " + JSON.stringify(mainnet, null, 2))
  // console.debug("polygon           : " + JSON.stringify(polygon, null, 2))
  // console.debug("sepolia           : " + JSON.stringify(sepolia, null, 2))
  // console.debug("balance.decimals  : " + balance.decimals)
  // console.debug("balance.formatted : " + balance.formatted)
  // console.debug("balance.symbol    : " + balance.symbol)
  // console.debug("balance.value     : " + balance.value)

  const ret = {
    decimals: balance.decimals,
    formatted: balance.formatted,
    symbol: balance.symbol,
    value: balance.value.toString()
  }

  return new Response(JSON.stringify(ret))
}