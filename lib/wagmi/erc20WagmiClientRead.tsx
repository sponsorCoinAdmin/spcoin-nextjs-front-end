'use client'

import { useChainId, useReadContract } from 'wagmi'
import { config } from '@/lib/wagmi/wagmiConfig'
import { Address, formatUnits, getAddress } from 'viem'
import { erc20Abi } from 'viem'
import { TokenContract, ContractRecs } from '../structure/types'
import { BURN_ADDRESS } from '@/lib/network/utils';
import { useEffect, useState } from 'react'

const useERC20WagmiClientBalanceOfRec = (connectedWalletAddr: Address | string | undefined, contractAddress: Address | string | undefined) => {
  console.debug(`useERC20WagmiClientBalanceOfRec:connectedWalletAddr = ${connectedWalletAddr}, contractAddress = ${contractAddress}`)
  let wagmiBalanceOfRec;
  wagmiBalanceOfRec = useReadContract({
    abi: erc20Abi,
    address: getAddress(contractAddress || BURN_ADDRESS),
    functionName: 'balanceOf',
    args: [getAddress(connectedWalletAddr || BURN_ADDRESS)],
    config, 
  })
  // console.debug(`useERC20WagmiClientBalanceOfRec.wagmiBalanceOfRec = ${JSON.stringify(wagmiBalanceOfRec, (_, v) => typeof v === 'bigint' ? v.toString() : v,2)}`)
  return wagmiBalanceOfRec;
}

const useERC20WagmiClientDecimalRec = (contractAddress:Address | string | undefined) => {
  // alert(`useERC20WagmiClientDecimalRec:contractAddress = ${contractAddress}`)
  let wagmiDecimalsRec
  wagmiDecimalsRec = useReadContract({
    abi: erc20Abi,
    address: getAddress(contractAddress || BURN_ADDRESS),
    functionName: 'decimals',
    config, 
  })
  // alert(`useERC20WagmiClientDecimalRec:wagmiDecimalsRec = ${JSON.stringify(wagmiDecimalsRec, null, 2)}`)
  return wagmiDecimalsRec;
}

const useERC20WagmiClientNameRec = (contractAddress:Address | undefined) => {
  let wagmiNameRec = useReadContract({
    abi: erc20Abi,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'name',
    config, 
  })
  return wagmiNameRec;
}

const useERC20WagmiClientSymbolRec = (contractAddress:Address | undefined) => {
  let wagmiSymbolRec = useReadContract({
    abi: erc20Abi,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'symbol',
    config, 
  })
  return wagmiSymbolRec;
}

const useERC20WagmiClientTotalSupplyRec = (contractAddress:Address | undefined) => {
  let wagmiTotalSupplyRec = useReadContract({
    abi: erc20Abi,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'totalSupply',
    config, 
  })
  // console.debug("QQQQQ :\n"+JSON.stringify(wagmiTotalSupplyRec, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2))
  return wagmiTotalSupplyRec;
}

const getERC20WagmiClientRecords = (contractAddress:Address | undefined) => {
  let contractRecs:ContractRecs = {
    nameRec:useERC20WagmiClientNameRec(contractAddress),
    symbolRec:useERC20WagmiClientSymbolRec(contractAddress),
    decimalRec:useERC20WagmiClientDecimalRec(contractAddress),
    totalSupplyRec:useERC20WagmiClientTotalSupplyRec(contractAddress)
  }
  return contractRecs
}

////////////////////////////////////////////////////////////////////////////
const useERC20WagmiClientDecimals = (contractAddress:Address | string | undefined) => {
  return useERC20WagmiClientDecimalRec(contractAddress)?.data;
}

const useERC20WagmiClientName = (contractAddress:Address | undefined) => {
  return useERC20WagmiClientNameRec(contractAddress).data;
}

const useERC20WagmiClientSymbol = (contractAddress:Address | undefined) => {
  return useERC20WagmiClientSymbolRec(contractAddress).data;
}

