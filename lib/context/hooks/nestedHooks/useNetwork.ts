// File: lib/context/hooks/nestedHooks/useNetwork.ts

import { useExchangeContext } from '@/lib/context/hooks';
import { useChainId } from 'wagmi';
import { useEffect } from 'react';
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
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const chainId = useChainId();

  const setNetworkChainId = (chainId: number) => {
    debugLog.log(`⚙️ setNetworkChainId → ${chainId}`);
    setExchangeContext(prev => ({
      ...prev,
      network: {
        ...prev.network,
        chainId,
      },
    }));
  };

  const setNetworkLogoURL = (logoURL?: string) => {
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
