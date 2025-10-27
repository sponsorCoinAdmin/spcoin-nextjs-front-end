import type { Address} from 'viem';
import { getAddress, formatUnits , erc20Abi } from 'viem'
import { getBalance, readContract } from '@wagmi/core'

import { wagmiServerConfig } from './wagmiServerConfig' // ✅ Server-safe config

/**
 * Reads native token balance (like ETH or MATIC) using wagmi/core getBalance.
 */
const getWagmiBalanceOfRec = async (
  tokenAddr: Address | string | undefined
) => {
  if (!tokenAddr) {
    throw new Error(`ERROR: getWagmiBalanceOfRec(tokenAddr) is undefined`)
  }

  const resp = await getBalance(wagmiServerConfig, {
    address: getAddress(tokenAddr),
  })

  return {
    tokenAddr,
    decimals: resp.decimals,
    formatted: formatUnits(resp.value, resp.decimals),
    symbol: resp.symbol,
    value: resp.value.toString(),
  }
}

/**
 * Reads ERC-20 token balance using wagmi/core readContract.
 */
const readContractBalanceOf = async (
  contractAddress: Address | string,
  walletAddress: Address | string
) => {
  const result = await readContract(wagmiServerConfig, {
    abi: erc20Abi,
    address: getAddress(contractAddress),
    functionName: 'balanceOf',
    args: [getAddress(walletAddress)],
  })

  return result as bigint
}

export { getWagmiBalanceOfRec, readContractBalanceOf }
