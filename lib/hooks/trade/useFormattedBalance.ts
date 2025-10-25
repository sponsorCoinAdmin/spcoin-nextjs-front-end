// File: lib/hooks/trade/useFormattedBalance.ts
'use client';

import { useMemo } from 'react';
import type { Address } from 'viem';
import { erc20Abi, formatUnits } from 'viem';
import { useReadContract } from 'wagmi';

export const USE_FORMATTED_BALANCE_BUILD = 'useFormattedBalance@2025-10-25-v2';

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line no-console
  console.log('[useFormattedBalance] MODULE_LOADED', USE_FORMATTED_BALANCE_BUILD);
}

type Params = {
  chainId: number;
  tokenAddress?: Address;   // ERC-20
  owner?: Address;          // wallet
  decimalsHint?: number;    // pass known decimals
  enabled?: boolean;        // default true (v2: lives inside query)
};

export function useFormattedBalance({
  chainId,
  tokenAddress,
  owner,
  decimalsHint = 18,
  enabled = true,
}: Params) {
  const canRun = Boolean(chainId && tokenAddress && owner && enabled);

  const { data, isLoading, error } = useReadContract({
    chainId,
    address: tokenAddress as Address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: owner ? [owner] : undefined,
    query: { enabled: canRun }, // ✅ v2-only
  });

  const balance = data as bigint | undefined;

  const formatted = useMemo(
    () => (balance !== undefined ? formatUnits(balance, decimalsHint) : '0'),
    [balance, decimalsHint]
  );

  return {
    balance,
    formatted,
    isLoading,
    error: (error as Error) ?? null,
  };
}
