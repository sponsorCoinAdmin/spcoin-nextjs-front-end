// File: lib/context/hooks/useAppChainId.ts
'use client';

import { useCallback, useEffect, useMemo } from 'react';
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

export function useAppChainId(): [number, (nextId: number) => void] {
  const walletChainId = useWagmiChainId(); // 0 while unresolved/SSR
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const appChainId = exchangeContext?.network?.chainId ?? 0;

  const { switchChain } = useSwitchChain();

  // Prefer the APP’s chain id; fall back to wallet; then 0
  const effectiveId = useMemo<number>(
    () => (appChainId || walletChainId || 0),
    [appChainId, walletChainId]
  );

  /* Wallet → App (only on first init when appChainId is 0) */
  useEffect(() => {
    if (!MIRROR_WALLET_TO_APP_ON_INIT) return;
    if (!walletChainId) return;         // wagmi not ready
    if (appChainId !== 0) return;       // app already set explicitly; do NOT overwrite

    if (DEBUG_ENABLED) debugLog.log(`🔁 Init Wallet→App: 0 → ${walletChainId}`);

    setExchangeContext(prev => {
      const current = prev?.network?.chainId ?? 0;
      if (current === walletChainId) return prev; // no-op
      const next = structuredClone(prev);
      next.network = { ...next.network, chainId: walletChainId };
      return next;
    });
  }, [walletChainId, appChainId, setExchangeContext]);

  /* App → Wallet (optional) */
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

  /* Setter: update app state; optionally request wallet switch */
  const setAppChainId = useCallback(
    (nextId: number) => {
      if (!(nextId > 0)) return;
      if (DEBUG_ENABLED) debugLog.log(`🛠️ setAppChainId(${nextId})`);

      setExchangeContext(prev => {
        const current = prev?.network?.chainId ?? 0;
        if (current === nextId) return prev;
        const next = structuredClone(prev);
        next.network = { ...next.network, chainId: nextId };
        return next;
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

  return [effectiveId, setAppChainId];
}
