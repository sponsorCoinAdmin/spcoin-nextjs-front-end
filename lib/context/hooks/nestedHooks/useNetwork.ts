'use client';

import { useExchangeContext } from '@/lib/context/hooks';
import { createNetworkObject } from '@/lib/network/createNetworkObject';
import { NetworkElement } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_USE_NETWORK === 'true';
const debugLog = createDebugLogger('useNetwork', DEBUG_ENABLED, LOG_TIME);

export const useNetwork = () => {
  debugLog.log('🟡 useNetwork hook initialized'); // Add this
  console.log('🟡 FROM CONSOLE.log useNetwork hook initialized'); // Add this
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const prevNetwork = exchangeContext.network;

  // Unified setter
  const setNetwork = (input: number | NetworkElement) => {
    let newNetwork: NetworkElement;

    if (typeof input === 'number') {
      if (input === prevNetwork.chainId) {
        debugLog.log(`⏭️ setNetwork(chainId=${input}) skipped — same as current`);
        return;
      }
      newNetwork = createNetworkObject(input);
    } else {
      const prevStr = JSON.stringify(prevNetwork);
      const nextStr = JSON.stringify(input);
      if (prevStr === nextStr) {
        debugLog.log(`⏭️ setNetwork(NetworkElement) skipped — no structural change`);
        return;
      }
      newNetwork = input;
    }

    debugLog.log(`🔁 setNetwork() →`, newNetwork);
    setExchangeContext(
      (prev) => ({
        ...prev,
        network: newNetwork,
      }),
      `useNetwork.setNetwork()`
    );
  };

  // Internal utility to apply changes
  const internalSetNetwork = (newNetwork: NetworkElement, reason: string) => {
    debugLog.log(`🔧 internalSetNetwork() →`, newNetwork);
    setExchangeContext(
      (prev) => ({
        ...prev,
        network: newNetwork,
      }),
      reason
    );
  };

  // Individual field setters
  const setNetworkConnected = (connected: boolean) => {
    if (prevNetwork.connected === connected) {
      debugLog.log(`⏭️ setNetworkConnected skipped — already ${connected}`);
      return;
    }
    const newNetwork = { ...prevNetwork, connected };
    internalSetNetwork(newNetwork, `setNetworkConnected → ${connected}`);
  };

  const setNetworkLogoURL = (logoURL?: string) => {
    if (prevNetwork.logoURL === logoURL) {
      debugLog.log(`⏭️ setNetworkLogoURL skipped — no change`);
      return;
    }
    const newNetwork = { ...prevNetwork, logoURL: logoURL || '' };
    internalSetNetwork(newNetwork, `setNetworkLogoURL → ${logoURL}`);
  };

  const setNetworkName = (name?: string) => {
    if (prevNetwork.name === name) {
      debugLog.log(`⏭️ setNetworkName skipped — no change`);
      return;
    }
    const newNetwork = { ...prevNetwork, name: name || '' };
    internalSetNetwork(newNetwork, `setNetworkName → ${name}`);
  };

  const setNetworkURL = (url?: string) => {
    if (prevNetwork.url === url) {
      debugLog.log(`⏭️ setNetworkURL skipped — no change`);
      return;
    }
    const newNetwork = { ...prevNetwork, url: url || '' };
    internalSetNetwork(newNetwork, `setNetworkURL → ${url}`);
  };

  const setNetworkSymbol = (symbol?: string) => {
    if (prevNetwork.symbol === symbol) {
      debugLog.log(`⏭️ setNetworkSymbol skipped — no change`);
      return;
    }
    const newNetwork = { ...prevNetwork, symbol: symbol || '' };
    internalSetNetwork(newNetwork, `setNetworkSymbol → ${symbol}`);
  };

  return {
    network: prevNetwork,
    setNetwork,            // Accepts either chainId (number) or full NetworkElement
    setNetworkConnected,   // Individual field setters
    setNetworkLogoURL,
    setNetworkName,
    setNetworkURL,
    setNetworkSymbol,
  };
};
