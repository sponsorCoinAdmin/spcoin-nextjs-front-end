// File: lib/hooks/useGetBalance.ts
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
import { useExchangeContext } from '@/lib/context/hooks';

const LOG_TIME = false;
// Ignore env flag for now – we want HARD logging while debugging
const DEBUG_ENABLED = true;
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

// Types flowing through the query
type BalanceFnData = { balance: bigint; decimals: number };
type BalanceData = { balance: bigint; decimals: number; formatted?: string };
type BalanceError = Error;
type BalanceQueryKey = readonly [string];

export type UseGetBalanceParams = {
  /** token address; falsy => treat as native token */
  tokenAddress?: Address | null;
  /** override chainId; defaults to appChainId → publicClient.chain.id */
  chainId?: number;
  /**
   * account address to read for
   * - if omitted, defaults to exchangeContext.accounts.appAccount.address
   */
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

  // Prefer appAccount from ExchangeContext if no explicit userAddress is passed
  const { exchangeContext } = useExchangeContext();
  const appAddr = exchangeContext.accounts?.appAccount
    ?.address as Address | undefined;

  const appChainId = exchangeContext.network?.appChainId;

  // Canonicalize inputs: userAddress > appAccount
  const user = (userAddress ?? appAddr ?? null) as Address | null;

  const effChainId = chainId ?? appChainId ?? publicClient?.chain?.id;

  const effectiveToken: Address | null = useMemo(() => {
    // If no token provided, treat as native
    const addr = (tokenAddress ?? NATIVE_TOKEN_ADDRESS) as Address;
    return normalizeTokenAddress(addr);
  }, [tokenAddress]);

  const isNative = useMemo(() => {
    if (!effectiveToken) return false;
    return (effectiveToken as string).toLowerCase() ===
      (NATIVE_TOKEN_ADDRESS as string).toLowerCase();
  }, [effectiveToken]);

  // 🔍 HARD preflight logging (always)
  const preflightSnapshot = {
    paramTokenAddress: tokenAddress,
    normalizedToken: effectiveToken,
    paramChainId: chainId,
    appChainId,
    publicClientChainId: publicClient?.chain?.id,
    effChainId,
    paramUserAddress: userAddress,
    appAddr,
    chosenUser: user,
    hasPublicClient: !!publicClient,
  };

  console.log('[useGetBalance] 📊 preflight', preflightSnapshot);
  debug.log?.('📊 preflight', preflightSnapshot);

  const reportParamError = (reason: string) => {
    const lines: string[] = [];
    lines.push('*** ERROR *** useGetBalance: missing or invalid parameter');
    lines.push(`Reason: ${reason}`);
    lines.push('');
    lines.push(`param.tokenAddress     : ${String(tokenAddress)}`);
    lines.push(`normalizedToken        : ${String(effectiveToken)}`);
    lines.push(`param.chainId          : ${String(chainId)}`);
    lines.push(`appChainId             : ${String(appChainId)}`);
    lines.push(`effChainId             : ${String(effChainId)}`);
    lines.push(`param.userAddress      : ${String(userAddress)}`);
    lines.push(`appAddr (appAccount)   : ${String(appAddr)}`);
    lines.push(`chosenUser             : ${String(user)}`);
    lines.push(`hasPublicClient        : ${publicClient ? 'true' : 'false'}`);

    const msg = lines.join('\n');
    console.error(msg);
    debug.warn?.(msg);

    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      // eslint-disable-next-line no-alert
      window.alert(msg);
    }
  };

  if (!publicClient) {
    reportParamError('publicClient is null/undefined');
  }
  if (!effChainId) {
    reportParamError('effChainId is null/0 (no chainId resolved)');
  }
  if (!user) {
    reportParamError('user (account address) is null/undefined');
  }
  if (!effectiveToken) {
    reportParamError('effectiveToken is null/undefined');
  }
  if (!tokenAddress) {
    // This is allowed (native token), but we still log loudly so you see it.
    reportParamError(
      'param.tokenAddress is falsy (using NATIVE_TOKEN_ADDRESS fallback)',
    );
  }

  // 💡 IMPORTANT: do NOT gate on user here so queryFn is forced to run and surface errors
  const isEnabled = useMemo(() => {
    const base = !!publicClient && !!effChainId && !!effectiveToken;
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

    console.log('[useGetBalance] ⚙️ isEnabled check', snapshot);
    debug.log?.('⚙️ isEnabled check', snapshot);

    return finalEnabled;
  }, [publicClient, effChainId, user, effectiveToken, enabled]);

  // Always provide a key with a stable tuple shape to keep TS inference happy
  const keyString = isEnabled
    ? BALANCE_KEY(effChainId!, (user ?? '0x0000000000000000000000000000000000000000') as Address, effectiveToken as Address)
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
      console.log('[useGetBalance] 🚀 queryFn start', {
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
          console.log(
            '[useGetBalance] 💰 native balance',
            bal.toString(),
          );
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

        console.log(
          '[useGetBalance] 💰 erc20 balance',
          (bal as bigint).toString(),
          'decimals=',
          d,
        );
        debug.log?.(
          `💰 erc20 balance -> ${(bal as bigint).toString()} (decimals=${d})`,
        );
        return { balance: bal as bigint, decimals: Number(d) };
      } catch (e: any) {
        const msg = e?.shortMessage || e?.message || String(e);
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

      console.log('[useGetBalance] ✅ select result', {
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

  console.log('[useGetBalance] 🔁 hook return snapshot', {
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
    error: (query.error as BalanceError) ?? null,
    refetch: query.refetch,
    key: isEnabled ? keyString : undefined,
  };
}
