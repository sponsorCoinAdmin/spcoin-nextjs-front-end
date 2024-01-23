const { ethers } = require("ethers");
import { fetchBalance } from '@wagmi/core'
import { setWagmiConfig } from '../config'
import { Address } from "wagmi";

setWagmiConfig();

async function fetchBigIntBalance (addr:string|Address|undefined, token:string|Address|undefined, chainId:number|string) {
  console.debug("=== fetchBigIntBalance =============================================================")

  let jsonRequest:any = {}
  jsonRequest.address = typeof addr    === 'string' ? ethers.getAddress(addr) : addr
  jsonRequest.token   = typeof token   === 'string' ? ethers.getAddress(token) : token
  jsonRequest.chainId = typeof chainId === 'number' ? chainId : parseInt(chainId)

  console.debug("jsonRequest = " + JSON.stringify(jsonRequest, null, 2))
  const res = await fetchBalance(jsonRequest)
  console.debug("=== fetchBigIntBalance =============================================================")
  return res
}

async function fetchStringBalance (addr:string|Address|undefined, token:string|Address|undefined, chainId:number|string) {

  console.debug("=== fetchStringBalance =============================================================")
  const res = await fetchBigIntBalance(addr, token, chainId)
  const retResponse = {
    decimals: res.decimals,
    formatted: res.formatted,
    symbol: res.symbol,
    value: res.value.toString()
  }

  console.debug("retResponse = " + JSON.stringify(retResponse, null, 2))
  console.debug("=== fetchStringBalance =============================================================")

  return retResponse
}

export { fetchBigIntBalance, fetchStringBalance }