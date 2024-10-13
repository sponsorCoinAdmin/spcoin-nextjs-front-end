import { Address } from 'viem'
import { useERC20WagmiTokenDecimals, useERC20WagmiTokenBalanceOf, formatDecimals } from '@/lib/wagmi/erc20WagmiClientRead'
import { useBalance } from 'wagmi'

const useERC20WagmiBalances = (ACTIVE_ACCOUNT_ADDRESS: Address | undefined, TOKEN_CONTRACT_ADDRESS: Address | undefined) => {
  const balanceOf:bigint|undefined               = useERC20WagmiTokenBalanceOf(ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS)
  const decimals:number|undefined                = useERC20WagmiTokenDecimals(TOKEN_CONTRACT_ADDRESS)
  const networkDecimals:number                   = 18; //WARNING: HARD CODED, write code to get the network decimals
  const networkBalance                           = useBalance( { address: ACTIVE_ACCOUNT_ADDRESS} );
  const formattedBalanceOf:string|undefined      = formatDecimals(balanceOf, decimals);
  const formattedNetWorkBalance:string|undefined = formatDecimals(balanceOf, networkDecimals);
  return { networkBalance, balanceOf, formattedNetWorkBalance, formattedBalanceOf }
}

export default useERC20WagmiBalances
