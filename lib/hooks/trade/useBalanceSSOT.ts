// File: lib/hooks/trade/useBalanceSSOT.ts
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Address, PublicClient } from 'viem';
import { createPublicClient, http, isAddress, formatUnits, erc20Abi } from 'viem';
import { mainnet, polygon, arbitrum, base, optimism } from 'viem/chains';
export const USE_BALANCE_SSOT_BUILD = 'useBalanceSSOT@2025-10-24-1';
console.log('[useBalanceSSOT] MODULE_LOADED', USE_BALANCE_SSOT_BUILD);
type Params = {
  chainId: number;
  tokenAddress?: Address;     // ERC20; if undefined ⇒ native
  owner?: Address;
  decimalsHint?: number;
  enabled?: boolean;
};

const CHAIN_MAP: Record<number, any> = {
  1: mainnet,
  10: optimism,
  137: polygon,
  42161: arbitrum,
  8453: base,
};

function pickRpcUrl(chain: any): string {
  const pub = chain?.rpcUrls?.public?.http?.[0];
  const def = chain?.rpcUrls?.default?.http?.[0];
  return pub ?? def ?? '';
}

const CLIENT_CACHE = new Map<number, PublicClient & { __rpcUrl?: string }>();
function getPublicClient(chainId: number): PublicClient & { __rpcUrl?: string } {
  const cached = CLIENT_CACHE.get(chainId);
  if (cached) return cached;
  const chain = CHAIN_MAP[chainId] ?? mainnet;
  const rpcUrl = pickRpcUrl(chain);
  const client = createPublicClient({
    chain,
    transport: rpcUrl ? http(rpcUrl) : http(),
  }) as PublicClient & { __rpcUrl?: string };
  client.__rpcUrl = rpcUrl || '(viem http() default)';
  CLIENT_CACHE.set(chainId, client);
  return client;
}

/** in-flight caches keyed by primitives to dedupe duplicate calls */
const inflightDecimals = new Map<string, Promise<number>>();
const inflightBalances = new Map<string, Promise<bigint>>();

