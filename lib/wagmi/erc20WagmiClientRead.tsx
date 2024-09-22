'use client'

import { useChainId, useReadContract } from 'wagmi'
import { config } from '@/lib/wagmi/wagmiConfig'
import { Address, formatUnits, getAddress } from 'viem'
import { erc20Abi } from 'viem'
import { TokenContract, ContractRecs } from '../structure/types'
import { BURN_ADDRESS } from '@/lib/network/utils';
import { stringifyBigInt } from '../spCoin/utils'

const useERC20WagmiClientBalanceOfRec = (connectedAccountAddr: Address | string | undefined, contractAddress: Address | string | undefined) => {
  // console.debug(`useERC20WagmiClientBalanceOfRec:connectedAccountAddr = ${connectedAccountAddr}, contractAddress = ${contractAddress}`)
  let wagmiBalanceOfRec;
  wagmiBalanceOfRec = useReadContract({
    abi: erc20Abi,
    address: getAddress(contractAddress || BURN_ADDRESS),
    functionName: 'balanceOf',
    args: [getAddress(connectedAccountAddr || BURN_ADDRESS)],
    config: config, 
  })
  // console.debug(`useERC20WagmiClientBalanceOfRec.wagmiBalanceOfRec = ${stringifyBigInt(wagmiBalanceOfRec)}`)
  return wagmiBalanceOfRec;
}

const useERC20WagmiClientDecimalRec = (contractAddress:Address | string | undefined) => {
  let wagmiDecimalsRec
  wagmiDecimalsRec = useReadContract({
    abi: erc20Abi,
    address: getAddress(contractAddress || BURN_ADDRESS),
    functionName: 'decimals',
    config: config, 
  })
  return wagmiDecimalsRec;
}

const useERC20WagmiClientNameRec = (contractAddress:Address | undefined) => {
  let wagmiNameRec = useReadContract({
    abi: erc20Abi,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'name',
    config: config, 
  })
  return wagmiNameRec;
}

const useERC20WagmiClientSymbolRec = (contractAddress:Address | undefined) => {
  let wagmiSymbolRec = useReadContract({
    abi: erc20Abi,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'symbol',
    config: config, 
  })
  return wagmiSymbolRec;
}

const useERC20WagmiClientTotalSupplyRec = (contractAddress:Address | undefined) => {
  let wagmiTotalSupplyRec = useReadContract({
    abi: erc20Abi,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'totalSupply',
    config: config, 
  })
  // console.debug("QQQQQ :\n"+stringifyBigInt(wagmiTotalSupplyRec))
  return wagmiTotalSupplyRec;
}

const useERC20WagmiClientRecords = (contractAddress:Address | undefined) => {
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
  console.log(`EEEEEEE useERC20WagmiClientDecimals(${contractAddress})`)
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

const useERC20WagmiClientBalanceOf = (connectedAccountAddr: Address | string | undefined, contractAddress: Address | string | undefined) => {
  let eRC20WagmiClientBalanceOf:bigint | undefined = BigInt(0);
  try {
    if (connectedAccountAddr && contractAddress) {
      // console.debug(`EXECUTING:eRC20WagmiClientBalanceOf(${connectedAccountAddr} , ${contractAddress})`);
      eRC20WagmiClientBalanceOf = useERC20WagmiClientBalanceOfRec(connectedAccountAddr , contractAddress )?.data;
      // console.debug(`EXECUTED 2:eRC20WagmiClientBalanceOf(${connectedAccountAddr} , ${contractAddress}) = ${eRC20WagmiClientBalanceOf}`);
    }
  }
  catch (err:any) {
    console.error(`ERROR:eRC20WagmiClientBalanceOf(${connectedAccountAddr} , ${contractAddress}) = ${eRC20WagmiClientBalanceOf}`);
    console.error(`ERROR: = ${stringifyBigInt(err)}`);
  }
  return eRC20WagmiClientBalanceOf || 0n;
}

const useERC20WagmiClientBalanceOfStr = (connectedAccountAddr: Address | string | undefined, contractAddress: Address | string | undefined) => {
  const bigIntBalanceOf:bigint | undefined = useERC20WagmiClientBalanceOf(connectedAccountAddr, contractAddress);
  return bigIntBalanceOf ? bigIntBalanceOf.toString() : "0";
}

const useErc20ClientContract = (contractAddress:Address | undefined) => {
  const chainId = useChainId();
  const name = useERC20WagmiClientName(contractAddress);
  const symbol = useERC20WagmiClientSymbol(contractAddress);
  const decimals = useERC20WagmiClientDecimals(contractAddress);
  const totalSupply = useERC20WagmiClientTotalSupply(contractAddress);

  let contractResponse:TokenContract =
  {
    address:contractAddress,
    chainId: chainId,
    name:name,
    symbol:symbol,
    decimals:decimals,
    totalSupply:totalSupply,
    img:undefined
  }
  return contractResponse
}

const formatDecimals = (val: bigint | number | string | undefined, decimals:number|undefined) => {
  let bigInt = (val === undefined) ? BigInt(0) : BigInt(val)
  return (decimals !== undefined) ? formatUnits(bigInt, decimals) : bigInt.toString()
}

const useFormattedClientTotalSupply = (contractAddress:Address | undefined) => {
  const totalSupply = useERC20WagmiClientTotalSupply(contractAddress)
  const decimals  = useERC20WagmiClientDecimals(contractAddress)
  return formatDecimals(totalSupply, decimals);
}

// const useFormattedClientBalanceOf = (connectedAccountAddr: Address | string | undefined, contractAddress: Address | string | undefined ) => {

//   const [formattedDecimals, setFormattedDecimals] = useState<string>("0");

//   // if (connectedAccountAddr && contractAddress) {
//     const balanceOf = useERC20WagmiClientBalanceOfStr(connectedAccountAddr, contractAddress)
//     const decimals  = useERC20WagmiClientDecimals(contractAddress)
//   // }

//   useEffect(() => {
//     if(balanceOf && decimals) {
//       // alert(` setFormattedDecimals(formatDecimals(${balanceOf}, ${decimals}));`)
//       setFormattedDecimals(formatDecimals(balanceOf, decimals));
//     }
//   }, [balanceOf, decimals])

//   return formattedDecimals;
// }

const useFormattedClientBalanceOf = (connectedAccountAddr: Address | string | undefined, contractAddress: Address | string | undefined ) => {
  // const [formattedBalanceOf , setFormattedBalanceOf ] = useState<string>("0");
  const balanceOf = useERC20WagmiClientBalanceOfStr(connectedAccountAddr, contractAddress)
  const decimals  = useERC20WagmiClientDecimals(contractAddress)
  let formattedBalanceOf = "0";
  
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
  useERC20WagmiClientBalanceOfRec, 
  useERC20WagmiClientDecimalRec,
  useERC20WagmiClientNameRec, 
  useERC20WagmiClientSymbolRec, 
  useERC20WagmiClientTotalSupplyRec,
  useERC20WagmiClientRecords,
  useERC20WagmiClientBalanceOfStr,
  useERC20WagmiClientBalanceOf,
  useERC20WagmiClientDecimals,
  useERC20WagmiClientName, 
  useERC20WagmiClientSymbol, 
  useERC20WagmiClientTotalSupply,
  useErc20ClientContract,
  formatDecimals,
  useFormattedClientTotalSupply,
  useFormattedClientBalanceOf
}
