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
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const chainId = useChainId();
  const { status } = useAccount(); // 'connected' | 'connecting' | 'disconnected'

  const setNetworkChainId = (newChainId: number) => {
    const oldChainId = exchangeContext.network?.chainId;
    debugHookChange('network.chainId', oldChainId, newChainId);
    debugLog.log(`⚙️ setNetworkChainId → ${newChainId}`);

    const preview = {
      ...exchangeContext,
      network: {
        ...exchangeContext.network,
        chainId: newChainId,
      },
    };
    debugLog.log(`📤 Preview BEFORE setExchangeContext(chainId):`, preview);

    setExchangeContext(() => preview);
  };

  const setNetworkLogoURL = (logoURL?: string) => {
    const oldLogo = exchangeContext.network?.logoURL;
    debugHookChange('network.logoURL', oldLogo, logoURL);
    debugLog.log(`🖼️ setNetworkLogoURL → ${logoURL}`);

    const preview = {
      ...exchangeContext,
      network: {
        ...exchangeContext.network,
        logoURL: logoURL || '',
      },
    };
    debugLog.log(`📤 Preview BEFORE setExchangeContext(logoURL):`, preview);

    setExchangeContext(() => preview);
  };

  const setNetworkName = (name?: string) => {
    const oldName = exchangeContext.network?.name;
    debugHookChange('network.name', oldName, name);
    debugLog.log(`🧾 setNetworkName → ${name}`);

    const preview = {
      ...exchangeContext,
      network: {
        ...exchangeContext.network,
        name: name || '',
      },
    };
    debugLog.log(`📤 Preview BEFORE setExchangeContext(name):`, preview);

    setExchangeContext(() => preview);
  };

  const setNetworkSymbol = (symbol?: string) => {
    const oldSymbol = exchangeContext.network?.symbol;
    debugHookChange('network.symbol', oldSymbol, symbol);
    debugLog.log(`💱 setNetworkSymbol → ${symbol}`);

    const preview = {
      ...exchangeContext,
      network: {
        ...exchangeContext.network,
        symbol: symbol || '',
      },
    };
    debugLog.log(`📤 Preview BEFORE setExchangeContext(symbol):`, preview);

    setExchangeContext(() => preview);
  };

  const setNetworkURL = (url?: string) => {
    const oldURL = exchangeContext.network?.url;
    debugHookChange('network.url', oldURL, url);
    debugLog.log(`🌐 setNetworkURL → ${url}`);

    const preview = {
      ...exchangeContext,
      network: {
        ...exchangeContext.network,
        url: url || '',
      },
    };
    debugLog.log(`📤 Preview BEFORE setExchangeContext(url):`, preview);

    setExchangeContext(() => preview);
  };

  const setNetworkConnected = (connected: boolean) => {
    const old = exchangeContext.network?.connected;
    debugHookChange('network.connected', old, connected);
    debugLog.log(`🔌 setNetworkConnected → ${connected}`);

    const preview = {
      ...exchangeContext,
      network: {
        ...exchangeContext.network,
        connected,
      },
    };
    debugLog.log(`📤 Preview BEFORE setExchangeContext(connected):`, preview);

    setExchangeContext(() => preview);
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