const useERC20WagmiClientTotalSupply = (contractAddress:Address | undefined) => {
  return useERC20WagmiClientTotalSupplyRec(contractAddress).data;
}

const useERC20WagmiClientBalanceOf = (connectedWalletAddr: Address | string | undefined, contractAddress: Address | string | undefined) => {
  let eRC20WagmiClientBalanceOf:any = "0";
  try {
    if (connectedWalletAddr && contractAddress) {
      console.debug(`EXECUTING:eRC20WagmiClientBalanceOf(${connectedWalletAddr} , ${contractAddress})`);
      eRC20WagmiClientBalanceOf = useERC20WagmiClientBalanceOfRec(connectedWalletAddr , contractAddress )?.data?.toString();
      console.debug(`EXECUTED 2:eRC20WagmiClientBalanceOf(${connectedWalletAddr} , ${contractAddress}) = ${eRC20WagmiClientBalanceOf}`);
    }
  }
  catch (err:any) {
    console.debug(`ERROR:eRC20WagmiClientBalanceOf(${connectedWalletAddr} , ${contractAddress}) = ${eRC20WagmiClientBalanceOf}`);
    console.debug(`ERROR:eRC20WagmiClientBalanceOf:err.msg = ${err.msg}`);
  }
  return eRC20WagmiClientBalanceOf;
}

const getErc20ClientContract = (contractAddress:Address | undefined) => {
  let contractResponse:TokenContract =
  {
    address:contractAddress,
    chainId: useChainId(),
    name:useERC20WagmiClientName(contractAddress),
    symbol:useERC20WagmiClientSymbol(contractAddress),
    decimals:useERC20WagmiClientDecimals(contractAddress),
    totalSupply:useERC20WagmiClientTotalSupply(contractAddress),
    img:undefined
  }
  return contractResponse
}

const formatDecimals = (val: bigint | number | string | undefined, decimals:number|undefined) => {
  let bigInt = (val === undefined) ? BigInt(0) : BigInt(val)
  return (decimals !== undefined) ? formatUnits(bigInt, decimals) : bigInt.toString()
}

const getFormattedClientTotalSupply = (contractAddress:Address | undefined) => {
  let totalSupply = useERC20WagmiClientTotalSupply(contractAddress)
  let decimals  = useERC20WagmiClientDecimals(contractAddress)
  return formatDecimals(totalSupply, decimals);
}

const useFormattedClientBalanceOf = (connectedWalletAddr: Address | string | undefined, contractAddress: Address | string | undefined ) => {

  const [formattedDecimals, setFormattedDecimals] = useState<string>("0");

  // if (connectedWalletAddr && contractAddress) {
    const balanceOf = useERC20WagmiClientBalanceOf(connectedWalletAddr, contractAddress)
    const decimals  = useERC20WagmiClientDecimals(contractAddress)
  // }

  useEffect(() => {
    if(balanceOf && decimals) {
      // alert(` setFormattedDecimals(formatDecimals(${balanceOf}, ${decimals}));`)
      setFormattedDecimals(formatDecimals(balanceOf, decimals));
    }
  }, [balanceOf, decimals])

  return formattedDecimals;
}

export {
  type TokenContract,
  type ContractRecs,
  useERC20WagmiClientBalanceOfRec, 
  useERC20WagmiClientDecimalRec,
  useERC20WagmiClientNameRec, 
  useERC20WagmiClientSymbolRec, 
  useERC20WagmiClientTotalSupplyRec,
  getERC20WagmiClientRecords,
  useERC20WagmiClientBalanceOf, 
  useERC20WagmiClientDecimals,
  useERC20WagmiClientName, 
  useERC20WagmiClientSymbol, 
  useERC20WagmiClientTotalSupply,
  getErc20ClientContract,
  formatDecimals,
  getFormattedClientTotalSupply,
  useFormattedClientBalanceOf
}
