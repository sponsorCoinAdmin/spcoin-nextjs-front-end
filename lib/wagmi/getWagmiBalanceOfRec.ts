import { wagmiConfig } from './wagmiConfig'
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

  const resp = await getBalance(wagmiConfig, {
    address: getAddress(tokenAddr),
  })

  const retResponse = {
    tokenAddr: tokenAddr,
    decimals: resp.decimals,
    formatted: formatUnits(resp.value, resp.decimals),
    symbol: resp.symbol,
    value: resp.value.toString()
  }
  // alert(`getWagmiBalanceOfRec:wagmiConfig:\n${JSON.stringify(wagmiConfig,null,2)}`)
  // console.debug(`getWagmiBalanceOfRec:wagmiConfig:\n${JSON.stringify(wagmiConfig,null,2)}`)
  // console.debug(`getWagmiBalanceOfRec:resp:\n${JSON.stringify(resp,(key, value) => (typeof value === "bigint" ? value.toString() : value),2)}`)
  console.debug(`getWagmiBalanceOfRec:retResponse:\n${JSON.stringify(retResponse,null,2)}`)

  return retResponse
}

export { getWagmiBalanceOfRec, readContractBalanceOf }
