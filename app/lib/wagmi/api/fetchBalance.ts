const { ethers } = require("ethers");
import { fetchBalance } from '@wagmi/core'
import { setWagmiConfig } from '../config'
import { Address } from "wagmi";

setWagmiConfig();

async function fetchBigIntBalance (walletAddr:string|Address|undefined, tokenAddr:string|Address|undefined, chainId:number|string) {
  console.debug("=== fetchBigIntBalance =============================================================")

  if (walletAddr === undefined || tokenAddr === undefined || chainId === undefined) {
    const retResponse = {
      decimals: 0,
      formatted: "N/A",
      symbol: "N/A'",
      value: "N/A"
    }
    return retResponse
  }

  let jsonRequest:any = {}
  jsonRequest.address = typeof walletAddr    === 'string' ? ethers.getAddress(walletAddr) : walletAddr
  jsonRequest.token   = typeof tokenAddr   === 'string' ? ethers.getAddress(tokenAddr) : tokenAddr
  jsonRequest.chainId = typeof chainId === 'number' ? chainId : parseInt(chainId)

  console.debug("jsonRequest = " + JSON.stringify(jsonRequest, null, 2))
  const res = await fetchBalance(jsonRequest)
  console.debug("=== fetchBigIntBalance =============================================================")
  return res
}

async function fetchStringBalance (walletAddr:string|Address|undefined, tokenAddr:string|Address|undefined, chainId:number|string) {

  console.debug("=== fetchStringBalance =============================================================")
  const res = await fetchBigIntBalance(walletAddr, tokenAddr, chainId)
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