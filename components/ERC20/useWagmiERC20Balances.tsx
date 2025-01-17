import { Address } from 'viem'
import { useWagmiERC20TokenDecimals, useWagmiERC20TokenBalanceOf, formatDecimals } from '@/lib/wagmi/wagmiERC20ClientRead'
import { useAccount, useBalance } from 'wagmi'
import { isNetworkBurnAddress } from '@/lib/network/utils';

const useWagmiERC20Balances = (parent:string, TOKEN_CONTRACT_ADDRESS: Address | undefined) => {
  const ACTIVE_ACCOUNT_ADDRESS                   = useAccount().address;
  const useBalanceNetworkObj                     = useBalance( { address: ACTIVE_ACCOUNT_ADDRESS} );
  const isNetworkCoin:boolean                    = isNetworkBurnAddress(TOKEN_CONTRACT_ADDRESS);
  const networkBalance:bigint|undefined          = useBalanceNetworkObj?.data?.value;
  const networkDecimals:number|undefined         = useBalanceNetworkObj?.data?.decimals;
  const formattedNetworkBalance:string|undefined = formatDecimals(networkBalance, networkDecimals);
  const balanceOf:bigint|undefined               = useWagmiERC20TokenBalanceOf(ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS);
  const decimals:number|undefined                = useWagmiERC20TokenDecimals(TOKEN_CONTRACT_ADDRESS);
  const formattedBalanceOf:string|undefined      = formatDecimals(balanceOf, decimals);
  const balance:bigint|undefined                 = isNetworkCoin ? networkBalance : balanceOf;
  const formattedBalance:string|undefined        = isNetworkCoin ? formattedNetworkBalance : formattedBalanceOf;
  // console.debug(`${parent}:useWagmiERC20Balances = , ACTIVE_ACCOUNT_ADDRESS = ${ACTIVE_ACCOUNT_ADDRESS}`);
  // console.debug(`${parent}:useWagmiERC20Balances = , TOKEN_CONTRACT_ADDRESS = ${TOKEN_CONTRACT_ADDRESS}`);
  // console.debug(`useBalanceNetworkObj                          = ${stringifyBigInt(useBalanceNetworkObj)}`);
  // console.debug(`useWagmiERC20Balances:isNetworkCoin           = ${isNetworkCoin}`);
  // console.debug(`useWagmiERC20Balances:networkBalance          = ${networkBalance}`);
  // console.debug(`useWagmiERC20Balances:networkDecimals         = ${networkDecimals}`);
  // console.debug(`useWagmiERC20Balances:formattedNetworkBalance = ${formattedNetworkBalance}`);
  // console.debug(`useWagmiERC20Balances:balanceOf               = ${balanceOf}`);
  // console.debug(`useWagmiERC20Balances:decimals                = ${decimals}`);
  // console.debug(`useWagmiERC20Balances:formattedBalanceOf      = ${formattedBalanceOf}`);
  // console.debug(`useWagmiERC20Balances:balance                 = ${balance}`);
  // console.debug(`useWagmiERC20Balances:formattedBalance        = ${formattedBalance}`);
  return { balance, formattedBalance, networkBalance, formattedNetworkBalance, balanceOf, formattedBalanceOf }
}

export default useWagmiERC20Balances
