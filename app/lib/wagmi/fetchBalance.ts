import { wagmiConfig } from './wagmiConfig'
import { Address, getAddress } from "viem";
import { formatUnits } from 'viem' 
import { getBalance } from '@wagmi/core'

async function getWagmiBalanceOfRec (tokenAddr:Address|string|undefined) {
  if (tokenAddr === undefined) {
    throw `ERROR: getWagmiBalanceOfRec(tokenAddr:Address = ${tokenAddr})`
  }

  const addr:Address = getAddress(tokenAddr)
  const resp = await getBalance(wagmiConfig, {
    address: addr, 
  })

  const retResponse = {
    decimals: resp.decimals,
    formatted: formatUnits(resp.value, resp.decimals),
    symbol: resp.symbol,
    value: resp.value.toString()
  }
  return retResponse
}

export { getWagmiBalanceOfRec }
