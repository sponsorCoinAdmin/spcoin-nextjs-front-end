import { Address } from 'viem'
import { getERC20WagmiClientBalanceOfStr, getFormattedClientBalanceOf, getERC20WagmiClientDecimals, formatDecimals, getERC20WagmiClientBalanceOf } from '@/lib/wagmi/erc20WagmiClientRead'

const useWagmiEcr20BalanceOf      = (ACTIVE_ACCOUNT_ADDRESS: string | undefined, TOKEN_CONTRACT_ADDRESS: string | undefined) => {
  const balanceOf:bigint          = getERC20WagmiClientBalanceOf(ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS || "")
  const decimals                  = getERC20WagmiClientDecimals(TOKEN_CONTRACT_ADDRESS)
  const formattedBalanceOf:string = getFormattedClientBalanceOf(ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS || "")
  // console.debug(`ReadWagmiEcr20BalanceOf.decimals:TOKEN_CONTRACT_ADDRESS = ${TOKEN_CONTRACT_ADDRESS}`)
  return { balanceOf, decimals, formattedBalanceOf }
}

export default useWagmiEcr20BalanceOf

