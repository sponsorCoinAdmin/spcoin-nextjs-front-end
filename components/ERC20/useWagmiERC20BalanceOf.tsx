import { Address } from 'viem'
import { useFormattedClientBalanceOf, useERC20WagmiClientDecimals, useERC20WagmiClientBalanceOf } from '@/lib/wagmi/erc20WagmiClientRead'
import { BURN_ADDRESS } from '@/lib/network/utils'

const useWagmiERC20BalanceOf      = (ACTIVE_ACCOUNT_ADDRESS: Address  | string, TOKEN_CONTRACT_ADDRESS: Address | string) => {
  const balanceOf:bigint          = useERC20WagmiClientBalanceOf(ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS)
  const decimals                  = useERC20WagmiClientDecimals(TOKEN_CONTRACT_ADDRESS)
  const formattedBalanceOf:string = useFormattedClientBalanceOf(ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS)
  return { balanceOf, decimals, formattedBalanceOf }
}

export default useWagmiERC20BalanceOf
