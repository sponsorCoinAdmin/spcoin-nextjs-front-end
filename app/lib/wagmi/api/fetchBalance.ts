const { ethers } = require("ethers");
import { fetchBalance } from '@wagmi/core'
import { setWagmiConfig } from '../config'
import { Address } from "wagmi";

setWagmiConfig();

async function fetchBigIntBalance (walletAddr:string|Address|undefined, tokenAddr:string|Address|undefined, chainId:number|string) {
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
  // jsonRequest.address = typeof walletAddr === 'string' ? ethers.getAddress(walletAddr) : walletAddr
  // jsonRequest.token   = typeof tokenAddr  === 'string' ? ethers.getAddress(tokenAddr) : tokenAddr
  jsonRequest.address = ethers.getAddress("" + walletAddr)
  jsonRequest.token   = ethers.getAddress("" + tokenAddr)
  jsonRequest.chainId = typeof chainId    === 'number' ? chainId : parseInt(chainId)

  // console.debug("fetchBigIntBalance:jsonRequest = " + JSON.stringify(jsonRequest, null, 2))
  const res = await fetchBalance(jsonRequest)
  return res
}

async function fetchStringBalance (walletAddr:string|Address|undefined, tokenAddr:string|Address|undefined, chainId:number|string) {

  const res = await fetchBigIntBalance(walletAddr, tokenAddr, chainId)
  const retResponse = {
    decimals: res.decimals,
    formatted: res.formatted,
    symbol: res.symbol,
    value: res.value.toString()
  }

  // console.debug("fetchStringBalance:retResponse = " + JSON.stringify(retResponse, null, 2))

  return retResponse
}

export { fetchBigIntBalance, fetchStringBalance }