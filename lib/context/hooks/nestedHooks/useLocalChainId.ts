// File: @/lib/context/hooks/nestedHooks/useAppChainId.ts
'use client';

import { useCallback } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { useExchangeContext } from '@/lib/context/hooks';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import {
  getBlockChainName,
  getBlockChainLogoURL,
  getBlockExplorerURL,
} from '../../helpers/NetworkHelpers';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_USE_LOCAL_CHAIN_ID === 'true';
const debugLog = createDebugLogger('useAppChainId', DEBUG_ENABLED, LOG_TIME);

/**
 * Canonical app chainId hook.
 *
 * Returns `[appChainId, setAppChainId]`
 * - `appChainId`: number (current authoritative chainId from ExchangeProvider)
 * - `setAppChainId`: function to update it
 *    - If connected → requests wallet switch via wagmi
 *    - If disconnected → updates ExchangeContext locally
 */
export const useAppChainId = (): [number, (newChainId: number) => Promise<void>] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const { isConnected } = useAccount();
  const { switchChain } = useSwitchChain();

  const appChainId = exchangeContext?.network?.chainId ?? 1;
  if (DEBUG_ENABLED) debugLog.log(`📦 useAppChainId → ${appChainId}`);

  const setAppChainId = useCallback(
    async (newChainId: number) => {
      if (DEBUG_ENABLED) {
        debugLog.log(`🔁 setAppChainId → ${newChainId}, isConnected=${isConnected}`);
      }

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
        // don’t force connected=true
        return next;
      }, 'ui:setAppChainId(disconnected)');
    },
    [isConnected, switchChain, setExchangeContext]
  );

  return [appChainId, setAppChainId];
};
