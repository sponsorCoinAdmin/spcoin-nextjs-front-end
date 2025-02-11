import { Address } from 'viem'
import { useWagmiERC20TokenDecimals, useWagmiERC20TokenBalanceOf, formatDecimals } from '@/lib/wagmi/wagmiERC20ClientRead'
import { useAccount, useBalance } from 'wagmi'
import { isActiveAccountAddress } from '@/lib/network/utils';
import { config } from '@/lib/wagmi/wagmiConfig'
import { getBalance } from '@wagmi/core'
import { useEffect } from 'react';
import { exchangeContext } from "@/lib/context";
import { stringifyBigInt } from '@/lib/spCoin/utils';

const useWagmiERC20Balances = (parent:string, TOKEN_CONTRACT_ADDRESS: Address | undefined) => {
  const ACTIVE_ACCOUNT_ADDRESS                   = useAccount().address;
  const useBalanceNetworkObj                     = useBalance( { address: ACTIVE_ACCOUNT_ADDRESS } );
  const isNetworkCoin:boolean                    = isActiveAccountAddress(TOKEN_CONTRACT_ADDRESS);
  const networkBalance:bigint|undefined          = useBalanceNetworkObj?.data?.value;
  const networkDecimals:number|undefined         = useBalanceNetworkObj?.data?.decimals;
  const formattedNetworkBalance:string|undefined = formatDecimals(networkBalance, networkDecimals);
  const balanceOf:bigint|undefined               = useWagmiERC20TokenBalanceOf(ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS);
  const decimals:number|undefined                = useWagmiERC20TokenDecimals(TOKEN_CONTRACT_ADDRESS);
  const formattedBalanceOf:string|undefined      = formatDecimals(balanceOf, decimals);
  const balance:bigint|undefined                 = isNetworkCoin ? networkBalance : balanceOf;
  const formattedBalance:string|undefined        = isNetworkCoin ? formattedNetworkBalance : formattedBalanceOf;
  
  // decimals = networkDecimals

  //////////////////////////////////////////////////////////////////////////////////////////////////////////
  // const signer = exchangeContext.tradeData.signer
  // const provider = signer?.provider
  // let balanceInWei:any = 0n;

  // const getBalanceInWei = async (address: any) => {
  //   balanceInWei = await provider?.getBalance(TOKEN_CONTRACT_ADDRESS);
  //   return balanceInWei
  // }
  
  // useEffect(() =>  {
  //   if (balanceInWei)
  //     alert(`Address: ${TOKEN_CONTRACT_ADDRESS} => balanceInWei: ${stringifyBigInt(balanceInWei)}`)
  // }, [balanceInWei]);

  // useEffect(() =>  {
  //   if (TOKEN_CONTRACT_ADDRESS)
  //      balanceInWei = getBalanceInWei(TOKEN_CONTRACT_ADDRESS);
  // }, [TOKEN_CONTRACT_ADDRESS, amount]);

  //////////////////////////////////////////////////////////////////////////////////////////////////////////



  

  // if (gBalance)
  //   alert(`TOKEN_CONTRACT_ADDRESS gBalance = ${stringifyBigInt(gBalance)}\n formattedNetworkBalance = ${formattedNetworkBalance}`)

  // useEffect(() => {  // JUNK TESTING REMOVE LATER
  //       alert(`useWagmiERC20Balances setting networkBalance to: ${networkBalance} FormattedBalance to: ${formattedBalance}`);
  //   }, [useBalanceNetworkObj])
    
  console.debug(`${parent}:useWagmiERC20Balances = , ACTIVE_ACCOUNT_ADDRESS = ${ACTIVE_ACCOUNT_ADDRESS}`);
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
  return { balance, networkDecimals, decimals, formattedBalance, networkBalance, formattedNetworkBalance, balanceOf, formattedBalanceOf }
}

export default useWagmiERC20Balances
