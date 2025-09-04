// File: lib/context/hooks/useAppChainId.ts
'use client';

import { useCallback, useEffect } from 'react';
import { useChainId as useWagmiChainId, useSwitchChain } from 'wagmi';
import { useExchangeContext } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_USE_APP_CHAIN_ID === 'true';

// Env flags
const MIRROR_WALLET_TO_APP_ON_INIT =
  process.env.NEXT_PUBLIC_MIRROR_WALLET_CHAIN_ID_ON_INIT !== 'false'; // default: true (only when appChainId==0)
const MIRROR_APP_TO_WALLET =
  process.env.NEXT_PUBLIC_MIRROR_APP_CHAIN_ID_TO_WALLET === 'true';   // default: false

const debugLog = createDebugLogger('useAppChainId', DEBUG_ENABLED, LOG_TIME);

/**
 * App-first chain id:
 * - Reads from exchangeContext.network.appChainId
 * - Optionally copies the wallet's chain ONCE on init if app value is 0
 * - Optionally mirrors app → wallet (if env flag enabled)
 * - Never writes to `network.chainId` while disconnected (that field = wallet-only)
 */
export function useAppChainId(): [number, (nextId: number) => void] {
  const walletChainId = useWagmiChainId(); // may be 0/undefined when disconnected
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const connected = !!exchangeContext?.network?.connected;
  const appChainId = exchangeContext?.network?.appChainId ?? 0;

  const { switchChain } = useSwitchChain();

  /* Wallet → App (only on first init when appChainId is 0) */
  useEffect(() => {
    if (!MIRROR_WALLET_TO_APP_ON_INIT) return;
    if (!walletChainId) return;      // wagmi not ready / disconnected
    if (appChainId !== 0) return;    // app already set; do NOT overwrite

    if (DEBUG_ENABLED) debugLog.log(`🔁 Init Wallet→App: 0 → ${walletChainId}`);
    setExchangeContext(prev => {
      const base = prev ?? {};
      const prevNetwork = (base as any).network ?? {};
      const currentApp = prevNetwork.appChainId ?? 0;
      if (currentApp === walletChainId) return prev;

      // Initialize the app preference from the wallet.
      // Do NOT force chainId here if disconnected; chainId is wallet-only.
      return {
        ...base,
        network: {
          ...prevNetwork,
          appChainId: walletChainId,
          // If connected, wallet owns chainId; otherwise leave as-is/undefined.
          chainId: connected ? walletChainId : prevNetwork.chainId,
        },
      } as typeof prev;
    });
    // Intentionally exclude `connected` so this only runs for the first-init path
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletChainId, appChainId, setExchangeContext]);

  /* App → Wallet (optional flag) */
  useEffect(() => {
    if (!MIRROR_APP_TO_WALLET) return;
    if (!connected) return;        // only when connected
    if (!appChainId) return;
    if (!walletChainId) return;
    if (appChainId === walletChainId) return;

    (async () => {
      try {
        if (DEBUG_ENABLED) debugLog.log(`🔁 App→Wallet: ${walletChainId} → ${appChainId}`);
        await switchChain?.({ chainId: appChainId });
      } catch (e) {
        debugLog.warn(`⚠️ switchChain failed`, e);
      }
    })();
  }, [appChainId, walletChainId, connected, switchChain]);

  /* Setter: update APP preference; never write chainId when disconnected */
  const setAppChainId = useCallback(
    (nextId: number) => {
      if (!(nextId > 0)) return;
      if (DEBUG_ENABLED)
        debugLog.log(`🛠️ setAppChainId(${nextId}) [connected=${connected}]`);

      setExchangeContext(prev => {
        const base = prev ?? {};
        const prevNetwork = (base as any).network ?? {};
        const prevApp = prevNetwork.appChainId ?? 0;

        // chainId is wallet-owned; only change appChainId here
        if (prevApp === nextId) return prev;

        return {
          ...base,
          network: {
            ...prevNetwork,
            appChainId: nextId,
            // Leave chainId untouched. When disconnected it's undefined;
            // when connected, wallet effects keep it in sync.
            chainId: prevNetwork.chainId,
          },
        } as typeof prev;
      });

      // Optional: request wallet switch only when the flag is on and connected
      if (connected && MIRROR_APP_TO_WALLET && switchChain && walletChainId !== nextId) {
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
    [connected, setExchangeContext, switchChain, walletChainId],
  );

  return [appChainId, setAppChainId];
}
