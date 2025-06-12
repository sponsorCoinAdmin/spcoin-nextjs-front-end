'use client';

import { useEffect, useRef } from 'react';
import { useChainId, useAccount } from 'wagmi';

import { useExchangeContext } from '@/lib/context/hooks/useExchangeContext';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { ExchangeContext } from '@/lib/structure';
import { serializeWithBigInt } from '@/lib/utils/jsonBigInt';
import {
  getBlockChainName,
  getBlockChainLogoURL,
  getBlockExplorerURL,
} from '@/lib/network/utils';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_RESET_CONTRACTS === 'true';
const debugLog = createDebugLogger('useResetContracts', DEBUG_ENABLED, LOG_TIME);

function logState(state: string, color: string) {
  console.log(`%c🌐 STATE ➜ ${state}`, `background: ${color}; color: black; padding: 2px 6px; border-radius: 4px`);
}

export function useResetContracts(delay: number = 100): void {
  const wagmiChainId = useChainId();
  const stableChainId = useDebounce(wagmiChainId, delay);
  const { status } = useAccount();

  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const hasReset = useRef(false);
  const hasLoggedHydration = useRef(false);

  const updateNetwork = (chainId: number | null, isConnected: boolean) => {
    const name = chainId ? getBlockChainName(chainId) ?? 'Unknown Network' : '';
    const logoURL = chainId ? getBlockChainLogoURL(chainId) ?? '/assets/miscellaneous/default.png' : '';
    const url = chainId ? getBlockExplorerURL(chainId) ?? '' : '';

    debugLog.log(`🧩 updateNetwork: chainId=${chainId}, name=${name}, connected=${isConnected}`);

    setExchangeContext((prev: ExchangeContext) => ({
      ...prev,
      network: {
        ...prev.network,
        chainId: chainId ?? 0,
        name,
        logoURL,
        url,
        connected: isConnected,
      },
    }), 'updateNetwork');
  };

  useEffect(() => {
    const net = exchangeContext.network;
    const currentContextChainId = net?.chainId;

    debugLog.log(
      `⏱️ useEffect triggered → stableChainId=${stableChainId}, contextChainId=${currentContextChainId}, hasReset=${hasReset.current}, status=${status}`
    );

    if (status === 'disconnected') {
      logState('1. DISCONNECTED', '#c8f7c5');

      if (net?.connected !== false) {
        debugLog.warn('🔌 Wallet disconnected → updating network.connected = false');
        updateNetwork(null, false);
      } else {
        debugLog.log('🔁 Wallet already marked disconnected → no update');
      }
      return;
    }

    if (!hasLoggedHydration.current) {
      logState('2. HYDRATING_FROM_LOCAL', '#c8f7c5');
      hasLoggedHydration.current = true;
    }

    logState('3. HYDRATION_COMPLETE', '#c8f7c5');
    logState('4. WAITING_FOR_CHAIN_ID_CONNECTION', '#c8f7c5');

    if (stableChainId == null || currentContextChainId == null) {
      debugLog.warn('⚠️ Ignoring chainId update because stableChainId or contextChainId is null');
      return;
    }

    logState('5. CHAIN_ID_RECEIVED', '#90ee90');

    if (status === 'connected') {
      logState(`6. CONNECTED → context=${currentContextChainId}, wagmi=${stableChainId}`, '#c8f7c5');

      const shouldReset =
        currentContextChainId !== stableChainId &&
        currentContextChainId !== 0 &&
        stableChainId !== 0;

      if (shouldReset) {
        logState(`7. CHAIN_ID_MISMATCH → context=${currentContextChainId}, wagmi=${stableChainId}`, '#ffcccc');
        debugLog.warn(`⚠️ Chain mismatch detected → context=${currentContextChainId}, wagmi=${stableChainId}`);

        if (!hasReset.current) {
          setExchangeContext((prev: ExchangeContext) => {
            const { buyTokenContract, sellTokenContract } = prev.tradeData;
            debugLog.warn(`🔁 Clearing tokens`);
            debugLog.log(`🧼 buyTokenContract: ${serializeWithBigInt(buyTokenContract)}`);
            debugLog.log(`🧼 sellTokenContract: ${serializeWithBigInt(sellTokenContract)}`);

            return {
              ...prev,
              tradeData: {
                ...prev.tradeData,
                buyTokenContract: undefined,
                sellTokenContract: undefined,
              },
              network: {
                ...prev.network,
                chainId: stableChainId,
              },
            };
          }, 'useResetContracts');

          updateNetwork(stableChainId, true);
          hasReset.current = true;
        } else {
          debugLog.log('🛑 Already reset, skipping re-reset');
        }

        return;
      }

      debugLog.log(`✅ Chain ID match: ${currentContextChainId}`);

      const shouldUpdate =
        net.connected !== true ||
        net.chainId !== stableChainId ||
        net.name !== getBlockChainName(stableChainId) ||
        net.logoURL !== getBlockChainLogoURL(stableChainId) ||
        net.url !== getBlockExplorerURL(stableChainId);

      if (shouldUpdate) {
        debugLog.log('🔁 Network mismatch detected → calling updateNetwork');
        updateNetwork(stableChainId, true);
      } else {
        debugLog.log('🛑 No update needed → network already correct');
      }

      hasReset.current = false;
    } else {
      debugLog.warn(`⚠️ Received chainId before connection → ignoring: stableChainId=${stableChainId}`);
    }
  }, [stableChainId, status, setExchangeContext]);
}
