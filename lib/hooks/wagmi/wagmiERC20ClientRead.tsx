'use client';

import { useBalance, useChainId, useReadContract } from 'wagmi';
import { Address, formatUnits } from 'viem';
import { config } from '@/lib/wagmi/wagmiConfig';
import { erc20ABI } from '@/resources/data/ABIs/erc20ABI';
import { TokenContract, ContractRecs } from '@/lib/structure';
import { BURN_ADDRESS, getBlockChainName } from '@/lib/network/utils';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_USE_BALANCE === 'true';
const debugLog = createDebugLogger('wagmiERC20ClientRead', DEBUG_ENABLED, LOG_TIME);

const useWagmiERC20TokenBalanceOfRec = (
  connectedAccountAddr: Address | undefined,
  contractAddress: Address | undefined
) => {
  debugLog.log('🪙 useWagmiERC20TokenBalanceOfRec called with:', {
    connectedAccountAddr,
    contractAddress,
  });

  const addressArg = connectedAccountAddr ?? BURN_ADDRESS;
  const contractArg = contractAddress ?? BURN_ADDRESS;

  debugLog.log('📡 Preparing to fetch balanceOf with args:', [addressArg]);

  const wagmiBalanceOfRec = useReadContract({
    abi: erc20ABI,
    address: contractArg,
    functionName: 'balanceOf',
    args: [addressArg],
    config,
  });

  debugLog.log('📦 useReadContract.balanceOf result:', wagmiBalanceOfRec);

  return wagmiBalanceOfRec;
};

const useWagmiERC20TokenDecimalRec = (contractAddress: Address | undefined) => {
  return useReadContract({
    abi: erc20ABI,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'decimals',
    config,
  });
};

const useWagmiERC20TokenNameRec = (contractAddress: Address | undefined) => {
  return useReadContract({
    abi: erc20ABI,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'name',
    config,
  });
};


const useWagmiERC20TokenTotalSupplyRec = (contractAddress: Address | undefined) => {
  return useReadContract({
    abi: erc20ABI,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'totalSupply',
    config,
  });
  
};const useWagmiERC20TokenSymbolRec = (contractAddress: Address | undefined) => {
  return useReadContract({
    abi: erc20ABI,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'symbol',
    config,
  });
};


const useWagmiERC20TokenRecords = (contractAddress: Address | undefined): ContractRecs => {
  return {
    nameRec: useWagmiERC20TokenNameRec(contractAddress),
    symbolRec: useWagmiERC20TokenSymbolRec(contractAddress),
    decimalRec: useWagmiERC20TokenDecimalRec(contractAddress),
    totalSupplyRec: useWagmiERC20TokenTotalSupplyRec(contractAddress),
  };
};

const useWagmiERC20TokenDecimals = (contractAddress: Address | undefined) => {
  return useWagmiERC20TokenDecimalRec(contractAddress).data;
};

const useWagmiERC20TokenName = (contractAddress: Address | undefined) => {
  return useWagmiERC20TokenNameRec(contractAddress).data;
};

const useWagmiERC20TokenSymbol = (contractAddress: Address | undefined) => {
  return useWagmiERC20TokenSymbolRec(contractAddress).data;
};

const useWagmiERC20TokenTotalSupply = (contractAddress: Address | undefined) => {
  return useWagmiERC20TokenTotalSupplyRec(contractAddress).data;
};

const useWagmiERC20TokenBalanceOf = (
  connectedAccountAddr: Address | undefined,
  contractAddress: Address | undefined
): bigint | undefined => {
  const rec = useWagmiERC20TokenBalanceOfRec(connectedAccountAddr, contractAddress);
  const value = rec?.data;
  debugLog.log('✅ useWagmiERC20TokenBalanceOf resolved value:', value);
  return value;
};

const useWagmiERC20TokenBalanceOfStr = (
  connectedAccountAddr: Address | undefined,
  contractAddress: Address | undefined
): string => {
  const bigIntBalanceOf = useWagmiERC20TokenBalanceOf(connectedAccountAddr, contractAddress);
  const result = bigIntBalanceOf ? bigIntBalanceOf.toString() : '0';
  debugLog.log('🧾 BalanceOf string:', result);
  return result;
};

const useErc20TokenContract = (TOKEN_CONTRACT_ADDRESS: Address | undefined): TokenContract | undefined => {
  const chainId = useChainId();
  const name = useWagmiERC20TokenName(TOKEN_CONTRACT_ADDRESS);
  const symbol = useWagmiERC20TokenSymbol(TOKEN_CONTRACT_ADDRESS);
  const decimals = useWagmiERC20TokenDecimals(TOKEN_CONTRACT_ADDRESS);
  const totalSupply = useWagmiERC20TokenTotalSupply(TOKEN_CONTRACT_ADDRESS);

  if (!TOKEN_CONTRACT_ADDRESS) return undefined;

  return {
    chainId,
    address: TOKEN_CONTRACT_ADDRESS,
    name: name || '1. CONTRACT NOT FOUND AT ADDRESS',
    symbol,
    decimals,
    amount: 0n,
    balance: 0n,
    totalSupply: totalSupply || 0n,
  };
};

const useErc20NetworkContract = (ACTIVE_NETWORK_ADDRESS: Address | undefined): TokenContract | undefined => {
  const { data } = useBalance({ address: ACTIVE_NETWORK_ADDRESS });
  const chainId = useChainId();
  const name = getBlockChainName(chainId);
  const symbol = data?.symbol;
  const decimals = data?.decimals;

  if (!ACTIVE_NETWORK_ADDRESS) return undefined;

  return {
    chainId,
    address: ACTIVE_NETWORK_ADDRESS,
    name: name || 'NETWORK NOT FOUND AT ADDRESS',
    balance: 0n,
    symbol,
    decimals,
    amount: 0n,
    totalSupply: 0n,
  };
};

const formatDecimals = (val: bigint | number | string | undefined, decimals: number | undefined): string => {
  if (val === undefined) return '';
  const bigInt = BigInt(val);
  return decimals !== undefined ? formatUnits(bigInt, decimals) : bigInt.toString();
};

const useFormattedClientTotalSupply = (contractAddress: Address | undefined): string => {
  const totalSupply = useWagmiERC20TokenTotalSupply(contractAddress);
  const decimals = useWagmiERC20TokenDecimals(contractAddress);
  return formatDecimals(totalSupply, decimals);
};

const useFormattedClientBalanceOf = (
  connectedAccountAddr: Address | undefined,
  contractAddress: Address | undefined
): string => {
  const balanceOf = useWagmiERC20TokenBalanceOfStr(connectedAccountAddr, contractAddress);
  const decimals = useWagmiERC20TokenDecimals(contractAddress);
  return formatDecimals(balanceOf, decimals);
};

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
  useFormattedClientBalanceOf,
};
