'use client'

import { useBalance, useChainId, useReadContract } from 'wagmi'
import { config } from '@/lib/wagmi/wagmiConfig'
import { Address, formatUnits } from 'viem'
import { erc20ABI } from '@/resources/data/ABIs/erc20ABI'
import { TokenContract, ContractRecs } from '@/lib/structure/types'
import { BURN_ADDRESS, getBlockChainName } from '@/lib/network/utils';

const useWagmiERC20TokenBalanceOfRec = (connectedAccountAddr: Address | undefined, contractAddress: Address | undefined) => {
  console.debug(`useWagmiERC20TokenBalanceOfRec:connectedAccountAddr = ${connectedAccountAddr}, contractAddress = ${contractAddress}`)
  const wagmiBalanceOfRec = useReadContract({
    abi: erc20ABI,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'balanceOf',
    args: [connectedAccountAddr || BURN_ADDRESS],
    config: config, 
  })

  // console.debug(`useWagmiERC20TokenBalanceOfRec.wagmiBalanceOfRec = ${stringifyBigInt(wagmiBalanceOfRec)}`)
  return wagmiBalanceOfRec;
}

const useWagmiERC20TokenDecimalRec = (contractAddress:Address | undefined) => {
  const wagmiDecimalsRec = useReadContract({
    abi: erc20ABI,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'decimals',
    config: config, 
  })
  return wagmiDecimalsRec;
}

const useWagmiERC20TokenNameRec = (contractAddress:Address | undefined) => {
  const wagmiNameRec = useReadContract({
    abi: erc20ABI,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'name',
    config: config, 
  })
  return wagmiNameRec;
}

const useWagmiERC20TokenSymbolRec = (contractAddress:Address | undefined) => {
  const wagmiSymbolRec = useReadContract({
    abi: erc20ABI,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'symbol',
    config: config, 
  })
  return wagmiSymbolRec;
}

const useWagmiERC20TokenTotalSupplyRec = (contractAddress:Address | undefined) => {
  const wagmiTotalSupplyRec = useReadContract({
    abi: erc20ABI,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'totalSupply',
    config: config, 
  })
  // console.debug("QQQQQ :\n"+stringifyBigInt(wagmiTotalSupplyRec))
  return wagmiTotalSupplyRec;
}

const useWagmiERC20TokenRecords = (contractAddress:Address | undefined) => {
  const contractRecs:ContractRecs = {
    nameRec:useWagmiERC20TokenNameRec(contractAddress),
    symbolRec:useWagmiERC20TokenSymbolRec(contractAddress),
    decimalRec:useWagmiERC20TokenDecimalRec(contractAddress),
    totalSupplyRec:useWagmiERC20TokenTotalSupplyRec(contractAddress)
  }
  return contractRecs
}

////////////////////////////////////////////////////////////////////////////
const useWagmiERC20TokenDecimals = (contractAddress:Address | undefined) => {
  return useWagmiERC20TokenDecimalRec(contractAddress).data;
}

const useWagmiERC20TokenName = (contractAddress:Address | undefined) => {
  return useWagmiERC20TokenNameRec(contractAddress).data;
}

const useWagmiERC20TokenSymbol = (contractAddress:Address | undefined) => {
  return useWagmiERC20TokenSymbolRec(contractAddress).data;
}

const useWagmiERC20TokenTotalSupply = (contractAddress:Address | undefined) => {
  return useWagmiERC20TokenTotalSupplyRec(contractAddress).data;
}

const useWagmiERC20TokenBalanceOf = (connectedAccountAddr: Address | undefined, contractAddress: Address | undefined) => {
  let eRC20WagmiClientBalanceOf:bigint | undefined = BigInt(0);
  eRC20WagmiClientBalanceOf = useWagmiERC20TokenBalanceOfRec(connectedAccountAddr , contractAddress )?.data;
  return eRC20WagmiClientBalanceOf;
}

const useWagmiERC20TokenBalanceOfStr = (connectedAccountAddr: Address | undefined, contractAddress: Address |  undefined) => {
  const bigIntBalanceOf:bigint | undefined = useWagmiERC20TokenBalanceOf(connectedAccountAddr, contractAddress);
  return bigIntBalanceOf ? bigIntBalanceOf.toString() : "0";
}

