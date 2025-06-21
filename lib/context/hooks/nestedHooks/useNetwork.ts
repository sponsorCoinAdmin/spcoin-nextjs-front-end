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
  const { status } = useAccount();

  const setNetworkChainId = (newChainId: number) => {
    const old = exchangeContext.network?.chainId;
    if (old === newChainId) {
      debugLog.log(`⏭️ network.chainId unchanged: ${newChainId} — skipping update`);
      return;
    }
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
    if (old === logoURL) {
      debugLog.log(`⏭️ network.logoURL unchanged: ${logoURL} — skipping update`);
      return;
    }
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
    if (old === name) {
      debugLog.log(`⏭️ network.name unchanged: ${name} — skipping update`);
      return;
    }
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
    if (old === symbol) {
      debugLog.log(`⏭️ network.symbol unchanged: ${symbol} — skipping update`);
      return;
    }
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
    if (old === url) {
      debugLog.log(`⏭️ network.url unchanged: ${url} — skipping update`);
      return;
    }
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

    console.group(`🔁 useEffect([chainId=${chainId}, status=${status}])`);
    debugLog.log(`📊 Context chainId: ${contextChainId}, Initialized: ${isInitialized}, Mismatch: ${isMismatch}`);

    // ✅ 🔒 Prevent loops after hydration
    if (isInitialized && isMismatch) {
      debugLog.warn(
        `⚠️ Chain mismatch detected → context.chainId=${contextChainId}, wagmi.chainId=${chainId} → Skipping automatic context update`
      );
      console.groupEnd();
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

    console.groupEnd();
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
