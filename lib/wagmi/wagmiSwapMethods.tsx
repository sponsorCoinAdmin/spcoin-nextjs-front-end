import { useBalance, useReadContract, useWriteContract } from 'wagmi'
import { config } from '@/lib/wagmi/wagmiConfig'
import { Address, formatUnits } from 'viem'
// import { erc20ABI } from 'viem'
// import erc20ABI from '@/resources/data/ABIs/erc20ABI.json'
import { wethAbi } from '@/resources/data/ABIs/wethABI'
import { erc20ABI } from '@/resources/data/ABIs/erc20ABI'
import { TokenContract, ContractRecs, BURN_ADDRESS } from '@/lib/structure'
import { getBlockChainName } from '@/lib/context/helpers/NetworkHelpers';
import { useAppChainId } from '../context/hooks'

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

const useErc20TokenContract = (TOKEN_CONTRACT_ADDRESS:Address | undefined): TokenContract|undefined => {
  const [ chainId ] = useAppChainId();
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
      amount:0n,
      balance:0n,
    }
  }
  // if (TOKEN_CONTRACT_ADDRESS)
  //   console.debug(`****useErc20TokenContract.contractResponse(${TOKEN_CONTRACT_ADDRESS}) = ${stringifyBigInt(contractResponse)}`)
  return contractResponse
}

const useErc20NetworkContract = (ACTIVE_NETWORK_ADDRESS:Address | undefined):TokenContract|undefined => {
  const useBalanceNetworkObj      = useBalance( { address: ACTIVE_NETWORK_ADDRESS} );
  const [ chainId ]               = useAppChainId();
  const symbol:string|undefined   = useBalanceNetworkObj?.data?.symbol;
  const decimals:number|undefined = useBalanceNetworkObj?.data?.decimals;
  const name                      = getBlockChainName(chainId);

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
      amount:0n,
      balance:0n,
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