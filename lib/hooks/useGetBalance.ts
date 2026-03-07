// File: @/lib/hooks/useGetBalance.ts
'use client';

import { useMemo } from 'react';
import { usePublicClient } from 'wagmi';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { formatUnits, type Address } from 'viem';
import {
  BALANCE_KEY,
  normalizeTokenAddress,
} from '@/lib/network/onchain/cacheKeys';
import { NATIVE_TOKEN_ADDRESS } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useExchangeContext, useAppChainId } from '@/lib/context/hooks';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_USE_BALANCE === 'true';
const debug = createDebugLogger('useGetBalance', DEBUG_ENABLED, LOG_TIME);

// Minimal ERC-20 ABI for reads
const erc20Abi = [
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
] as const;

interface BalanceFnData {
  balance: bigint;
  decimals: number;
}
interface BalanceData {
  balance: bigint;
  decimals: number;
  formatted?: string;
}
type BalanceError = Error;
type BalanceQueryKey = readonly [string];

export interface UseGetBalanceParams {
  /** token address; falsy => treat as native token */
  tokenAddress?: Address | null;
  /** override chainId; defaults to appChainId → publicClient.chain.id */
  chainId?: number;
  /**
   * account address to read for
   * - if omitted, defaults to exchangeContext.accounts.activeAccount.address
   */
  userAddress?: Address | null;
  /** provide to skip an extra decimals() RPC */
  decimalsHint?: number;
  /** react-query staleTime (ms) */
  staleTimeMs?: number;
  /** additional enable flag (combined with internal guards) */
  enabled?: boolean;
}

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
  // 🧠 App-level context (accounts, network, etc.)
  const { exchangeContext } = useExchangeContext();
  const activeAccount = exchangeContext.accounts?.activeAccount
    ?.address as Address | undefined;

  // 🧠 Single source of truth for app chain
  const [appChainId] = useAppChainId();
  const networkChainId = exchangeContext.network?.chainId;

  // Chain we *ask* wagmi for. Prefer:
  //   param chainId → appChainId → (optionally) network.chainId
  const appEffectiveChainId =
    chainId ?? appChainId ?? networkChainId;

  // 🛰️ Chain-aware public client
  const publicClient = usePublicClient(
    appEffectiveChainId ? { chainId: appEffectiveChainId } : undefined,
  );

  // Chosen owner: explicit userAddress → activeAccount → null
  const user = (userAddress ?? activeAccount ?? null) as Address | null;

  // Effective chain: param chainId → appEffectiveChainId → wagmi’s client
  const effChainId =
    chainId ?? appEffectiveChainId ?? publicClient?.chain?.id;

  // Effective token: explicit tokenAddress → native token → normalized
  const effectiveToken: Address | null = useMemo(() => {
    const addr = (tokenAddress ?? NATIVE_TOKEN_ADDRESS) as Address;
    return normalizeTokenAddress(addr);
  }, [tokenAddress]);

  const isNative = useMemo(() => {
    if (!effectiveToken) return false;
    return (effectiveToken as string).toLowerCase() ===
      (NATIVE_TOKEN_ADDRESS as string).toLowerCase();
  }, [effectiveToken]);

  // 🔍 HARD preflight logging
  const preflightSnapshot = {
    paramTokenAddress: tokenAddress,
    normalizedToken: effectiveToken,
    paramChainId: chainId,
    appChainId, // from useAppChainId()
    networkChainId, // from exchangeContext.network
    appEffectiveChainId, // what we passed to usePublicClient
    publicClientChainId: publicClient?.chain?.id,
    effChainId,
    paramUserAddress: userAddress,
    activeAccount,
    chosenUser: user,
    hasPublicClient: !!publicClient,
  };

  debug.log?.('📊 preflight', preflightSnapshot);

  // 💡 Gate the query on `user`, `publicClient`, `effChainId`, and `effectiveToken`.
  const isEnabled = useMemo(() => {
    const base =
      !!publicClient && !!effChainId && !!effectiveToken && !!user;
    const finalEnabled =
      typeof enabled === 'boolean' ? base && enabled : base;

    const snapshot = {
      effChainId,
      hasUser: !!user,
      hasToken: !!effectiveToken,
      hasPublicClient: !!publicClient,
      base,
      finalEnabled,
    };

    debug.log?.('⚙️ isEnabled check', snapshot);

    return finalEnabled;
  }, [publicClient, effChainId, user, effectiveToken, enabled]);

  const keyString = isEnabled
    ? BALANCE_KEY(
        effChainId!,
        (user ??
          '0x0000000000000000000000000000000000000000') as Address,
        effectiveToken as Address,
      )
    : 'balance:disabled';

  const queryKey = useMemo<BalanceQueryKey>(
    () => [keyString] as const,
    [keyString],
  );

  const query = useQuery<
    BalanceFnData,
    BalanceError,
    BalanceData,
    BalanceQueryKey
  >({
    queryKey,
    enabled: isEnabled,
    staleTime: staleTimeMs,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    queryFn: async () => {
      debug.log?.('🚀 queryFn start', {
        effChainId,
        user,
        effectiveToken,
        isNative,
      });

      if (!publicClient || !effChainId || !user || !effectiveToken) {
        const parts = [
          'Preconditions not met in useGetBalance.queryFn',
          `publicClient: ${publicClient ? 'OK' : 'MISSING'}`,
          `effChainId  : ${String(effChainId)}`,
          `user        : ${String(user)}`,
          `token       : ${String(effectiveToken)}`,
        ];
        const errMsg = parts.join(' | ');
        console.error(errMsg);
        debug.warn?.(errMsg);
        throw new Error(errMsg);
      }

      try {
        if (isNative) {
          const bal = await publicClient.getBalance({
            address: user as Address,
          });
          debug.log?.(
            '💰 native balance',
            (bal as bigint).toString(),
          );
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

        debug.log?.('💰 erc20 balance', {
          balance: (bal as bigint).toString(),
          decimals: d,
        });

        return { balance: bal as bigint, decimals: Number(d) };
      } catch (e: unknown) {
        const err = e as { shortMessage?: string; message?: string };
        const msg = err.shortMessage ?? err.message ?? String(e);
        console.error('[useGetBalance] ⚠️ balance query failed', msg, e);
        debug.warn?.(`⚠️ balance query failed: ${msg}`);
        throw e;
      }
    },
    select: (data) => {
      const { balance, decimals } = data;
      const formatted =
        typeof decimals === 'number'
          ? formatUnits(balance, decimals)
          : undefined;

      debug.log?.('✅ select result', {
        balance: balance.toString(),
        decimals,
        formatted,
      });

      return {
        balance,
        decimals,
        formatted,
      };
    },
  });

  debug.log?.('🔁 hook return snapshot', {
    key: isEnabled ? keyString : undefined,
    isEnabled,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    hasError: !!query.error,
    error: query.error,
    balance: query.data?.balance?.toString(),
    decimals: query.data?.decimals,
    formatted: query.data?.formatted,
  });

  return {
    balance: query.data?.balance,
    decimals: query.data?.decimals,
    formatted: query.data?.formatted,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ?? null,
    refetch: query.refetch,
    key: isEnabled ? keyString : undefined,
  };
}
