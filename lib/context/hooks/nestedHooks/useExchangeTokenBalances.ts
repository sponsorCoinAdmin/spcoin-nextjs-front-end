// File: lib/context/hooks/nestedHooks/useExchangeTokenBalances.ts
'use client';

import { useEffect, useRef, useMemo } from 'react';
import type { Address} from 'viem';
import { erc20Abi } from 'viem';
import { usePublicClient } from 'wagmi';
import { useExchangeContext } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_BALANCES === 'true';
const debugLog = createDebugLogger('useExchangeTokenBalances', DEBUG_ENABLED, LOG_TIME);

// Polling cadence (keep modest to avoid RPC abuse)
const POLL_MS = 15_000;

function lower(a?: string | Address) {
  return a ? (a as string).toLowerCase() : undefined;
}

export function useExchangeTokenBalances() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const chainId = exchangeContext?.network?.chainId ?? 0;
  const account = exchangeContext?.accounts?.connectedAccount?.address as Address | undefined;

  const sellAddr = useMemo(
    () => lower(exchangeContext?.tradeData?.sellTokenContract?.address),
    [exchangeContext?.tradeData?.sellTokenContract?.address]
  );
  const buyAddr = useMemo(
    () => lower(exchangeContext?.tradeData?.buyTokenContract?.address),
    [exchangeContext?.tradeData?.buyTokenContract?.address]
  );

  const publicClient = usePublicClient({ chainId });

  // Used to ensure only the latest get writes results
  const reqIdRef = useRef(0);

  useEffect(() => {
    // Preconditions
    if (!publicClient || !account || (!sellAddr && !buyAddr) || chainId <= 0) {
      if (DEBUG_ENABLED) {
        debugLog.log('⏸️ Skipping balance poll', {
          hasClient: !!publicClient,
          hasAccount: !!account,
          sellAddr,
          buyAddr,
          chainId,
        });
      }
      return;
    }

    let cancelled = false;
    const myReqId = ++reqIdRef.current;

    const fetchOnce = async () => {
      try {
        const [sellBal, buyBal] = await Promise.all([
          sellAddr
            ? publicClient.readContract({
                address: sellAddr as Address,
                abi: erc20Abi,
                functionName: 'balanceOf',
                args: [account],
              }).catch((e) => {
                if (DEBUG_ENABLED) debugLog.warn('sell balanceOf failed', e);
                return null;
              })
            : null,
          buyAddr
            ? publicClient.readContract({
                address: buyAddr as Address,
                abi: erc20Abi,
                functionName: 'balanceOf',
                args: [account],
              }).catch((e) => {
                if (DEBUG_ENABLED) debugLog.warn('buy balanceOf failed', e);
                return null;
              })
            : null,
        ]);

        if (cancelled || myReqId !== reqIdRef.current) return;

        // Single consolidated context update; skip if nothing actually changed
        setExchangeContext((prev) => {
          const next = structuredClone(prev);
          let changed = false;

          const ctxSellAddr = lower(next.tradeData.sellTokenContract?.address);
          const ctxBuyAddr = lower(next.tradeData.buyTokenContract?.address);

          // Only write if addresses still match (avoid racing after token switch)
          if (sellAddr && ctxSellAddr === sellAddr && typeof sellBal === 'bigint') {
            const prevBal = next.tradeData.sellTokenContract?.balance ?? 0n;
            if (prevBal !== sellBal) {
              next.tradeData.sellTokenContract!.balance = sellBal;
              changed = true;
            }
          }
          if (buyAddr && ctxBuyAddr === buyAddr && typeof buyBal === 'bigint') {
            const prevBal = next.tradeData.buyTokenContract?.balance ?? 0n;
            if (prevBal !== buyBal) {
              next.tradeData.buyTokenContract!.balance = buyBal;
              changed = true;
            }
          }

          if (!changed) return prev;
          if (DEBUG_ENABLED) {
            debugLog.log('💾 Balances updated', {
              sell: sellAddr ? String(sellBal) : undefined,
              buy: buyAddr ? String(buyBal) : undefined,
            });
          }
          return next;
        }, 'balances:poll');
      } catch (err) {
        if (DEBUG_ENABLED) debugLog.error('❌ balance poll error', err);
      }
    };

    // Run immediately, then poll
    fetchOnce();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchOnce();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const t = setInterval(fetchOnce, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(t);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [publicClient, account, chainId, sellAddr, buyAddr, setExchangeContext]);

  // Hook returns nothing; UI reads balances from context
  return null;
}
