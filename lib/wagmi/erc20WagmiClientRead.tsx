'use client'

import { useChainId, useReadContract } from 'wagmi'
import { config } from '@/lib/wagmi/wagmiConfig'
import { Address, formatUnits, getAddress } from 'viem'
import { erc20Abi } from 'viem'
import { TokenContract, ContractRecs } from '../structure/types'
import { BURN_ADDRESS } from '@/lib/network/utils';

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

const getERC20WagmiClientDecimalRec = (contractAddress:Address | string | undefined) => {
  // alert(`getERC20WagmiClientDecimalRec:contractAddress = ${contractAddress}`)
  let wagmiDecimalsRec
  wagmiDecimalsRec = useReadContract({
    abi: erc20Abi,
    address: getAddress(contractAddress || BURN_ADDRESS),
    functionName: 'decimals',
    config, 
  })
  // alert(`getERC20WagmiClientDecimalRec:wagmiDecimalsRec = ${JSON.stringify(wagmiDecimalsRec, null, 2)}`)
  return wagmiDecimalsRec;
}

const getERC20WagmiClientNameRec = (contractAddress:Address | undefined) => {
  let wagmiNameRec = useReadContract({
    abi: erc20Abi,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'name',
    config, 
  })
  return wagmiNameRec;
}

const getERC20WagmiClientSymbolRec = (contractAddress:Address | undefined) => {
  let wagmiSymbolRec = useReadContract({
    abi: erc20Abi,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'symbol',
    config, 
  })
  return wagmiSymbolRec;
}

const getERC20WagmiClientTotalSupplyRec = (contractAddress:Address | undefined) => {
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
    nameRec:getERC20WagmiClientNameRec(contractAddress),
    symbolRec:getERC20WagmiClientSymbolRec(contractAddress),
    decimalRec:getERC20WagmiClientDecimalRec(contractAddress),
    totalSupplyRec:getERC20WagmiClientTotalSupplyRec(contractAddress)
  }
  return contractRecs
}

////////////////////////////////////////////////////////////////////////////
const getERC20WagmiClientDecimals = (contractAddress:Address | string | undefined) => {
  return getERC20WagmiClientDecimalRec(contractAddress)?.data;
}

const getERC20WagmiClientName = (contractAddress:Address | undefined) => {
  return getERC20WagmiClientNameRec(contractAddress).data;
}

const useERC20WagmiClientSymbol = (contractAddress:Address | undefined) => {
  return getERC20WagmiClientSymbolRec(contractAddress).data;
}

const useERC20WagmiClientTotalSupply = (contractAddress:Address | undefined) => {
  return getERC20WagmiClientTotalSupplyRec(contractAddress).data;
}

const useERC20WagmiClientBalanceOf = (connectedWalletAddr: Address | string | undefined, contractAddress: Address | string | undefined) => {
  let eRC20WagmiClientBalanceOf:bigint | undefined = BigInt(0);
  try {
    if (connectedWalletAddr && contractAddress) {
      console.debug(`EXECUTING:eRC20WagmiClientBalanceOf(${connectedWalletAddr} , ${contractAddress})`);
      eRC20WagmiClientBalanceOf = useERC20WagmiClientBalanceOfRec(connectedWalletAddr , contractAddress )?.data;
      console.debug(`EXECUTED 2:eRC20WagmiClientBalanceOf(${connectedWalletAddr} , ${contractAddress}) = ${eRC20WagmiClientBalanceOf}`);
    }
  }
  catch (err:any) {
    console.debug(`ERROR:eRC20WagmiClientBalanceOf(${connectedWalletAddr} , ${contractAddress}) = ${eRC20WagmiClientBalanceOf}`);
    console.debug(`ERROR:eRC20WagmiClientBalanceOf:err.msg = ${err.msg}`);
  }
  return eRC20WagmiClientBalanceOf;
}

const useERC20WagmiClientBalanceOfStr = (connectedWalletAddr: Address | string | undefined, contractAddress: Address | string | undefined) => {
  const bigIntBalanceOf:bigint | undefined = useERC20WagmiClientBalanceOf(connectedWalletAddr, contractAddress);
  return bigIntBalanceOf ? bigIntBalanceOf.toString() : "0";
}

const useERC20WagmiClientBalanceOfStr_JUNK = (connectedWalletAddr: Address | string | undefined, contractAddress: Address | string | undefined) => {
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
    name:getERC20WagmiClientName(contractAddress),
    symbol:useERC20WagmiClientSymbol(contractAddress),
    decimals:getERC20WagmiClientDecimals(contractAddress),
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
  let decimals  = getERC20WagmiClientDecimals(contractAddress)
  return formatDecimals(totalSupply, decimals);
}

// const useFormattedClientBalanceOf = (connectedWalletAddr: Address | string | undefined, contractAddress: Address | string | undefined ) => {

//   const [formattedDecimals, setFormattedDecimals] = useState<string>("0");

//   // if (connectedWalletAddr && contractAddress) {
//     const balanceOf = useERC20WagmiClientBalanceOfStr(connectedWalletAddr, contractAddress)
//     const decimals  = getERC20WagmiClientDecimals(contractAddress)
//   // }

//   useEffect(() => {
//     if(balanceOf && decimals) {
//       // alert(` setFormattedDecimals(formatDecimals(${balanceOf}, ${decimals}));`)
//       setFormattedDecimals(formatDecimals(balanceOf, decimals));
//     }
//   }, [balanceOf, decimals])

//   return formattedDecimals;
// }

const useFormattedClientBalanceOf = (connectedWalletAddr: Address | string | undefined, contractAddress: Address | string | undefined ) => {
  // alert(`useFormattedClientBalanceOf(${connectedWalletAddr}, ${contractAddress} )`)
  // const [formattedBalanceOf , setFormattedBalanceOf ] = useState<string>("0");
  let formattedBalanceOf = "0";
  const balanceOf = useERC20WagmiClientBalanceOfStr(connectedWalletAddr, contractAddress)
  let decimals  = getERC20WagmiClientDecimals(contractAddress)
  
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
  getERC20WagmiClientDecimalRec,
  getERC20WagmiClientNameRec, 
  getERC20WagmiClientSymbolRec, 
  getERC20WagmiClientTotalSupplyRec,
  getERC20WagmiClientRecords,
  useERC20WagmiClientBalanceOfStr, 
  getERC20WagmiClientDecimals,
  getERC20WagmiClientName, 
  useERC20WagmiClientSymbol, 
  useERC20WagmiClientTotalSupply,
  getErc20ClientContract,
  formatDecimals,
  getFormattedClientTotalSupply,
  useFormattedClientBalanceOf
}
