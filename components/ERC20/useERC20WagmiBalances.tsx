import { Address } from 'viem'
import { useERC20WagmiTokenDecimals, useERC20WagmiTokenBalanceOf, formatDecimals } from '@/lib/wagmi/erc20WagmiClientRead'
import { useBalance } from 'wagmi'

const useERC20WagmiBalances = (ACTIVE_ACCOUNT_ADDRESS: Address | undefined, TOKEN_CONTRACT_ADDRESS: Address | undefined) => {
  const isNetworkCoin:boolean                    = ACTIVE_ACCOUNT_ADDRESS === TOKEN_CONTRACT_ADDRESS;
  const balanceOf:bigint|undefined               = useERC20WagmiTokenBalanceOf(ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS)
  const decimals:number|undefined                = useERC20WagmiTokenDecimals(TOKEN_CONTRACT_ADDRESS)
  const useBalanceNetworkObj                     = useBalance( { address: ACTIVE_ACCOUNT_ADDRESS} );
  const networkBalance:bigint|undefined          = useBalanceNetworkObj?.data?.value;
  const networkDecimals:number|undefined         = useBalanceNetworkObj?.data?.decimals;
  const formattedBalanceOf:string|undefined      = formatDecimals(balanceOf, decimals);
  const formattedNetWorkBalance:string|undefined = formatDecimals(networkBalance, networkDecimals);
  const balance:bigint|undefined                 = isNetworkCoin ? networkBalance : balanceOf;
  const formattedBalance:string|undefined        = isNetworkCoin ? formattedNetWorkBalance : formattedBalanceOf;
  return { balance, formattedBalance, networkBalance, formattedNetWorkBalance, balanceOf, formattedBalanceOf }
}

export default useERC20WagmiBalances
