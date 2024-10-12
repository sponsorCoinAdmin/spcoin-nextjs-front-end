import { Address } from 'viem'
import { useFormattedClientBalanceOf, useERC20WagmiClientDecimals, useERC20WagmiClientBalanceOf } from '@/lib/wagmi/erc20WagmiClientRead'

const useWagmiERC20BalanceOf      = (ACTIVE_ACCOUNT_ADDRESS: Address | undefined, TOKEN_CONTRACT_ADDRESS: Address | undefined) => {
  const balanceOf:bigint          = useERC20WagmiClientBalanceOf(ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS)
  const decimals                  = useERC20WagmiClientDecimals(TOKEN_CONTRACT_ADDRESS)
  const formattedBalanceOf:string = useFormattedClientBalanceOf(ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS)
  return { balanceOf, decimals, formattedBalanceOf }
}

export default useWagmiERC20BalanceOf
