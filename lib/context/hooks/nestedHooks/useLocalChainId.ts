// File: lib/context/hooks/nestedHooks/useLocalChainId.ts
'use client';

import { useCallback } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { useExchangeContext } from '@/lib/context/hooks';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { getBlockChainName, getBlockChainLogoURL, getBlockExplorerURL } from '../../helpers/NetworkHelpers';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_USE_LOCAL_CHAIN_ID === 'true';
const debugLog = createDebugLogger('useLocalChainId', DEBUG_ENABLED, LOG_TIME);

/** Read the app’s authoritative chainId from ExchangeProvider */
export const useLocalChainId = (): number => {
  const { exchangeContext } = useExchangeContext();
  const id = exchangeContext?.network?.chainId ?? 1;
  if (DEBUG_ENABLED) debugLog.log(`📦 useLocalChainId → ${id}`);
  return id;
};

/**
 * Set the app’s chain:
 * - If connected, request wallet switch (wagmi).
 * - If disconnected, update ExchangeContext locally (persisted) so UI/logic use it.
 */
export const useSetLocalChainId = (): ((newChainId: number) => Promise<void>) => {
  const { isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const { setExchangeContext } = useExchangeContext();

  return useCallback(
    async (newChainId: number) => {
      if (DEBUG_ENABLED) debugLog.log(`🔁 setLocalChainId → ${newChainId}, isConnected=${isConnected}`);

      if (isConnected && switchChain) {
        try {
          switchChain({ chainId: newChainId });
          if (DEBUG_ENABLED) debugLog.log(`✅ switchChain invoked → ${newChainId}`);
        } catch (err: unknown) {
          debugLog.error(`❌ switchChain failed: ${(err as Error)?.message || String(err)}`);
        }
        return;
      }

      // Disconnected: update local context so app uses this chain
      setExchangeContext((prev) => {
        const next = structuredClone(prev);
        next.network.chainId = newChainId;
        next.network.name = getBlockChainName(newChainId) || '';
        next.network.logoURL = getBlockChainLogoURL(newChainId) || '';
        next.network.url = getBlockExplorerURL(newChainId) || '';
        // NOTE: do not force connected=true here
        return next;
      }, 'ui:setLocalChainId(disconnected)');
    },
    [isConnected, switchChain, setExchangeContext]
  );
};
