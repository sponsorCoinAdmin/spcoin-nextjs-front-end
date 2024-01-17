const { ethers } = require("ethers");
import { fetchBalance } from '@wagmi/core'
import { getQueryVariable } from '../../lib/utils'
import { setWagmiConfig } from '../../lib/wagmi/config'

setWagmiConfig();

export async function GET (req: Request) {
  const url=req.url;

  const urlPart = url.split("?");
  const params = urlPart[1];

  console.debug("====================================================================================================")
  console.debug("PRICE REQUEST URL = " + url)

  let jsonRequest:any = {}
  jsonRequest.address = ethers.getAddress(getQueryVariable(params, "walletAddress"))
  jsonRequest.token   = ethers.getAddress(getQueryVariable(params, "tokenAddress"))
  jsonRequest.chainId = parseInt(getQueryVariable(params, "chainId"))
  console.debug("====================================================================================================")

  console.log(JSON.stringify(jsonRequest,null,2))
  const res = await fetchBalance(jsonRequest)
  console.log(JSON.stringify(jsonRequest,null,2))

  // console.debug("res.decimals  : " + res.decimals)
  // console.debug("res.formatted : " + res.formatted)
  // console.debug("res.symbol    : " + res.symbol)
  // console.debug("res.value     : " + res.value)

  const ret = {
    decimals: res.decimals,
    formatted: res.formatted,
    symbol: res.symbol,
    value: res.value.toString()
  }

  return new Response(JSON.stringify(ret))
}