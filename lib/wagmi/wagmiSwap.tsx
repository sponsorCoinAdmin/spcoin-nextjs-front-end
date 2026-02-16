// File: @/lib/wagmi/wagmiERC20hooks.tsx
'use client';

import { useBalance, useReadContract } from 'wagmi';
import type { Address } from 'viem';
import { formatUnits, erc20Abi } from 'viem';

import type { TokenContract, ContractRecs } from '@/lib/structure';
import { BURN_ADDRESS } from '@/lib/structure';
import { getBlockChainName } from '@/lib/utils/network';
import { useAppChainId } from '@/lib/context/hooks';

/* ----------------------------- Read helpers (wagmi) ----------------------------- */

const useWagmiERC20TokenBalanceOfRec = (
  activeAccountAddr: Address | undefined,
  contractAddress: Address | undefined
) => {
  return useReadContract({
    abi: erc20Abi,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'balanceOf',
    args: [activeAccountAddr || BURN_ADDRESS],
  });
};

const useWagmiERC20TokenDecimalRec = (contractAddress: Address | undefined) =>
  useReadContract({
    abi: erc20Abi,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'decimals',
  });

const useWagmiERC20TokenNameRec = (contractAddress: Address | undefined) =>
  useReadContract({
    abi: erc20Abi,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'name',
  });

const useWagmiERC20TokenSymbolRec = (contractAddress: Address | undefined) =>
  useReadContract({
    abi: erc20Abi,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'symbol',
  });

const useWagmiERC20TokenTotalSupplyRec = (contractAddress: Address | undefined) =>
  useReadContract({
    abi: erc20Abi,
    address: contractAddress || BURN_ADDRESS,
    functionName: 'totalSupply',
  });

const useWagmiERC20TokenRecords = (contractAddress: Address | undefined): ContractRecs => ({
  nameRec: useWagmiERC20TokenNameRec(contractAddress),
  symbolRec: useWagmiERC20TokenSymbolRec(contractAddress),
  decimalRec: useWagmiERC20TokenDecimalRec(contractAddress),
  totalSupplyRec: useWagmiERC20TokenTotalSupplyRec(contractAddress),
});

/* ------------------------------ Derived selectors ------------------------------ */

const useWagmiERC20TokenDecimals = (contractAddress: Address | undefined) =>
  useWagmiERC20TokenDecimalRec(contractAddress).data as number | undefined;

const useWagmiERC20TokenName = (contractAddress: Address | undefined) =>
  useWagmiERC20TokenNameRec(contractAddress).data as string | undefined;

const useWagmiERC20TokenSymbol = (contractAddress: Address | undefined) =>
  useWagmiERC20TokenSymbolRec(contractAddress).data as string | undefined;

const useWagmiERC20TokenTotalSupply = (contractAddress: Address | undefined) =>
  useWagmiERC20TokenTotalSupplyRec(contractAddress).data as bigint | undefined;

const useWagmiERC20TokenBalanceOf = (
  activeAccountAddr: Address | undefined,
  contractAddress: Address | undefined
) => {
  return useWagmiERC20TokenBalanceOfRec(activeAccountAddr, contractAddress)
    .data as bigint | undefined;
};

const useWagmiERC20TokenBalanceOfStr = (
  activeAccountAddr: Address | undefined,
  contractAddress: Address | undefined
) => {
  const bigIntBalanceOf = useWagmiERC20TokenBalanceOf(activeAccountAddr, contractAddress);
  return bigIntBalanceOf ? bigIntBalanceOf.toString() : '0';
};

/* --------------------------------- Composites --------------------------------- */

const useErc20TokenContract = (TOKEN_CONTRACT_ADDRESS: Address | undefined): TokenContract | undefined => {
  const [chainId] = useAppChainId(); // tuple: [number, setter]
  const name = useWagmiERC20TokenName(TOKEN_CONTRACT_ADDRESS) ?? 'CONTRACT NOT FOUND';
  const symbol = useWagmiERC20TokenSymbol(TOKEN_CONTRACT_ADDRESS) ?? '';
  const decimals = useWagmiERC20TokenDecimals(TOKEN_CONTRACT_ADDRESS) ?? 18;
  const totalSupply = useWagmiERC20TokenTotalSupply(TOKEN_CONTRACT_ADDRESS) ?? 0n;

  if (!TOKEN_CONTRACT_ADDRESS) return undefined;

  const contractResponse: TokenContract = {
    chainId,
    address: TOKEN_CONTRACT_ADDRESS,
    name,
    symbol,
    amount: 0n,
    balance: 0n,
    decimals,
    totalSupply,
  };

  return contractResponse;
};

const useErc20NetworkContract = (ACTIVE_NETWORK_ADDRESS: Address | undefined): TokenContract | undefined => {
  const balance = useBalance({ address: ACTIVE_NETWORK_ADDRESS });
  const [chainId] = useAppChainId();
  const symbol = balance.data?.symbol ?? '';
  const decimals = balance.data?.decimals ?? 18;
  const name = getBlockChainName(chainId) ?? 'NETWORK';

  if (!ACTIVE_NETWORK_ADDRESS) return undefined;

  const networkResponse: TokenContract = {
    chainId,
    address: ACTIVE_NETWORK_ADDRESS,
    name,
    symbol,
    amount: 0n,
    decimals,
    balance: 0n,
    totalSupply: 0n,
  };

  return networkResponse;
};

/* ---------------------------------- Formatters --------------------------------- */

const formatDecimals = (val: bigint | number | string | undefined, decimals: number | undefined) => {
  if (val === undefined) return undefined;
  const bigInt = BigInt(val);
  return decimals !== undefined ? formatUnits(bigInt, decimals) : bigInt.toString();
};

const useFormattedClientTotalSupply = (contractAddress: Address | undefined) => {
  const totalSupply = useWagmiERC20TokenTotalSupply(contractAddress);
  const decimals = useWagmiERC20TokenDecimals(contractAddress);
  return formatDecimals(totalSupply, decimals);
};

const useFormattedClientBalanceOf = (
  activeAccountAddr: Address | undefined,
  contractAddress: Address | undefined
) => {
  const balanceOf = useWagmiERC20TokenBalanceOfStr(activeAccountAddr, contractAddress);
  const decimals = useWagmiERC20TokenDecimals(contractAddress);
  return balanceOf && decimals !== undefined ? formatDecimals(balanceOf, decimals) : '0';
};

/* ------------------------------------ Exports ---------------------------------- */

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
