'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Address, PublicClient } from 'viem';
import { createPublicClient, http, isAddress, formatUnits, erc20Abi } from 'viem';
import { mainnet, polygon, arbitrum, base, optimism } from 'viem/chains';

const TRACE_BALANCE = process.env.NEXT_PUBLIC_TRACE_BALANCE === 'true';

type Params = {
  chainId: number;
  tokenAddress?: Address;  // ERC20; if undefined ⇒ native
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

const CLIENT_CACHE = new Map<number, any>();

function getPublicClient(chainId: number): PublicClient & { __rpcUrl?: string } {
  if (CLIENT_CACHE.has(chainId)) return CLIENT_CACHE.get(chainId);
  const chain = CHAIN_MAP[chainId] ?? mainnet;
  const rpcUrl = pickRpcUrl(chain);
  const client = createPublicClient({ chain, transport: rpcUrl ? http(rpcUrl) : http() }) as PublicClient & { __rpcUrl?: string };
  client.__rpcUrl = rpcUrl || '(viem http() default)';
  CLIENT_CACHE.set(chainId, client);
  return client;
}

/** simple in-flight caches keyed by primitives to dedupe duplicate calls */
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

  const client = useMemo(() => {
    try {
      return getPublicClient(chainId);
    } catch (e) {
      if (TRACE_BALANCE) console.error('[TRACE][useBalanceSSOT] client error', e);
      return null;
    }
  }, [chainId]); // 👈 stable by chainId only

  // 🔑 stable key: only based on primitives; if key doesn’t change, skip all network work
  const queryKey = useMemo(() => {
    if (!chainId || !owner) return '';
    const t = tokenAddress ? tokenAddress.toLowerCase() : 'NATIVE';
    return `${chainId}:${t}:${owner.toLowerCase()}`;
  }, [chainId, tokenAddress, owner]);

  // Remember the last “effective” key we fetched (including decimals used + rpc)
  const lastKeyRef = useRef<string>('');

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!enabled || !client) return;

      if (!owner || !isAddress(owner)) {
        console.warn('[useBalanceSSOT] SKIP — owner missing/invalid', { owner });
        setBalance(null); setFmt('0'); setLoading(false); setError(null);
        return;
      }

      if (!queryKey) return;

      // 🧯 If inputs didn’t change, do nothing (prevents unchanged panel refetch)
      if (lastKeyRef.current.startsWith(queryKey + '|')) return;

      try {
        setLoading(true);
        setError(null);

        // 1) determine decimals (hint → cached → on-chain)
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
            if (TRACE_BALANCE) console.log('[useBalanceSSOT] decimals()', { tokenAddress, decimals });
          } catch (decErr) {
            console.warn('[useBalanceSSOT] decimals() failed, using hint/fallback', { tokenAddress, hint: decimalsHint, decErr });
          } finally {
            inflightDecimals.delete(decKey);
          }
        }

        // 2) fetch balance (ERC20 or native), with in-flight dedupe
        let raw: bigint = 0n;

        if (tokenAddress && isAddress(tokenAddress)) {
          const balPromiseKey = queryKey; // includes owner+token+chain
          let balPromise = inflightBalances.get(balPromiseKey);
          if (!balPromise) {
            if (TRACE_BALANCE) {
              console.log('[useBalanceSSOT] balanceOf params', {
                chainId, tokenAddress, owner, rpcUrl: (client as any).__rpcUrl,
              });
            }
            balPromise = client.readContract({
              address: tokenAddress,
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [owner],
            }) as Promise<bigint>;
            inflightBalances.set(balPromiseKey, balPromise);
          }

          raw = await balPromise;
          inflightBalances.delete(balPromiseKey);

          if (TRACE_BALANCE) {
            console.log('[useBalanceSSOT] balanceOf result', {
              chainId, tokenAddress, owner, raw: raw.toString(), decimals,
            });
          }
        } else {
          // native
          if (TRACE_BALANCE) {
            console.log('[useBalanceSSOT] native getBalance params', {
              chainId, owner, rpcUrl: (client as any).__rpcUrl,
            });
          }
          raw = await client.getBalance({ address: owner });
          decimals = 18;

          if (TRACE_BALANCE) {
            console.log('[useBalanceSSOT] native getBalance result', {
              chainId, owner, raw: raw.toString(), decimals,
            });
          }
        }

        if (cancelled) return;

        const fmt = formatUnits(raw, decimals);
        setBalance(raw);
        setFmt(fmt);

        // 🔐 remember the full effective key so the same inputs won’t refetch
        lastKeyRef.current = `${queryKey}|${decimals}|${(client as any).__rpcUrl}`;
      } catch (e: any) {
        if (cancelled) return;
        setError(e);
        setBalance(null);
        setFmt('0');
        console.error('[useBalanceSSOT] ERROR', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  // 👇 Only primitives & hint/enabled; DO NOT include `client` object
  }, [enabled, chainId, tokenAddress, owner, decimalsHint, queryKey]);

  return { balance, formatted, isLoading, error };
}
