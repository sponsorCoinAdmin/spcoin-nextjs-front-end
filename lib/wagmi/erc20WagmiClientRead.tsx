'use client'

import { useBalance, useChainId, useReadContract } from 'wagmi'
import { config } from '@/lib/wagmi/wagmiConfig'
import { Address, formatUnits } from 'viem'
import { erc20Abi } from 'viem'
import { TokenContract, ContractRecs } from '../structure/types'
import { BURN_ADDRESS, getNetworkName } from '@/lib/network/utils';
import { stringifyBigInt } from '../spCoin/utils'

const useERC20WagmiTokenBalanceOfRec = (connectedAccountAddr: Address | undefined, contractAddress: Address | undefined) => {
  // console.debug(`useERC20WagmiTokenBalanceOfRec:connectedAccountAddr = ${connectedAccountAddr}, contractAddress = ${contractAddress}`)
  const wagmiBalanceOfRec = useReadContract({
    abi: erc20Abi,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'balanceOf',
    args: [connectedAccountAddr || BURN_ADDRESS],
    config: config, 
  })

  // console.debug(`useERC20WagmiTokenBalanceOfRec.wagmiBalanceOfRec = ${stringifyBigInt(wagmiBalanceOfRec)}`)
  return wagmiBalanceOfRec;
}

const useERC20WagmiTokenDecimalRec = (contractAddress:Address | undefined) => {
  const wagmiDecimalsRec = useReadContract({
    abi: erc20Abi,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'decimals',
    config: config, 
  })
  return wagmiDecimalsRec;
}

const useERC20WagmiTokenNameRec = (contractAddress:Address | undefined) => {
  const wagmiNameRec = useReadContract({
    abi: erc20Abi,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'name',
    config: config, 
  })
  return wagmiNameRec;
}

const useERC20WagmiTokenSymbolRec = (contractAddress:Address | undefined) => {
  const wagmiSymbolRec = useReadContract({
    abi: erc20Abi,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'symbol',
    config: config, 
  })
  return wagmiSymbolRec;
}

const useERC20WagmiTokenTotalSupplyRec = (contractAddress:Address | undefined) => {
  const wagmiTotalSupplyRec = useReadContract({
    abi: erc20Abi,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'totalSupply',
    config: config, 
  })
  // console.debug("QQQQQ :\n"+stringifyBigInt(wagmiTotalSupplyRec))
  return wagmiTotalSupplyRec;
}

const useERC20WagmiTokenRecords = (contractAddress:Address | undefined) => {
  const contractRecs:ContractRecs = {
    nameRec:useERC20WagmiTokenNameRec(contractAddress),
    symbolRec:useERC20WagmiTokenSymbolRec(contractAddress),
    decimalRec:useERC20WagmiTokenDecimalRec(contractAddress),
    totalSupplyRec:useERC20WagmiTokenTotalSupplyRec(contractAddress)
  }
  return contractRecs
}

////////////////////////////////////////////////////////////////////////////
const useERC20WagmiTokenDecimals = (contractAddress:Address | undefined) => {
  return useERC20WagmiTokenDecimalRec(contractAddress).data;
}

const useERC20WagmiTokenName = (contractAddress:Address | undefined) => {
  return useERC20WagmiTokenNameRec(contractAddress).data;
}

const useERC20WagmiTokenSymbol = (contractAddress:Address | undefined) => {
  return useERC20WagmiTokenSymbolRec(contractAddress).data;
}

const useERC20WagmiTokenTotalSupply = (contractAddress:Address | undefined) => {
  return useERC20WagmiTokenTotalSupplyRec(contractAddress).data;
}

const useERC20WagmiTokenBalanceOf = (connectedAccountAddr: Address | undefined, contractAddress: Address | undefined) => {
  let eRC20WagmiClientBalanceOf:bigint | undefined = BigInt(0);
  eRC20WagmiClientBalanceOf = useERC20WagmiTokenBalanceOfRec(connectedAccountAddr , contractAddress )?.data;
  return eRC20WagmiClientBalanceOf;
}

const useERC20WagmiTokenBalanceOfStr = (connectedAccountAddr: Address | undefined, contractAddress: Address |  undefined) => {
  const bigIntBalanceOf:bigint | undefined = useERC20WagmiTokenBalanceOf(connectedAccountAddr, contractAddress);
  return bigIntBalanceOf ? bigIntBalanceOf.toString() : "0";
}

