// File: lib/hooks/wagmi/wagmiERC20ClientRead.tsx
'use client';

import { useBalance, useReadContract } from 'wagmi';
import { config } from '@/lib/wagmi/wagmiConfig';
import type { Address } from 'viem';
import { formatUnits } from 'viem';
import { erc20ABI } from '@/resources/data/ABIs/erc20ABI';
import type { TokenContract, ContractRecs } from '@/lib/structure';
import { getBlockChainName } from '@/lib/context/helpers/NetworkHelpers';
import { useAppChainId } from '@/lib/context/hooks';
import { BURN_ADDRESS } from '@/lib/structure/constants/addresses';

/** ---------------------------------------------
 * Low-level wagmi contract reads
 * ----------------------------------------------*/

const useWagmiERC20TokenBalanceOfRec = (
  connectedAccountAddr: Address | undefined,
  contractAddress: Address | undefined
) => {
  return useReadContract({
    abi: erc20ABI,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'balanceOf',
    args: [connectedAccountAddr || BURN_ADDRESS],
    config,
  });
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

const useWagmiERC20TokenSymbolRec = (contractAddress: Address | undefined) => {
  return useReadContract({
    abi: erc20ABI,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'symbol',
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
};

/** ---------------------------------------------
 * Convenience bundles
 * ----------------------------------------------*/

const useWagmiERC20TokenRecords = (contractAddress: Address | undefined): ContractRecs => {
  return {
    nameRec: useWagmiERC20TokenNameRec(contractAddress),
    symbolRec: useWagmiERC20TokenSymbolRec(contractAddress),
    decimalRec: useWagmiERC20TokenDecimalRec(contractAddress),
    totalSupplyRec: useWagmiERC20TokenTotalSupplyRec(contractAddress),
  };
};

const useWagmiERC20TokenDecimals = (contractAddress: Address | undefined) =>
  useWagmiERC20TokenDecimalRec(contractAddress).data as number | undefined;

const useWagmiERC20TokenName = (contractAddress: Address | undefined) =>
  useWagmiERC20TokenNameRec(contractAddress).data as string | undefined;

const useWagmiERC20TokenSymbol = (contractAddress: Address | undefined) =>
  useWagmiERC20TokenSymbolRec(contractAddress).data as string | undefined;

const useWagmiERC20TokenTotalSupply = (contractAddress: Address | undefined) =>
  useWagmiERC20TokenTotalSupplyRec(contractAddress).data as bigint | undefined;

const useWagmiERC20TokenBalanceOf = (
  connectedAccountAddr: Address | undefined,
  contractAddress: Address | undefined
) => {
  const rec = useWagmiERC20TokenBalanceOfRec(connectedAccountAddr, contractAddress);
  return rec?.data as bigint | undefined;
};

const useWagmiERC20TokenBalanceOfStr = (
  connectedAccountAddr: Address | undefined,
  contractAddress: Address | undefined
) => {
  const bigIntBalanceOf: bigint | undefined = useWagmiERC20TokenBalanceOf(
    connectedAccountAddr,
    contractAddress
  );
  return bigIntBalanceOf ? bigIntBalanceOf.toString() : '0';
};

/** ---------------------------------------------
 * High-level objects
 * ----------------------------------------------*/

const useErc20TokenContract = (TOKEN_CONTRACT_ADDRESS: Address | undefined): TokenContract | undefined => {
  const [appChainId] = useAppChainId(); // tuple [value, setter]
  const name = useWagmiERC20TokenName(TOKEN_CONTRACT_ADDRESS);
  const symbol = useWagmiERC20TokenSymbol(TOKEN_CONTRACT_ADDRESS);
  const decimals = useWagmiERC20TokenDecimals(TOKEN_CONTRACT_ADDRESS);
  const totalSupply = useWagmiERC20TokenTotalSupply(TOKEN_CONTRACT_ADDRESS);

  if (!TOKEN_CONTRACT_ADDRESS) return undefined;

  return {
    chainId: appChainId ?? 0,
    address: TOKEN_CONTRACT_ADDRESS,
    name: name || '1. CONTRACT NOT FOUND AT ADDRESS',
    symbol,
    decimals,
    amount: 0n,
    balance: 0n,
    totalSupply,
  };
};

const useErc20NetworkContract = (ACTIVE_NETWORK_ADDRESS: Address | undefined): TokenContract | undefined => {
  const balance = useBalance({ address: ACTIVE_NETWORK_ADDRESS });
  const [appChainId] = useAppChainId(); // tuple
  const symbol = balance?.data?.symbol;
  const decimals = balance?.data?.decimals;
  const name = getBlockChainName(appChainId ?? 0);

  if (!ACTIVE_NETWORK_ADDRESS) return undefined;

  return {
    chainId: appChainId ?? 0,
    address: ACTIVE_NETWORK_ADDRESS,
    name: name || 'NETWORK NOT FOUND AT ADDRESS',
    balance: 0n,
    symbol,
    decimals,
    amount: 0n,
    totalSupply: undefined,
  };
};

/** ---------------------------------------------
 * Formatting helpers
 * ----------------------------------------------*/

const formatDecimals = (val: bigint | number | string | undefined, decimals: number | undefined): string => {
  if (val === undefined) return '';
  const bi = typeof val === 'bigint' ? val : BigInt(val);
  return decimals !== undefined ? formatUnits(bi, decimals) : bi.toString();
};

const useFormattedClientTotalSupply = (contractAddress: Address | undefined) => {
  const totalSupply = useWagmiERC20TokenTotalSupply(contractAddress);
  const decimals = useWagmiERC20TokenDecimals(contractAddress);
  return formatDecimals(totalSupply, decimals);
};

const useFormattedClientBalanceOf = (
  connectedAccountAddr: Address | undefined,
  contractAddress: Address | undefined
) => {
  const balanceOf = useWagmiERC20TokenBalanceOfStr(connectedAccountAddr, contractAddress);
  const decimals = useWagmiERC20TokenDecimals(contractAddress);
  return balanceOf && decimals !== undefined ? formatDecimals(balanceOf, decimals) : '0';
};

/** ---------------------------------------------
 * Exports
 * ----------------------------------------------*/

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
