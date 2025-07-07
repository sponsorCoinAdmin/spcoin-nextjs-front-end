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

enum REFRESH_STATE {
  DISCONNECTED,
  CHAIN_ID_RECEIVED,
  CONNECTED,
  CHAIN_ID_MISMATCH,
}

function logState(state: REFRESH_STATE, color: string) {
  if (DEBUG_ENABLED) {
    const stateNum = state;
    const stateName = REFRESH_STATE[state];
    debugLog.log(
      `%c    🌐 STATE(${stateNum}) ➔ ${stateName}`,
      `background: ${color}; color: black; padding: 2px 6px; border-radius: 4px`
    );
  }
}

export function useResetContracts(delay: number = 100): void {
  const wagmiChainId = useChainId();
  const stableChainId = useDebounce(wagmiChainId, delay);
  const { status, isConnected } = useAccount();

  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const hasReset = useRef(false);
  const currentState = useRef<REFRESH_STATE | null>(null);

  const updateNetwork = (chainId: number | null, isConnected: boolean) => {
    const name = chainId ? getBlockChainName(chainId) ?? 'Unknown Network' : '';
    const logoURL = chainId ? getBlockChainLogoURL(chainId) ?? '/assets/miscellaneous/default.png' : '';
    const url = chainId ? getBlockExplorerURL(chainId) ?? '' : '';

    debugLog.log(`🧫 updateNetwork: chainId=${chainId}, name=${name}, connected=${isConnected}`);

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

  function setState(newState: REFRESH_STATE, color: string) {
    if (currentState.current !== newState) {
      logState(newState, color);
      currentState.current = newState;
    }
  }

  useEffect(() => {
    if (isConnected) {
      setState(REFRESH_STATE.CONNECTED, '#c8f7c5');
    } else {
      setState(REFRESH_STATE.DISCONNECTED, '#c8f7c5');
    }
  }, [isConnected]);

  useEffect(() => {
    const net = exchangeContext.network;
    const currentContextChainId = net?.chainId;

    debugLog.log(
      `⏱️ useEffect triggered → stableChainId=${stableChainId}, contextChainId=${currentContextChainId}, hasReset=${hasReset.current}, status=${status}`
    );

    if (stableChainId == null || currentContextChainId == null) {
      const missing = stableChainId == null ? 'stableChainId' : 'contextChainId';
      debugLog.warn(`⚠️ Ignoring chainId ${wagmiChainId} update because ${missing} is null.`);
      return;
    }

    setState(REFRESH_STATE.CHAIN_ID_RECEIVED, '#c8f7c5');
    debugLog.log(`🕅 stableChainId: ${stableChainId}`);

    if (!isConnected) {
      debugLog.warn(`⚠️ Received chainId ${stableChainId} before connection → ignoring: stableChainId = ${stableChainId}`);
      return;
    }

    const shouldReset =
      currentContextChainId !== stableChainId &&
      currentContextChainId !== 0 &&
      stableChainId !== 0;

    if (shouldReset) {
      setState(REFRESH_STATE.CHAIN_ID_MISMATCH, '#ffcccc');
      debugLog.warn(`⚠️ Chain mismatch detected → context=${currentContextChainId}, wagmi=${stableChainId}`);

      if (!hasReset.current) {
        setExchangeContext((prev: ExchangeContext) => {
          const { buyTokenContract, sellTokenContract } = prev.tradeData;
          debugLog.warn(`🔁 Clearing tokens`);
          debugLog.log(`🫼 buyTokenContract: ${serializeWithBigInt(buyTokenContract)}`);
          debugLog.log(`🫼 sellTokenContract: ${serializeWithBigInt(sellTokenContract)}`);

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
  }, [stableChainId, isConnected, setExchangeContext]);
}
