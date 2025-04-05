import { readContract } from '@wagmi/core'
// ❗️ Make sure this is your Wagmi client config, not next/config!
import { config } from './wagmiConfig'

import { erc20Abi, getAddress, Address } from 'viem'
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils'

// ✅ This function reads an ERC20 balance using Wagmi v2 `readContract`
const getERC20WagmiServerBalanceOfRec = async (
  walletAddress: Address | string | undefined,
  contractAddress: Address | string | undefined
): Promise<bigint | null> => {
  // console.debug(`getServerERC20WagmiBalanceOfRec:walletAddress = ${walletAddress}, contractAddress = ${contractAddress}`)
  
  if (contractAddress !== undefined && walletAddress !== undefined) {
    try {
      // ✅ Wagmi v2 format: readContract(config, parameters)
      const wagmiBalanceOfRec = await readContract(config, {
        address: getAddress(contractAddress.toString()),
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [getAddress(walletAddress.toString())],
      })

      // ✅ Return the raw bigint balance
      return wagmiBalanceOfRec as bigint
    } catch (err) {
      console.error('readContract failed:', err)
      return null
    }
  }

  return null
}

// ✅ Test Constants
const ACTIVE_ACCOUNT_ADDRESS: Address = '0x858BDEe77B06F29A3113755F14Be4B23EE6D6e59'
const USDT_POLYGON_CONTRACT: Address = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
const CHKN_ETHEREUM_CONTRACT: Address = '0xD55210Bb6898C021a19de1F58d27b71f095921Ee'
const TOKEN_CONTRACT_ADDRESS: Address = USDT_POLYGON_CONTRACT

// ✅ This function demonstrates how to use the above helper
export const getTestName = async () => {
  console.log(`getTestName = ${getTestName}`)

  const balanceOf = await getERC20WagmiServerBalanceOfRec(
    ACTIVE_ACCOUNT_ADDRESS,
    TOKEN_CONTRACT_ADDRESS
  )

  // ✅ Output stringified bigint or a fallback message
  return balanceOf !== null
    ? `balanceOf = ${stringifyBigInt(balanceOf)}`
    : 'Failed to fetch balance'
}
