// File: lib/hooks/trade/useBalanceSSOT.ts
'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Address, PublicClient } from 'viem';
import { createPublicClient, http, isAddress, formatUnits, erc20Abi } from 'viem';
import { mainnet, polygon, arbitrum, base, optimism } from 'viem/chains';

// 🧹 DEBUG SWITCH (kept, but key logs below are unconditional)
// TODO(TRACE_CLEANUP): remove this flag & any gated logs when done.
const TRACE_BALANCE = process.env.NEXT_PUBLIC_TRACE_BALANCE === 'true';

type Params = {
  chainId: number;
  tokenAddress?: Address;  // ERC20 address; if undefined => native balance
  owner?: Address;         // who to query balance for
  decimalsHint?: number;
  enabled?: boolean;
};

// Simple chain map (extend as needed)
// TODO(TRACE_CLEANUP): move to a shared chains util after debugging.
const CHAIN_MAP: Record<number, any> = {
  1: mainnet,
  10: optimism,
  137: polygon,
  42161: arbitrum,
  8453: base,
};

// Choose a concrete RPC URL for the chain
function pickRpcUrl(chain: any): string {
  const pub = chain?.rpcUrls?.public?.http?.[0];
  const def = chain?.rpcUrls?.default?.http?.[0];
  return pub ?? def ?? '';
}

// ✅ Generic-safe cache: type-erased to avoid cross-chain PublicClient generic conflicts.
// (We also stash the rpc url for logging as __rpcUrl.)
const CLIENT_CACHE = new Map<number, any>();

function getPublicClient(chainId: number): PublicClient & { __rpcUrl?: string } {
  if (CLIENT_CACHE.has(chainId)) return CLIENT_CACHE.get(chainId) as PublicClient & { __rpcUrl?: string };
  const chain = CHAIN_MAP[chainId] ?? mainnet; // fallback to mainnet if unknown
  const rpcUrl = pickRpcUrl(chain);

  if (!rpcUrl) {
    // TODO(TRACE_CLEANUP)
    console.warn('[useBalanceSSOT] No RPC URL available for chainId', chainId, '— falling back to viem default http(). This may return 0 or fail.');
  }

  const client = createPublicClient({
    chain,
    transport: rpcUrl ? http(rpcUrl) : http(),
  }) as PublicClient & { __rpcUrl?: string };

  client.__rpcUrl = rpcUrl || '(viem http() default)';
  CLIENT_CACHE.set(chainId, client);
  return client;
}

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

  // TODO(TRACE_CLEANUP) (gated)
  if (TRACE_BALANCE) {
    // eslint-disable-next-line no-console
    console.log('[TRACE][useBalanceSSOT] IN', { chainId, tokenAddress, owner, decimalsHint, enabled });
  }

  const client = useMemo(() => {
    try {
      return getPublicClient(chainId);
    } catch (e) {
      // TODO(TRACE_CLEANUP)
      if (TRACE_BALANCE) console.error('[TRACE][useBalanceSSOT] client error', e);
      return null;
    }
  }, [chainId]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!enabled || !client) return;

      if (!owner || !isAddress(owner)) {
        // TODO(TRACE_CLEANUP)
        console.warn('[useBalanceSSOT] SKIP — owner missing/invalid', { owner }); // always-on
        setBalance(null);
        setFmt('0');
        setLoading(false);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let raw: bigint = 0n;
        let decimals = typeof decimalsHint === 'number' ? decimalsHint : 18;

        if (tokenAddress && isAddress(tokenAddress)) {
          // ERC20 path
          // Always-on pre-call param log:
          // TODO(TRACE_CLEANUP)
          console.log('[useBalanceSSOT] balanceOf params', {
            chainId,
            tokenAddress,
            owner,
            rpcUrl: (client as any).__rpcUrl,
          });

          // Try to read decimals (best-effort)
          try {
            const maybeDecimals = await client.readContract({
              address: tokenAddress,
              abi: erc20Abi,
              functionName: 'decimals',
            });
            if (typeof maybeDecimals === 'number') decimals = maybeDecimals;
            // TODO(TRACE_CLEANUP)
            console.log('[useBalanceSSOT] decimals()', { tokenAddress, decimals }); // always-on
          } catch (decErr) {
            // TODO(TRACE_CLEANUP)
            console.warn('[useBalanceSSOT] decimals() failed, using hint', { tokenAddress, hint: decimalsHint, err: decErr });
          }

          raw = await client.readContract({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [owner],
          });

          // Always-on result log:
          // TODO(TRACE_CLEANUP)
          console.log('[useBalanceSSOT] balanceOf result', {
            chainId,
            tokenAddress,
            owner,
            raw: raw.toString(),
            decimals,
          });
        } else {
          // Native path
          // Always-on pre-call param log:
          // TODO(TRACE_CLEANUP)
          console.log('[useBalanceSSOT] native getBalance params', {
            chainId,
            owner,
            rpcUrl: (client as any).__rpcUrl,
          });

          raw = await client.getBalance({ address: owner });
          decimals = 18;

          // Always-on result log:
          // TODO(TRACE_CLEANUP)
          console.log('[useBalanceSSOT] native getBalance result', {
            chainId,
            owner,
            raw: raw.toString(),
            decimals,
          });
        }

        if (cancelled) return;

        const fmt = formatUnits(raw, decimals);
        setBalance(raw);
        setFmt(fmt);

        // TODO(TRACE_CLEANUP) (gated)
        if (TRACE_BALANCE) {
          // eslint-disable-next-line no-console
          console.log('[TRACE][useBalanceSSOT] OUT', { raw: raw.toString(), formatted: fmt, decimals });
        }
      } catch (e: any) {
        if (cancelled) return;
        setError(e);
        setBalance(null);
        setFmt('0');

        // Always-on error log:
        // TODO(TRACE_CLEANUP)
        console.error('[useBalanceSSOT] ERROR', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [enabled, client, chainId, tokenAddress, owner, decimalsHint]);

  return { balance, formatted, isLoading, error };
}
