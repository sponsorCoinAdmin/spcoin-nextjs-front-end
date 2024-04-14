import { wagmiConfig } from './wagmiConfig'
import { Address, getAddress } from "viem";
import { formatUnits } from 'viem' 
import { getBalance } from '@wagmi/core'

const getWagmiBalanceOfRec = async(tokenAddr:Address|string|undefined) => {
  if (tokenAddr === undefined) {
    throw `ERROR: getWagmiBalanceOfRec(tokenAddr:Address = ${tokenAddr})`
  }

  const resp = await getBalance(wagmiConfig, {
    address: getAddress(tokenAddr), 
  })

  const retResponse = {
    decimals: resp.decimals,
    formatted: formatUnits(resp.value, resp.decimals),
    symbol: resp.symbol,
    value: resp.value.toString()
  }
  // alert(`getWagmiBalanceOfRec:wagmiConfig:\n${JSON.stringify(wagmiConfig,null,2)}`)
  console.debug(`getWagmiBalanceOfRec:wagmiConfig:\n${JSON.stringify(wagmiConfig,null,2)}`)

  return retResponse
}

export { getWagmiBalanceOfRec }
