import { Address } from 'viem'
import { useERC20WagmiTokenDecimals, useERC20WagmiTokenBalanceOf, formatDecimals } from '@/lib/wagmi/wagmiERC20ClientRead'
import { useAccount, useBalance } from 'wagmi'
import { isNetworkBurnAddress } from '@/lib/network/utils';

const useERC20WagmiBalances = (parent:string, TOKEN_CONTRACT_ADDRESS: Address | undefined) => {
  // console.debug(`${parent}:useERC20WagmiBalances = , TOKEN_CONTRACT_ADDRESS = ${TOKEN_CONTRACT_ADDRESS}`);
  const ACTIVE_ACCOUNT_ADDRESS                   = useAccount().address;
  const useBalanceNetworkObj                     = useBalance( { address: ACTIVE_ACCOUNT_ADDRESS} );
  const isNetworkCoin:boolean                    = isNetworkBurnAddress(TOKEN_CONTRACT_ADDRESS);
  const networkBalance:bigint|undefined          = useBalanceNetworkObj?.data?.value;
  const networkDecimals:number|undefined         = useBalanceNetworkObj?.data?.decimals;
  const formattedNetworkBalance:string|undefined = formatDecimals(networkBalance, networkDecimals);
  const balanceOf:bigint|undefined               = useERC20WagmiTokenBalanceOf(ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS);
  const decimals:number|undefined                = useERC20WagmiTokenDecimals(TOKEN_CONTRACT_ADDRESS);
  const formattedBalanceOf:string|undefined      = formatDecimals(balanceOf, decimals);
  const balance:bigint|undefined                 = isNetworkCoin ? networkBalance : balanceOf;
  const formattedBalance:string|undefined        = isNetworkCoin ? formattedNetworkBalance : formattedBalanceOf;
  // console.debug(`useERC20WagmiBalances:isNetworkCoin           = ${isNetworkCoin}`);
  // console.debug(`useERC20WagmiBalances:networkBalance          = ${networkBalance}`);
  // console.debug(`useERC20WagmiBalances:networkDecimals         = ${networkDecimals}`);
  // console.debug(`useERC20WagmiBalances:formattedNetworkBalance = ${formattedNetworkBalance}`);
  // console.debug(`useERC20WagmiBalances:balanceOf               = ${balanceOf}`);
  // console.debug(`useERC20WagmiBalances:decimals                = ${decimals}`);
  // console.debug(`useERC20WagmiBalances:formattedBalanceOf      = ${formattedBalanceOf}`);
  // console.debug(`useERC20WagmiBalances:balance                 = ${balance}`);
  // console.debug(`useERC20WagmiBalances:formattedBalance        = ${formattedBalance}`);
  return { balance, formattedBalance, networkBalance, formattedNetworkBalance, balanceOf, formattedBalanceOf }
}

export default useERC20WagmiBalances
