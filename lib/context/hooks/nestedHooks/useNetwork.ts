// File: lib/context/hooks/nestedHooks/useNetwork.ts
'use client';

import { useMemo } from 'react';
import { useAppChainId, useAccount } from 'wagmi';
import { useExchangeContext } from '@/lib/context/hooks';
import {
  getBlockChainName,
  getBlockChainLogoURL,
  getBlockExplorerURL,
} from '@/lib/network/utils';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_USE_NETWORK === 'true';
const debugLog = createDebugLogger('useNetwork', DEBUG_ENABLED, LOG_TIME);

export const useNetwork = () => {
  const { exchangeContext } = useExchangeContext();

  // External single sources of truth
  const wagmiChainId = useAppChainId();
  const { status } = useAccount(); // 'connected' | 'connecting' | 'disconnected'

  // Prefer context.chainId (kept in sync by ExchangeProvider watcher);
  // fall back to wagmiChainId if context isn’t ready yet.
  const chainId = exchangeContext?.network?.chainId ?? wagmiChainId ?? 0;

  const network = useMemo(() => {
    const ctxNet = exchangeContext?.network ?? ({} as any);

    // Derive display fields from chainId if not present in context
    const name = ctxNet.name || getBlockChainName(chainId) || '';
    const logoURL = ctxNet.logoURL || getBlockChainLogoURL(chainId) || '';
    const url = ctxNet.url || getBlockExplorerURL(chainId) || '';

    // Connected is read-only here; prefer wagmi status
    const connected = status === 'connected';

    const result = {
      ...ctxNet,
      chainId,
      name,
      logoURL,
      url,
      connected,
    };

    if (DEBUG_ENABLED) {
      debugLog.log('🔎 useNetwork computed', {
        ctx: ctxNet,
        result,
        wagmiChainId,
        status,
      });
    }

    return result;
  }, [exchangeContext?.network, chainId, status, wagmiChainId]);

  // Expose a simple, stable API (no setters → no side effects)
  return {
    network,
    chainId: network.chainId as number,
    name: network.name as string,
    logoURL: network.logoURL as string,
    url: network.url as string,
    connected: network.connected as boolean,
    status, // passthrough if callers care
  };
};
