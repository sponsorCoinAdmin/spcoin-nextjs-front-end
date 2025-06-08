// File: lib/context/hooks/nestedHooks/useNetwork.ts

'use client';

import { useExchangeContext } from '@/lib/context/hooks';
import { useChainId } from 'wagmi';
import { useEffect } from 'react';
import {
  getBlockChainName,
  getBlockChainLogoURL,
  getBlockExplorerURL,
} from '@/lib/network/utils';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useDebugHookChange } from '@/lib/hooks/useDebugHookChange';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_USE_NETWORK === 'true';
const debugLog = createDebugLogger('useNetwork', DEBUG_ENABLED, LOG_TIME);

export const useNetwork = () => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const chainId = useChainId();
  const debugHookChange = useDebugHookChange();

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

  useEffect(() => {
    if (!chainId) return;

    debugLog.log(`🔄 Detected chainId from wagmi: ${chainId}`);

    const name = getBlockChainName(chainId);
    const logoURL = getBlockChainLogoURL(chainId);
    const url = getBlockExplorerURL(chainId);

    setNetworkChainId(chainId);
    setNetworkName(name);
    setNetworkLogoURL(logoURL);
    setNetworkURL(url);
  }, [chainId]);

  return {
    network: exchangeContext.network,
    setNetworkChainId,
    setNetworkLogoURL,
    setNetworkName,
    setNetworkSymbol,
    setNetworkURL,
  };
};