const useErc20TokenContract = (TOKEN_CONTRACT_ADDRESS:Address | undefined) => {
  const chainId = useChainId();
  const name = useERC20WagmiTokenName(TOKEN_CONTRACT_ADDRESS);
  const symbol = useERC20WagmiTokenSymbol(TOKEN_CONTRACT_ADDRESS);
  const decimals = useERC20WagmiTokenDecimals(TOKEN_CONTRACT_ADDRESS);
  const totalSupply = useERC20WagmiTokenTotalSupply(TOKEN_CONTRACT_ADDRESS);
  let contractResponse:TokenContract|undefined;
  if ( TOKEN_CONTRACT_ADDRESS ) {
    contractResponse =
    {
      chainId: chainId,
      address:TOKEN_CONTRACT_ADDRESS,
      name:name || "CONTRACT NOT FOUND AT ADDRESS",
      symbol:symbol,
      decimals:decimals,
      totalSupply:totalSupply,
      img:'/resources/images/miscellaneous/QuestionWhiteOnRed.png'
    }
  }
  console.debug(`useErc20TokenContract.contractResponse = ${stringifyBigInt(contractResponse)}`)
  return contractResponse
}

const useErc20NetworkContract = (ACTIVE_ACCOUNT_ADDRESS:Address | undefined) => {
  const useBalanceNetworkObj      = useBalance( { address: ACTIVE_ACCOUNT_ADDRESS} );
  const chainId:number            = useChainId();
  const symbol:string|undefined   = useBalanceNetworkObj?.data?.symbol;
  const decimals:number|undefined = useBalanceNetworkObj?.data?.decimals;
  const name                      = getNetworkName(chainId);

  let networkResponse:TokenContract|undefined;
  if ( ACTIVE_ACCOUNT_ADDRESS ) {
    networkResponse =
    {
      chainId: chainId,
      address:ACTIVE_ACCOUNT_ADDRESS,
      name:name || "NETWORK NOT FOUND AT ADDRESS",
      symbol:symbol,
      decimals:decimals,
      totalSupply:undefined,
      img:'/resources/images/miscellaneous/QuestionWhiteOnRed.png'
    }
  }
  console.debug(`useErc20TokenContract.networkResponse = ${stringifyBigInt(networkResponse)}`)
  return networkResponse
}


const formatDecimals = (val: bigint | number | string | undefined, decimals:number|undefined) => {
  if (val === undefined) return undefined;
  let bigInt = BigInt(val)
  return (decimals !== undefined) ? formatUnits(bigInt, decimals) : bigInt.toString()
}

const useFormattedClientTotalSupply = (contractAddress:Address | undefined) => {
  const totalSupply = useERC20WagmiTokenTotalSupply(contractAddress)
  const decimals  = useERC20WagmiTokenDecimals(contractAddress)
  return formatDecimals(totalSupply, decimals);
}

// const useFormattedClientBalanceOf = (connectedAccountAddr: Address | string | undefined, contractAddress: Address | string | undefined ) => {

//   const [formattedDecimals, setFormattedDecimals] = useState<string>("0");

//   // if (connectedAccountAddr && contractAddress) {
//     const balanceOf = useERC20WagmiTokenBalanceOfStr(connectedAccountAddr, contractAddress)
//     const decimals  = useERC20WagmiTokenDecimals(contractAddress)
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
  const balanceOf = useERC20WagmiTokenBalanceOfStr(connectedAccountAddr, contractAddress)
  const decimals  = useERC20WagmiTokenDecimals(contractAddress)
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
  useERC20WagmiTokenBalanceOfRec, 
  useERC20WagmiTokenDecimalRec,
  useERC20WagmiTokenNameRec, 
  useERC20WagmiTokenSymbolRec, 
  useERC20WagmiTokenTotalSupplyRec,
  useERC20WagmiTokenRecords,
  useERC20WagmiTokenBalanceOfStr,
  useERC20WagmiTokenBalanceOf,
  useERC20WagmiTokenDecimals,
  useERC20WagmiTokenName, 
  useERC20WagmiTokenSymbol, 
  useERC20WagmiTokenTotalSupply,
  useErc20TokenContract,
  formatDecimals,
  useFormattedClientTotalSupply,
  useFormattedClientBalanceOf
}
function useNetwork(): { chain: any; chains: any } {
  throw new Error('Function not implemented.')
}

