'use client';

import { useEffect } from 'react';
import { useChainId, useAccount } from 'wagmi';
import { useExchangeContext } from '@/lib/context/hooks';
import {
  getBlockChainName,
  getBlockChainLogoURL,
  getBlockExplorerURL,
} from '@/lib/network/utils';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { debugHookChange } from '@/lib/utils/debugHookChange';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_USE_NETWORK === 'true';
const debugLog = createDebugLogger('useNetwork', DEBUG_ENABLED, LOG_TIME);

export const useNetwork = () => {
  const { exchangeContext, setExchangeContext: updateExchangeContext } = useExchangeContext();
  const chainId = useChainId();
  const { status } = useAccount(); // 'connected' | 'connecting' | 'disconnected'

  const setNetworkChainId = (newChainId: number) => {
    const old = exchangeContext.network?.chainId;
    debugHookChange('network.chainId', old, newChainId);
    debugLog.log(`reason: useNetwork updating network.chainId from ${old} to ${newChainId}`);

    updateExchangeContext(
      (prev) => ({
        ...prev,
        network: {
          ...prev.network,
          chainId: newChainId,
        },
      }),
      `reason: useNetwork updating network.chainId from ${old} to ${newChainId}`
    );
  };

  const setNetworkLogoURL = (logoURL?: string) => {
    const old = exchangeContext.network?.logoURL;
    debugHookChange('network.logoURL', old, logoURL);
    debugLog.log(`reason: useNetwork updating network.logoURL from ${old} to ${logoURL}`);

    updateExchangeContext(
      (prev) => ({
        ...prev,
        network: {
          ...prev.network,
          logoURL: logoURL || '',
        },
      }),
      `reason: useNetwork updating network.logoURL from ${old} to ${logoURL}`
    );
  };

  const setNetworkName = (name?: string) => {
    const old = exchangeContext.network?.name;
    debugHookChange('network.name', old, name);
    debugLog.log(`reason: useNetwork updating network.name from ${old} to ${name}`);

    updateExchangeContext(
      (prev) => ({
        ...prev,
        network: {
          ...prev.network,
          name: name || '',
        },
      }),
      `reason: useNetwork updating network.name from ${old} to ${name}`
    );
  };

  const setNetworkSymbol = (symbol?: string) => {
    const old = exchangeContext.network?.symbol;
    debugHookChange('network.symbol', old, symbol);
    debugLog.log(`reason: useNetwork updating network.symbol from ${old} to ${symbol}`);

    updateExchangeContext(
      (prev) => ({
        ...prev,
        network: {
          ...prev.network,
          symbol: symbol || '',
        },
      }),
      `reason: useNetwork updating network.symbol from ${old} to ${symbol}`
    );
  };

  const setNetworkURL = (url?: string) => {
    const old = exchangeContext.network?.url;
    debugHookChange('network.url', old, url);
    debugLog.log(`reason: useNetwork updating network.url from ${old} to ${url}`);

    updateExchangeContext(
      (prev) => ({
        ...prev,
        network: {
          ...prev.network,
          url: url || '',
        },
      }),
      `reason: useNetwork updating network.url from ${old} to ${url}`
    );
  };

  const setNetworkConnected = (connected: boolean) => {
    const old = exchangeContext.network?.connected;

    if (old === connected) {
      debugLog.log(`⏭️ network.connected unchanged: ${connected} — skipping update`);
      return;
    }

    debugHookChange('network.connected', old, connected);
    debugLog.log(`reason: useNetwork updating network.connected from ${old} to ${connected}`);

    updateExchangeContext(
      (prev) => ({
        ...prev,
        network: {
          ...prev.network,
          connected,
        },
      }),
      `reason: useNetwork updating network.connected from ${old} to ${connected}`
    );
  };

  useEffect(() => {
    if (!chainId) return;

    const contextChainId = exchangeContext.network?.chainId;
    const isInitialized = typeof contextChainId === 'number' && contextChainId > 0;
    const isMismatch = chainId !== contextChainId;

    debugLog.log(`🔁 useEffect([chainId=${chainId}, status=${status}]) triggered`);
    debugLog.log(`📊 Context chainId: ${contextChainId}, Initialized: ${isInitialized}, Mismatch: ${isMismatch}`);

    if (isInitialized && isMismatch) {
      debugLog.warn(
        `⚠️ Chain mismatch detected → context.chainId=${contextChainId}, wagmi.chainId=${chainId} → Skipping automatic context update`
      );
      return;
    }

    debugLog.log(`✅ Accepting wagmi.chainId: ${chainId} → Updating context`);

    const name = getBlockChainName(chainId);
    const logoURL = getBlockChainLogoURL(chainId);
    const url = getBlockExplorerURL(chainId);
    const connected = status === 'connected';

    setNetworkChainId(chainId);
    setNetworkName(name);
    setNetworkLogoURL(logoURL);
    setNetworkURL(url);
    setNetworkConnected(connected);
  }, [chainId, status]);

  return {
    network: exchangeContext.network,
    setNetworkChainId,
    setNetworkLogoURL,
    setNetworkName,
    setNetworkSymbol,
    setNetworkURL,
    setNetworkConnected,
  };
};
