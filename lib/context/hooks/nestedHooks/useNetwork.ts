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

    setExchangeContext(prev => ({
      ...prev,
      network: {
        ...prev.network,
        chainId: newChainId,
      },
    }));
  };

  const setNetworkLogoURL = (logoURL?: string) => {
    const oldLogo = exchangeContext.network?.logoURL;
    debugHookChange('network.logoURL', oldLogo, logoURL);
    debugLog.log(`🖼️ setNetworkLogoURL → ${logoURL}`);

    setExchangeContext(prev => ({
      ...prev,
      network: {
        ...prev.network,
        logoURL: logoURL || '',
      },
    }));
  };

  const setNetworkName = (name?: string) => {
    const oldName = exchangeContext.network?.name;
    debugHookChange('network.name', oldName, name);
    debugLog.log(`🧾 setNetworkName → ${name}`);

    setExchangeContext(prev => ({
      ...prev,
      network: {
        ...prev.network,
        name: name || '',
      },
    }));
  };

  const setNetworkSymbol = (symbol?: string) => {
    const oldSymbol = exchangeContext.network?.symbol;
    debugHookChange('network.symbol', oldSymbol, symbol);
    debugLog.log(`💱 setNetworkSymbol → ${symbol}`);

    setExchangeContext(prev => ({
      ...prev,
      network: {
        ...prev.network,
        symbol: symbol || '',
      },
    }));
  };

  const setNetworkURL = (url?: string) => {
    const oldURL = exchangeContext.network?.url;
    debugHookChange('network.url', oldURL, url);
    debugLog.log(`🌐 setNetworkURL → ${url}`);

    setExchangeContext(prev => ({
      ...prev,
      network: {
        ...prev.network,
        url: url || '',
      },
    }));
  };

  const setNetworkConnected = (connected: boolean) => {
    const old = exchangeContext.network?.connected;
    debugHookChange('network.connected', old, connected);
    debugLog.log(`🔌 setNetworkConnected → ${connected}`);

    setExchangeContext(prev => ({
      ...prev,
      network: {
        ...prev.network,
        connected,
      },
    }));
  };

  useEffect(() => {
    if (!chainId) return;

    debugLog.log(`🔄 Detected chainId from wagmi: ${chainId}`);

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
