import { config } from './wagmiConfig'
import { Address, getAddress } from "viem";
import { formatUnits } from 'viem' 
import { getBalance } from '@wagmi/core'
import { useReadContract } from 'wagmi'
import { erc20Abi} from 'viem' 

function readContractBalanceOf(contractAddress:Address|string) {
  const result = useReadContract({
    abi: erc20Abi,
    address: '0x${contractAddress.toString()}',
    functionName: 'balanceOf',
  })
  alert(`result = ${JSON.stringify(result,null,2)}`)
  return result;
}

const getWagmiBalanceOfRec = async(tokenAddr:Address|string|undefined) => {
  if (tokenAddr === undefined) {
    throw `ERROR: getWagmiBalanceOfRec(tokenAddr:Address = ${tokenAddr})`
  }

  console.debug(`BEFORE: getWagmiBalanceOfRec:tokenAddr = :\n${JSON.stringify(tokenAddr,null,2)}`)

  const resp = await getBalance(config, {
    address: getAddress(tokenAddr),
  })

  const retResponse = {
    tokenAddr: tokenAddr,
    decimals: resp.decimals,
    formatted: formatUnits(resp.value, resp.decimals),
    symbol: resp.symbol,
    value: resp.value.toString()
  }
  // alert(`getWagmiBalanceOfRec:config:\n${JSON.stringify(config,null,2)}`)
  // console.debug(`getWagmiBalanceOfRec:config:\n${JSON.stringify(config,null,2)}`)
  // console.debug(`getWagmiBalanceOfRec:resp:\n${JSON.stringify(resp,(key, value) => (typeof value === "bigint" ? value.toString() : value),2)}`)
  console.debug(`AFTER: getWagmiBalanceOfRec:retResponse:\n${JSON.stringify(retResponse,null,2)}`)

  return retResponse
}

export { getWagmiBalanceOfRec, readContractBalanceOf }
