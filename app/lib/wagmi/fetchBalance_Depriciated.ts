const { ethers } = require("ethers");
import { wagmiConfig } from './wagmiConfig'
import { Address } from "viem";
import { TokenElement } from '../structure/types';
import { getBalance } from '@wagmi/core'

async function fetchBigIntBalance (walletAddr:string|Address|undefined, tokenAddr:string|Address|undefined, chainId:number|string) {
  // if (walletAddr === undefined || tokenAddr === undefined || chainId === undefined) {
  //   const retResponse = {
  //     decimals: 0,
  //     formatted: "N/A",
  //     symbol: "N/A'",
  //     value: "N/A"
  //   }
  //   return retResponse
  // }

  let jsonRequest:any = {}
  // jsonRequest.address = typeof walletAddr === 'string' ? ethers.getAddress(walletAddr) : walletAddr
  // jsonRequest.token   = typeof tokenAddr  === 'string' ? ethers.getAddress(tokenAddr) : tokenAddr
  jsonRequest.address = ethers.getAddress("" + walletAddr)
  jsonRequest.token   = ethers.getAddress("" + tokenAddr)
  jsonRequest.chainId = typeof chainId    === 'number' ? chainId : parseInt(chainId)

  // console.debug("fetchBigIntBalance:jsonRequest = " + JSON.stringify(jsonRequest, null, 2))
  const res = await getBalance(wagmiConfig, jsonRequest)
  return res
}

async function getWagmiBalanceOfRec (walletAddr:string|Address|undefined, tokenAddr:string|Address|undefined, chainId:number|string) {

  let retResponse
  try {
    const res = await fetchBigIntBalance(walletAddr, tokenAddr, chainId)
    retResponse = {
      decimals: res.decimals,
      formatted: res.formatted,
      symbol: res.symbol,
      value: res.value.toString()
    }
  }
  catch (e) {
    let errorMsg = `***ERROR: fetchBigIntBalance(${walletAddr}, ${tokenAddr}, ${chainId})\n`+ JSON.stringify(e);
    // alert (errorMsg)
    console.error(errorMsg)
    throw e
  }

  return retResponse
}

export { fetchBigIntBalance, getWagmiBalanceOfRec }