const useErc20TokenContract = (TOKEN_CONTRACT_ADDRESS:Address | undefined) => {
  const chainId:number = useChainId();
  const name:string|undefined = useWagmiERC20TokenName(TOKEN_CONTRACT_ADDRESS);
  const symbol:string|undefined = useWagmiERC20TokenSymbol(TOKEN_CONTRACT_ADDRESS);
  const decimals:number|undefined = useWagmiERC20TokenDecimals(TOKEN_CONTRACT_ADDRESS);
  const totalSupply:bigint|undefined = useWagmiERC20TokenTotalSupply(TOKEN_CONTRACT_ADDRESS);
  let contractResponse:TokenContract|undefined;
  if ( TOKEN_CONTRACT_ADDRESS ) {
    contractResponse =
    {
      chainId: chainId,
      address:TOKEN_CONTRACT_ADDRESS,
      name:name || "1. CONTRACT NOT FOUND AT ADDRESS",
      symbol:symbol,
      decimals:decimals,
      amount:0n,
      balance:0n,
      totalSupply:totalSupply,
      img:'/assets/miscellaneous/QuestionWhiteOnRed.png'
    }
  }
  // if (TOKEN_CONTRACT_ADDRESS)
  //   console.debug(`****useErc20TokenContract.contractResponse(${TOKEN_CONTRACT_ADDRESS}) = ${stringifyBigInt(contractResponse)}`)
  return contractResponse
}

const useErc20NetworkContract = (ACTIVE_NETWORK_ADDRESS:Address | undefined) => {
  const useBalanceNetworkObj      = useBalance( { address: ACTIVE_NETWORK_ADDRESS} );
  const chainId:number            = useChainId();
  const symbol:string|undefined   = useBalanceNetworkObj?.data?.symbol;
  const decimals:number|undefined = useBalanceNetworkObj?.data?.decimals;
  const name:string|undefined     = getBlockChainName(chainId);

  let networkResponse:TokenContract|undefined;
  if ( ACTIVE_NETWORK_ADDRESS ) {
    networkResponse =
    {
      chainId: chainId,
      address:ACTIVE_NETWORK_ADDRESS,
      name:name || "NETWORK NOT FOUND AT ADDRESS",
      balance:0n,
      symbol:symbol,
      decimals:decimals,
      amount:0n,
      totalSupply:undefined,
      img:'/assets/miscellaneous/QuestionWhiteOnRed.png'
    }
  }

  // if (ACTIVE_NETWORK_ADDRESS)
  //   console.debug(`****useErc20TokenContract.networkResponse = ${stringifyBigInt(networkResponse)}`)
  return networkResponse
}

const formatDecimals = (val: bigint | number | string | undefined, decimals:number|undefined):string => {
  if (val === undefined) return "";
  let bigInt = BigInt(val)
  return (decimals !== undefined) ? formatUnits(bigInt, decimals) : bigInt.toString()
}

const useFormattedClientTotalSupply = (contractAddress:Address | undefined) => {
  const totalSupply = useWagmiERC20TokenTotalSupply(contractAddress)
  const decimals  = useWagmiERC20TokenDecimals(contractAddress)
  return formatDecimals(totalSupply, decimals);
}

// const useFormattedClientBalanceOf = (connectedAccountAddr: Address | string | undefined, contractAddress: Address | string | undefined ) => {

//   const [formattedDecimals, setFormattedDecimals] = useState<string>("0");

//   // if (connectedAccountAddr && contractAddress) {
//     const balanceOf = useWagmiERC20TokenBalanceOfStr(connectedAccountAddr, contractAddress)
//     const decimals  = useWagmiERC20TokenDecimals(contractAddress)
//   // }

//   useEffect(() => {
//     if(balanceOf && decimals) {
//       // alert(` setFormattedDecimals(formatDecimals(${balanceOf}, ${decimals}));`)
//       setFormattedDecimals(formatDecimals(balanceOf, decimals));
//     }
//   }, [balanceOf, decimals])

//   return formattedDecimals;
// }

const useFormattedClientBalanceOf = (connectedAccountAddr: Address | undefined, contractAddress: Address | undefined ) => {
  // const [formattedBalanceOf , setFormattedBalanceOf ] = useState<string>("0");
  const balanceOf = useWagmiERC20TokenBalanceOfStr(connectedAccountAddr, contractAddress)
  const decimals  = useWagmiERC20TokenDecimals(contractAddress)
  let formattedBalanceOf:string|undefined = "0";
  
  // useEffect(() => {
    if(balanceOf && decimals) {
      // setFormattedBalanceOf(formatDecimals(balanceOf, decimals));
      formattedBalanceOf = formatDecimals(balanceOf, decimals);
    }
  // }, [balanceOf, decimals])

  return formattedBalanceOf;
}

export {
  type TokenContract,
  type ContractRecs,
  useErc20NetworkContract,
  useWagmiERC20TokenBalanceOfRec, 
  useWagmiERC20TokenDecimalRec,
  useWagmiERC20TokenNameRec, 
  useWagmiERC20TokenSymbolRec, 
  useWagmiERC20TokenTotalSupplyRec,
  useWagmiERC20TokenRecords,
  useWagmiERC20TokenBalanceOfStr,
  useWagmiERC20TokenBalanceOf,
  useWagmiERC20TokenDecimals,
  useWagmiERC20TokenName, 
  useWagmiERC20TokenSymbol, 
  useWagmiERC20TokenTotalSupply,
  useErc20TokenContract,
  formatDecimals,
  useFormattedClientTotalSupply,
  useFormattedClientBalanceOf
}
