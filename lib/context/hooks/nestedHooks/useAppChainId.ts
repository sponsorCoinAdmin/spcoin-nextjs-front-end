// File: lib/context/hooks/useAppChainId.ts
'use client';

import { useEffect } from 'react';
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
 * - Setter delegates to `setAppChainId` from ExchangeContext (via useProviderSetters)
 */
export function useAppChainId(): [number, (nextId: number) => void] {
  const walletChainId = useWagmiChainId(); // may be 0/undefined when disconnected
  const { exchangeContext, setAppChainId } = useExchangeContext();

  const connected = !!exchangeContext?.network?.connected;
  const appChainId = exchangeContext?.network?.appChainId ?? 0;

  const { switchChain } = useSwitchChain();

  /* Wallet → App (only on first init when appChainId is 0) */
  useEffect(() => {
    if (!MIRROR_WALLET_TO_APP_ON_INIT) return;
    if (!walletChainId) return;      // wagmi not ready / disconnected
    if (appChainId !== 0) return;    // app already set; do NOT overwrite

    debugLog.log(`🛠️ wallet→app init → 0 → ${walletChainId}`);
    setAppChainId(walletChainId); // ExchangeProvider logs again when state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletChainId, appChainId]);

  /* App → Wallet (optional flag) */
  useEffect(() => {
    if (!MIRROR_APP_TO_WALLET) return;
    if (!connected) return;        // only when connected
    if (!appChainId) return;
    if (!walletChainId) return;
    if (appChainId === walletChainId) return;

    (async () => {
      try {
        debugLog.log(`🛠️ app→wallet mirror → ${walletChainId} → ${appChainId}`);
        await switchChain?.({ chainId: appChainId });
      } catch (e) {
        debugLog.warn(`⚠️ switchChain failed`, e);
      }
    })();
  }, [appChainId, walletChainId, connected, switchChain]);

  /** Thin wrapper around ExchangeProvider setter with extra debug logging */
  const wrappedSetAppChainId = (nextId: number) => {
    debugLog.log(`🛠️ setAppChainId → ${nextId}`);
    setAppChainId(nextId); // ExchangeProvider logs again when state changes
  };

  return [appChainId, wrappedSetAppChainId];
}
