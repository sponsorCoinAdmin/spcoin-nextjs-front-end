import { useBalance, useChainId, useReadContract, useWriteContract } from 'wagmi'
import { config } from '@/lib/wagmi/wagmiConfig'
import { Address, formatUnits } from 'viem'
// import { erc20Abi } from 'viem'
// import erc20Abi from '@/resources/data/ABIs/erc20ABI.json'
import { wethAbi } from '@/resources/data/ABIs/wethABI'
import { erc20Abi } from '@/resources/data/ABIs/erc20ABI'
import { TokenContract, ContractRecs } from '../structure/types'
import { BURN_ADDRESS, getNetworkName } from '@/lib/network/utils';
import { stringifyBigInt } from '../spCoin/utils'

// console.log(`AAAAAAAAA erc20Abi = ${JSON.stringify(erc20Abi)}`)
// console.log(`BBBBBBBBB erc20Abi2 = ${JSON.stringify(erc20Abi2)}`)

const useWagmiWrapDeposit = (connectedAccountAddr: Address | undefined, contractAddress: Address | undefined) => {
  // console.debug(`useWagmiERC20TokenBalanceOfRec:connectedAccountAddr = ${connectedAccountAddr}, contractAddress = ${contractAddress}`)
  const { writeContract } = useWriteContract()
  const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

  writeContract({ 
    abi: wethAbi,
    address: WETH,
    functionName: 'deposit',
    value:5n,
    args: [
    ],
 })

  // console.debug(`useWagmiERC20TokenBalanceOfRec.wagmiBalanceOfRec = ${stringifyBigInt(wagmiBalanceOfRec)}`)
}

const useWagmiERC20TokenDecimalRec = (contractAddress:Address | undefined) => {
  const wagmiDecimalsRec = useReadContract({
    abi: erc20Abi,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'decimals',
    config: config, 
  })
  return wagmiDecimalsRec;
}

const useWagmiERC20TokenNameRec = (contractAddress:Address | undefined) => {
  const wagmiNameRec = useReadContract({
    abi: erc20Abi,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'name',
    config: config, 
  })
  return wagmiNameRec;
}

const useWagmiERC20TokenSymbolRec = (contractAddress:Address | undefined) => {
  const wagmiSymbolRec = useReadContract({
    abi: erc20Abi,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'symbol',
    config: config, 
  })
  return wagmiSymbolRec;
}

const useWagmiERC20TokenTotalSupplyRec = (contractAddress:Address | undefined) => {
  const wagmiTotalSupplyRec = useReadContract({
    abi: erc20Abi,
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

const useErc20TokenContract = (TOKEN_CONTRACT_ADDRESS:Address | undefined) => {
  const chainId = useChainId();
  const name = useWagmiERC20TokenName(TOKEN_CONTRACT_ADDRESS);
  const symbol = useWagmiERC20TokenSymbol(TOKEN_CONTRACT_ADDRESS);
  const decimals = useWagmiERC20TokenDecimals(TOKEN_CONTRACT_ADDRESS);
  const totalSupply = useWagmiERC20TokenTotalSupply(TOKEN_CONTRACT_ADDRESS);
  let contractResponse:TokenContract|undefined;
  if ( TOKEN_CONTRACT_ADDRESS ) {
    contractResponse =
    {
      chainId: chainId,
      address:TOKEN_CONTRACT_ADDRESS,
      name:name || "3. CONTRACT NOT FOUND AT ADDRESS",
      symbol:symbol,
      decimals:decimals,
      totalSupply:totalSupply,
      img:'/resources/images/miscellaneous/QuestionWhiteOnRed.png'
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
  const name                      = getNetworkName(chainId);

  let networkResponse:TokenContract|undefined;
  if ( ACTIVE_NETWORK_ADDRESS ) {
    networkResponse =
    {
      chainId: chainId,
      address:ACTIVE_NETWORK_ADDRESS,
      name:name || "NETWORK NOT FOUND AT ADDRESS",
      symbol:symbol,
      decimals:decimals,
      totalSupply:undefined,
      img:'/resources/images/miscellaneous/QuestionWhiteOnRed.png'
    }
  }

  // if (ACTIVE_NETWORK_ADDRESS)
  //   console.debug(`****useErc20TokenContract.networkResponse = ${stringifyBigInt(networkResponse)}`)
  return networkResponse
}

const formatDecimals = (val: bigint | number | string | undefined, decimals:number|undefined) => {
  if (val === undefined) return undefined;
  let bigInt = BigInt(val)
  return (decimals !== undefined) ? formatUnits(bigInt, decimals) : bigInt.toString()
}

const useFormattedClientTotalSupply = (contractAddress:Address | undefined) => {
  const totalSupply = useWagmiERC20TokenTotalSupply(contractAddress)
  const decimals  = useWagmiERC20TokenDecimals(contractAddress)
  return formatDecimals(totalSupply, decimals);
}

export {
  type TokenContract,
  type ContractRecs,
  useErc20NetworkContract,
  useWagmiERC20TokenDecimalRec,
  useWagmiERC20TokenNameRec, 
  useWagmiERC20TokenSymbolRec, 
  useWagmiERC20TokenTotalSupplyRec,
  useWagmiERC20TokenRecords,
  useWagmiERC20TokenDecimals,
  useWagmiERC20TokenName, 
  useWagmiERC20TokenSymbol, 
  useWagmiERC20TokenTotalSupply,
  useErc20TokenContract,
  formatDecimals,
  useFormattedClientTotalSupply,
}

function useNetwork(): { chain: any; chains: any } {
  throw new Error('Function not implemented.')
}