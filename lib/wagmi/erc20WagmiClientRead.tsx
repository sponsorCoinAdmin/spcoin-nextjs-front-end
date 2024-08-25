'use client'

import { useChainId, useReadContract } from 'wagmi'
import { config } from '@/lib/wagmi/wagmiConfig'
import { Address, formatUnits, getAddress } from 'viem'
import { erc20Abi } from 'viem'
import { TokenContract, ContractRecs } from '../structure/types'
import { BURN_ADDRESS } from '@/lib/network/utils';
import { stringifyBigInt } from '../spCoin/utils'

const getERC20WagmiClientBalanceOfRec = (connectedAccountAddr: Address | string | undefined, contractAddress: Address | string | undefined) => {
  // console.debug(`getERC20WagmiClientBalanceOfRec:connectedAccountAddr = ${connectedAccountAddr}, contractAddress = ${contractAddress}`)
  let wagmiBalanceOfRec;
  wagmiBalanceOfRec = useReadContract({
    abi: erc20Abi,
    address: getAddress(contractAddress || BURN_ADDRESS),
    functionName: 'balanceOf',
    args: [getAddress(connectedAccountAddr || BURN_ADDRESS)],
    config, 
  })
  // console.debug(`getERC20WagmiClientBalanceOfRec.wagmiBalanceOfRec = ${stringifyBigInt(wagmiBalanceOfRec)}`)
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
  // console.debug("QQQQQ :\n"+stringifyBigInt(wagmiTotalSupplyRec))
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

const getERC20WagmiClientSymbol = (contractAddress:Address | undefined) => {
  return getERC20WagmiClientSymbolRec(contractAddress).data;
}

const getERC20WagmiClientTotalSupply = (contractAddress:Address | undefined) => {
  return getERC20WagmiClientTotalSupplyRec(contractAddress).data;
}

const getERC20WagmiClientBalanceOf = (connectedAccountAddr: Address | string | undefined, contractAddress: Address | string | undefined) => {
  let eRC20WagmiClientBalanceOf:bigint | undefined = BigInt(0);
  try {
    if (connectedAccountAddr && contractAddress) {
      // console.debug(`EXECUTING:eRC20WagmiClientBalanceOf(${connectedAccountAddr} , ${contractAddress})`);
      eRC20WagmiClientBalanceOf = getERC20WagmiClientBalanceOfRec(connectedAccountAddr , contractAddress )?.data;
      // console.debug(`EXECUTED 2:eRC20WagmiClientBalanceOf(${connectedAccountAddr} , ${contractAddress}) = ${eRC20WagmiClientBalanceOf}`);
    }
  }
  catch (err:any) {
    console.error(`ERROR:eRC20WagmiClientBalanceOf(${connectedAccountAddr} , ${contractAddress}) = ${eRC20WagmiClientBalanceOf}`);
    console.error(`ERROR: = ${stringifyBigInt(err)}`);
  }
  return eRC20WagmiClientBalanceOf;
}

const getERC20WagmiClientBalanceOfStr = (connectedAccountAddr: Address | string | undefined, contractAddress: Address | string | undefined) => {
  const bigIntBalanceOf:bigint | undefined = getERC20WagmiClientBalanceOf(connectedAccountAddr, contractAddress);
  return bigIntBalanceOf ? bigIntBalanceOf.toString() : "0";
}

const getErc20ClientContract = (contractAddress:Address | undefined) => {
  let contractResponse:TokenContract =
  {
    address:contractAddress,
    chainId: useChainId(),
    name:getERC20WagmiClientName(contractAddress),
    symbol:getERC20WagmiClientSymbol(contractAddress),
    decimals:getERC20WagmiClientDecimals(contractAddress),
    totalSupply:getERC20WagmiClientTotalSupply(contractAddress),
    img:undefined
  }
  return contractResponse
}

const formatDecimals = (val: bigint | number | string | undefined, decimals:number|undefined) => {
  let bigInt = (val === undefined) ? BigInt(0) : BigInt(val)
  return (decimals !== undefined) ? formatUnits(bigInt, decimals) : bigInt.toString()
}

const getFormattedClientTotalSupply = (contractAddress:Address | undefined) => {
  let totalSupply = getERC20WagmiClientTotalSupply(contractAddress)
  let decimals  = getERC20WagmiClientDecimals(contractAddress)
  return formatDecimals(totalSupply, decimals);
}

// const getFormattedClientBalanceOf = (connectedAccountAddr: Address | string | undefined, contractAddress: Address | string | undefined ) => {

//   const [formattedDecimals, setFormattedDecimals] = useState<string>("0");

//   // if (connectedAccountAddr && contractAddress) {
//     const balanceOf = getERC20WagmiClientBalanceOfStr(connectedAccountAddr, contractAddress)
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

const getFormattedClientBalanceOf = (connectedAccountAddr: Address | string | undefined, contractAddress: Address | string | undefined ) => {
  // alert(`getFormattedClientBalanceOf(${connectedAccountAddr}, ${contractAddress} )`)
  // const [formattedBalanceOf , setFormattedBalanceOf ] = useState<string>("0");
  let formattedBalanceOf = "0";
  const balanceOf = getERC20WagmiClientBalanceOfStr(connectedAccountAddr, contractAddress)
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
  getERC20WagmiClientBalanceOfRec, 
  getERC20WagmiClientDecimalRec,
  getERC20WagmiClientNameRec, 
  getERC20WagmiClientSymbolRec, 
  getERC20WagmiClientTotalSupplyRec,
  getERC20WagmiClientRecords,
  getERC20WagmiClientBalanceOfStr,
  getERC20WagmiClientBalanceOf,
  getERC20WagmiClientDecimals,
  getERC20WagmiClientName, 
  getERC20WagmiClientSymbol, 
  getERC20WagmiClientTotalSupply,
  getErc20ClientContract,
  formatDecimals,
  getFormattedClientTotalSupply,
  getFormattedClientBalanceOf
}
