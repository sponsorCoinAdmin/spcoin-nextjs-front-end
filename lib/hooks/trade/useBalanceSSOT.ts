// File: lib/hooks/trade/useBalanceSSOT.ts
'use client';

import { useMemo } from 'react';
import type { Address } from 'viem';
import { erc20Abi, formatUnits } from 'viem';
import { useReadContract } from 'wagmi';

// Keep the build tag for quick runtime verification (dev-only log below)
export const USE_BALANCE_SSOT_BUILD = 'useBalanceSSOT@2025-10-24-simple-wagmi-wrapper';

if (process.env.NODE_ENV !== 'production') {
  // Log once on module load in dev
  // (Avoid noisy logs in prod or repeated logs in effects)
  // eslint-disable-next-line no-console
  console.log('[useBalanceSSOT] MODULE_LOADED', USE_BALANCE_SSOT_BUILD);
}

type Params = {
  chainId: number;
  tokenAddress?: Address; // ERC-20 only (native not handled by this hook)
  owner?: Address;
  decimalsHint?: number;  // If known, pass it (recommended)
  enabled?: boolean;      // default true
};

/**
 * Minimal ERC-20 balance hook:
 * Thin wrapper around wagmi's useReadContract(balanceOf).
 * Returns { balance, formatted, isLoading, error }.
 * No module singletons, no custom caches, no cross-panel coupling.
 */
export function useBalanceSSOT({
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
    query: { enabled: canRun },
  });

  const balance = data as bigint | undefined;

  const formatted = useMemo(
    () => (balance !== undefined ? formatUnits(balance, decimalsHint) : '0'),
    [balance, decimalsHint]
  );

  return {
    balance,        // bigint | undefined
    formatted,      // string
    isLoading,      // boolean
    error: (error as Error) ?? null,
  };
}
