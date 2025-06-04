// File: lib/context/hooks/nestedHooks/useMappedTokenContract.ts

'use client';

import { useReadContract, useReadContracts, useAccount, useChainId } from 'wagmi';
import { erc20Abi } from 'viem';
import { isAddress, Address } from 'viem';
import { TokenContract } from '@/lib/structure/types';
import { getNativeWrapAddress, NATIVE_TOKEN_ADDRESS } from '@/lib/network/utils';
import { useNativeToken } from '@/lib/hooks/useNativeToken';

function useErc20TokenContract(tokenAddress?: Address): Omit<TokenContract, 'balance'> | undefined {
  const { address: account } = useAccount();
  const enabled = !!tokenAddress && isAddress(tokenAddress);
  const chainId = useChainId();

  const { data: metaData, status: metaStatus } = useReadContracts({
    contracts: [
      { address: tokenAddress, abi: erc20Abi, functionName: 'symbol' },
      { address: tokenAddress, abi: erc20Abi, functionName: 'name' },
      { address: tokenAddress, abi: erc20Abi, functionName: 'decimals' },
      { address: tokenAddress, abi: erc20Abi, functionName: 'totalSupply' },
    ],
    query: { enabled },
  });

  if (!enabled || metaStatus !== 'success' || !metaData) return undefined;

  const [symbolRaw, nameRaw, decimalsRaw, totalSupplyRaw] = metaData.map((res) => res.result);

  if (!symbolRaw || !nameRaw || decimalsRaw == null) return undefined;

  return {
    chainId,
    address: tokenAddress!,
    symbol: symbolRaw as string,
    name: nameRaw as string,
    amount: 0n,
    decimals: Number(decimalsRaw),
    totalSupply: totalSupplyRaw as bigint,
  } satisfies Omit<TokenContract, 'balance'>;
}

export function useMappedTokenContract(
  tokenAddress?: Address
): TokenContract | undefined | null {
  const chainId = useChainId();
  const isNativeToken = tokenAddress === NATIVE_TOKEN_ADDRESS;
  const validAddress = isNativeToken ? getNativeWrapAddress(chainId) : tokenAddress;
  const token = useErc20TokenContract(validAddress);
  const nativeToken = useNativeToken();

  if (!token) return null;

  const baseToken: TokenContract = {
    ...token,
    balance: 0n, // always default balance here
  };

  return isNativeToken ? nativeToken : baseToken;
}
