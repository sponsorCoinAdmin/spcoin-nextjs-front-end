// File: lib/context/hooks/useAppChainId.ts
'use client';

import { useCallback, useEffect } from 'react';
import { useChainId as useWagmiChainId, useSwitchChain } from 'wagmi';
import { useExchangeContext } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_USE_APP_CHAIN_ID === 'true';

// Env flags
const MIRROR_WALLET_TO_APP_ON_INIT =
  process.env.NEXT_PUBLIC_MIRROR_WALLET_CHAIN_ID_ON_INIT !== 'false'; // default: true (only when appChainId==0)
const MIRROR_APP_TO_WALLET =
  process.env.NEXT_PUBLIC_MIRROR_APP_CHAIN_ID_TO_WALLET === 'true';   // default: false

const debugLog = createDebugLogger('useAppChainId', DEBUG_ENABLED, LOG_TIME);

/**
 * App-first chain id:
 * - Reads from your exchangeContext.network.chainId
 * - Optionally copies the wallet's chain ONCE on init if app value is 0
 * - Optionally mirrors app → wallet (if env flag enabled)
 */
export function useAppChainId(): [number, (nextId: number) => void] {
  const walletChainId = useWagmiChainId(); // may be 0/undefined when disconnected
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const appChainId = exchangeContext?.network?.chainId ?? 0;

  const { switchChain } = useSwitchChain();

  /* Wallet → App (only on first init when appChainId is 0) */
  useEffect(() => {
    if (!MIRROR_WALLET_TO_APP_ON_INIT) return;
    if (!walletChainId) return;   // wagmi not ready / disconnected
    if (appChainId !== 0) return; // app already set; do NOT overwrite

    if (DEBUG_ENABLED) debugLog.log(`🔁 Init Wallet→App: 0 → ${walletChainId}`);
    setExchangeContext(prev => {
      const base = prev ?? {};
      const prevNetwork = (base as any).network ?? {};
      const current = prevNetwork.chainId ?? 0;
      if (current === walletChainId) return prev;
      return {
        ...base,
        network: { ...prevNetwork, chainId: walletChainId },
      } as typeof prev;
    });
  }, [walletChainId, appChainId, setExchangeContext]);

  /* App → Wallet (optional flag) */
  useEffect(() => {
    if (!MIRROR_APP_TO_WALLET) return;
    if (!appChainId) return;
    if (appChainId === walletChainId) return;

    (async () => {
      try {
        if (DEBUG_ENABLED) debugLog.log(`🔁 App→Wallet: ${walletChainId} → ${appChainId}`);
        await switchChain?.({ chainId: appChainId });
      } catch (e) {
        debugLog.warn(`⚠️ switchChain failed`, e);
      }
    })();
  }, [appChainId, walletChainId, switchChain]);

  /* Setter: update APP state; optionally request wallet switch (if flag on) */
  const setAppChainId = useCallback(
    (nextId: number) => {
      if (!(nextId > 0)) return;
      if (DEBUG_ENABLED) debugLog.log(`🛠️ setAppChainId(${nextId})`);

      setExchangeContext(prev => {
        const base = prev ?? {};
        const prevNetwork = (base as any).network ?? {};
        const current = prevNetwork.chainId ?? 0;
        if (current === nextId) return prev;
        return {
          ...base,
          network: { ...prevNetwork, chainId: nextId },
        } as typeof prev;
      });

      if (MIRROR_APP_TO_WALLET && switchChain && walletChainId !== nextId) {
        (async () => {
          try {
            if (DEBUG_ENABLED) debugLog.log(`↪️ Request wallet switch → ${nextId}`);
            await switchChain({ chainId: nextId });
          } catch (e) {
            debugLog.warn(`⚠️ switchChain request failed`, e);
          }
        })();
      }
    },
    [setExchangeContext, switchChain, walletChainId],
  );

  // 🔑 Return the APP value (no OR with wallet every render)
  return [appChainId, setAppChainId];
}
