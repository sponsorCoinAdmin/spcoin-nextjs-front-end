// File: lib/hooks/useGetBalance.ts
'use client';

import { useMemo } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { formatUnits, type Address } from 'viem';
import { BALANCE_KEY, normalizeTokenAddress } from '@/lib/network/onchain/cacheKeys';
import { NATIVE_TOKEN_ADDRESS } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_USE_GET_BALANCE === 'true';
const debug = createDebugLogger('useGetBalance', DEBUG_ENABLED, LOG_TIME);

// Minimal ERC-20 ABI for reads
const erc20Abi = [
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const;

// Types flowing through the query
type BalanceFnData = { balance: bigint; decimals: number };
type BalanceData = { balance: bigint; decimals: number; formatted?: string };
type BalanceError = Error;
type BalanceQueryKey = readonly [string];

export type UseGetBalanceParams = {
  /** token address; falsy => treat as native token */
  tokenAddress?: Address | null;
  /** override chainId; defaults to publicClient.chain.id */
  chainId?: number;
  /** override user; defaults to connected address */
  userAddress?: Address | null;
  /** provide to skip an extra decimals() RPC */
  decimalsHint?: number;
  /** react-query staleTime (ms) */
  staleTimeMs?: number;
  /** additional enable flag (combined with internal guards) */
  enabled?: boolean;
};

export function useGetBalance({
  tokenAddress,
  chainId,
  userAddress,
  decimalsHint,
  staleTimeMs = 20_000,
  enabled,
}: UseGetBalanceParams): {
  balance: bigint | undefined;
  decimals: number | undefined;
  formatted: string | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: BalanceError | null;
  refetch: UseQueryResult<BalanceData, BalanceError>['refetch'];
  key: string | undefined;
} {
  const publicClient = usePublicClient();
  const { address: connected, status } = useAccount();

  // Canonicalize inputs
  const user = (userAddress ?? connected) ?? null;
  const effChainId = chainId ?? publicClient?.chain?.id;
  const effectiveToken: Address | null = useMemo(() => {
    // If no token provided, treat as native
    const addr = (tokenAddress ?? NATIVE_TOKEN_ADDRESS) as Address;
    return normalizeTokenAddress(addr);
  }, [tokenAddress]);

  const isNative = useMemo(() => {
    if (!effectiveToken) return false;
    return (effectiveToken as string).toLowerCase() === (NATIVE_TOKEN_ADDRESS as string).toLowerCase();
  }, [effectiveToken]);

  // Guard execution
  const isEnabled = useMemo(() => {
    const base =
      !!publicClient &&
      !!effChainId &&
      status === 'connected' &&
      !!user &&
      !!effectiveToken;
    return typeof enabled === 'boolean' ? base && enabled : base;
  }, [publicClient, effChainId, status, user, effectiveToken, enabled]);

  // Always provide a key with a stable tuple shape to keep TS inference happy
  const keyString = isEnabled
    ? BALANCE_KEY(effChainId!, user as Address, effectiveToken as Address)
    : 'balance:disabled';
  const queryKey = useMemo<BalanceQueryKey>(() => [keyString] as const, [keyString]);

  const query = useQuery<BalanceFnData, BalanceError, BalanceData, BalanceQueryKey>({
    queryKey,
    enabled: isEnabled,
    staleTime: staleTimeMs,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    queryFn: async () => {
      if (!publicClient || !effChainId || !user || !effectiveToken) {
        // Should be gated by enabled, but keep a defensive check
        throw new Error('Preconditions not met');
      }

      try {
        if (isNative) {
          const bal = await publicClient.getBalance({ address: user as Address });
          debug.log?.(`💰 native balance -> ${bal.toString()}`);
          return { balance: bal as bigint, decimals: 18 };
        }

        const [d, bal] = await Promise.all([
          typeof decimalsHint === 'number'
            ? Promise.resolve(decimalsHint)
            : publicClient.readContract({
                address: effectiveToken as Address,
                abi: erc20Abi,
                functionName: 'decimals',
              }),
          publicClient.readContract({
            address: effectiveToken as Address,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [user as Address],
          }),
        ]);

        debug.log?.(
          `💰 erc20 balance -> ${(bal as bigint).toString()} (decimals=${d})`
        );
        return { balance: bal as bigint, decimals: Number(d) };
      } catch (e: any) {
        const msg = e?.shortMessage || e?.message || String(e);
        debug.warn?.(`⚠️ balance query failed: ${msg}`);
        throw e;
      }
    },
    select: (data) => {
      const { balance, decimals } = data;
      return {
        balance,
        decimals,
        formatted:
          typeof decimals === 'number' ? formatUnits(balance, decimals) : undefined,
      };
    },
  });

  return {
    balance: query.data?.balance,
    decimals: query.data?.decimals,
    formatted: query.data?.formatted,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: (query.error as BalanceError) ?? null,
    refetch: query.refetch,
    key: isEnabled ? keyString : undefined,
  };
}