export function useBalanceSSOT({
  chainId,
  tokenAddress,
  owner,
  decimalsHint,
  enabled = true,
}: Params) {
  const [balance, setBalance]   = useState<bigint | null>(null);
  const [formatted, setFmt]     = useState<string>('0');
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError]       = useState<Error | null>(null);

  // 🧠 remember last committed values to skip redundant setState
  const lastRawRef = useRef<bigint | null>(null);
  const lastFmtRef = useRef<string>('0');

  const client = useMemo(() => {
    try {
      return getPublicClient(chainId);
    } catch (e) {
      console.error('[useBalanceSSOT] client error', e);
      return null;
    }
  }, [chainId]);

  // 🔑 stable key based on primitives (chain/token/owner)
  const queryKey = useMemo(() => {
    if (!chainId || !owner) return '';
    const t = tokenAddress ? tokenAddress.toLowerCase() : 'NATIVE';
    return `${chainId}:${t}:${owner.toLowerCase()}`;
  }, [chainId, tokenAddress, owner]);

  // Remember the last effective fetch (includes resolved decimals + rpc)
  const lastKeyRef = useRef<string>('');

  useEffect(() => {
    let cancelled = false;

    console.log('[useBalanceSSOT] EFFECT_RUN', {
      enabled, chainId, tokenAddress, owner, decimalsHint, queryKey,
    });

    async function run() {
      if (!enabled || !client) {
        if (!enabled) console.log('[useBalanceSSOT] SKIP_DISABLED');
        if (!client)  console.log('[useBalanceSSOT] SKIP_NO_CLIENT');
        return;
      }

      if (!owner || !isAddress(owner)) {
        console.warn('[useBalanceSSOT] EARLY_EXIT_INVALID_OWNER', { owner });
        if (lastRawRef.current !== null || lastFmtRef.current !== '0') {
          lastRawRef.current = null;
          lastFmtRef.current = '0';
          setBalance(null);
          setFmt('0');
        }
        setLoading(false);
        setError(null);
        return;
      }

      if (!queryKey) return;

      // 🧯 If inputs didn’t change, do nothing (prevents unchanged panel re-fetch)
      if (lastKeyRef.current.startsWith(queryKey + '|')) {
        console.log('[useBalanceSSOT] SKIP_UNCHANGED_KEY', {
          queryKey,
          lastEffectiveKey: lastKeyRef.current,
        });
        return;
      }

      try {
        console.log('[useBalanceSSOT] FETCH_START', {
          queryKey,
          hintDecimals: decimalsHint,
          rpcUrl: (client as any).__rpcUrl,
        });

        setLoading(true);
        setError(null);

        // Resolve decimals (hint → cached → on-chain)
        let decimals = typeof decimalsHint === 'number' ? decimalsHint : 18;

        if (tokenAddress && isAddress(tokenAddress) && typeof decimalsHint !== 'number') {
          const decKey = `${chainId}:${tokenAddress.toLowerCase()}`;
          let decPromise = inflightDecimals.get(decKey);
          if (!decPromise) {
            decPromise = client.readContract({
              address: tokenAddress,
              abi: erc20Abi,
              functionName: 'decimals',
            }) as Promise<number>;
            inflightDecimals.set(decKey, decPromise);
          }

          try {
            const d = await decPromise;
            if (typeof d === 'number') decimals = d;
            console.log('[useBalanceSSOT] decimals()', { tokenAddress, decimals });
          } catch (decErr) {
            console.warn('[useBalanceSSOT] decimals() failed, using hint/fallback', { tokenAddress, hint: decimalsHint, decErr });
          } finally {
            inflightDecimals.delete(decKey);
          }
        }

        // Fetch balance with in-flight dedupe
        let raw: bigint = 0n;

        if (tokenAddress && isAddress(tokenAddress)) {
          const balPromiseKey = queryKey; // chain + token + owner
          let balPromise = inflightBalances.get(balPromiseKey);
          if (!balPromise) {
            balPromise = client.readContract({
              address: tokenAddress,
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [owner],
            }) as Promise<bigint>;
            inflightBalances.set(balPromiseKey, balPromise);
          }

          try {
            raw = await balPromise;
            console.log('[useBalanceSSOT] balanceOf result', {
              chainId, tokenAddress, owner, raw: raw.toString(), decimals,
            });
          } finally {
            inflightBalances.delete(balPromiseKey);
          }
        } else {
          // native
          raw = await client.getBalance({ address: owner });
          decimals = 18;
          console.log('[useBalanceSSOT] native getBalance result', {
            chainId, owner, raw: raw.toString(), decimals,
          });
        }

        if (cancelled) return;

        const fmt = formatUnits(raw, decimals);

        // ✅ Only commit state if it actually changed
        const rawChanged = lastRawRef.current === null || raw !== lastRawRef.current;
        const fmtChanged = fmt !== lastFmtRef.current;

        if (rawChanged || fmtChanged) {
          lastRawRef.current = raw;
          lastFmtRef.current = fmt;
          setBalance(raw);
          setFmt(fmt);
          console.log('[useBalanceSSOT] SET_STATE_CHANGED', { fmt, raw: raw.toString() });
        } else {
          console.log('[useBalanceSSOT] SET_STATE_SKIPPED_SAME_VALUE', { fmt, raw: raw.toString() });
        }

        // 🔐 remember full effective key so identical inputs won’t refetch
        lastKeyRef.current = `${queryKey}|${decimals}|${(client as any).__rpcUrl}`;

        console.log('[useBalanceSSOT] FETCH_DONE', {
          effectiveKey: lastKeyRef.current,
          formatted: fmt,
        });
      } catch (e: any) {
        if (cancelled) return;
        setError(e);
        if (lastRawRef.current !== null || lastFmtRef.current !== '0') {
          lastRawRef.current = null;
          lastFmtRef.current = '0';
          setBalance(null);
          setFmt('0');
        }
        console.error('[useBalanceSSOT] ERROR', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [enabled, chainId, tokenAddress, owner, decimalsHint, queryKey]);

  return { balance, formatted, isLoading, error };
}
