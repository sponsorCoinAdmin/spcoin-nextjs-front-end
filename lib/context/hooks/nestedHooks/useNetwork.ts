// File: @/lib/context/hooks/nestedHooks/useNetwork.ts
'use client';

import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useExchangeContext , useAppChainId } from '@/lib/context/hooks';

import {
  getBlockChainName,
  getBlockChainLogoURL,
  getBlockExplorerURL,
} from '@/lib/utils/network';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_USE_NETWORK === 'true';
const debugLog = createDebugLogger('useNetwork', DEBUG_ENABLED, LOG_TIME);

export const useNetwork = () => {
  const { exchangeContext } = useExchangeContext();

  // ✅ App-level source of truth
  const [appChainId] = useAppChainId();

  // Wallet status (connected / disconnected)
  const { status } = useAccount();

  // Prefer appChainId, otherwise fallback to 0
  const chainId = appChainId || 0;

  const network = useMemo(() => {
    const ctxNet = exchangeContext?.network ?? ({} as any);

    const name    = ctxNet.name    || getBlockChainName(chainId)    || '';
    const logoURL = ctxNet.logoURL || getBlockChainLogoURL(chainId) || '';
    const url     = ctxNet.url     || getBlockExplorerURL(chainId)  || '';

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
        appChainId,
        status,
      });
    }

    return result;
  }, [exchangeContext?.network, chainId, status, appChainId]);

  return {
    network,
    chainId: network.chainId as number,
    name: network.name as string,
    logoURL: network.logoURL as string,
    url: network.url as string,
    connected: network.connected as boolean,
    status,
  };
};
