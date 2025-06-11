'use client';

import { useExchangeContext } from '@/lib/context/hooks/useExchangeContext';
import { useEffect, useRef } from 'react';
import { useChainId } from 'wagmi';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { ExchangeContext } from '@/lib/structure';
import { useHydratingFromLocal } from '@/lib/context/HydrationContext';
import { serializeWithBigInt } from '@/lib/utils/jsonBigInt';
import {
  getBlockChainName,
  getBlockChainLogoURL,
  getBlockExplorerURL,
} from '@/lib/network/utils';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_RESET_CONTRACTS === 'true';
const debugLog = createDebugLogger('useResetContracts', DEBUG_ENABLED, LOG_TIME);

export function useResetContracts(delay: number = 100): void {
  const wagmiChainId = useChainId();
  const stableChainId = useDebounce(wagmiChainId, delay);

  const { hydratingFromLocal, setHydratingFromLocal } = useHydratingFromLocal();
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const contextChainId = exchangeContext.network?.chainId;
  const hasReset = useRef(false);
  const prevChainIdRef = useRef<number | null>(null);

  const updateNetwork = (chainId: number) => {
    const name = getBlockChainName(chainId) ?? 'Unknown Network';
    const logoURL = getBlockChainLogoURL(chainId) ?? '/assets/miscellaneous/default.png';
    const url = getBlockExplorerURL(chainId) ?? '';

    setExchangeContext((prev: ExchangeContext) => {
      debugLog.log(`🧩 updateNetwork: name=${name}, logoURL=${logoURL}, url=${url}`);
      return {
        ...prev,
        network: {
          ...prev.network,
          chainId,
          name,
          logoURL,
          url,
        },
      };
    }, 'updateNetwork');
  };

  useEffect(() => {
    debugLog.log(
      `⏱️ useEffect triggered → stableChainId=${stableChainId}, contextChainId=${contextChainId}, hydrating=${hydratingFromLocal}, hasReset=${hasReset.current}`
    );

    if (hydratingFromLocal) {
      const isReady =
        stableChainId !== undefined &&
        contextChainId !== undefined &&
        stableChainId === contextChainId;

      if (isReady) {
        debugLog.log(`✅ Hydration complete → stableChainId === contextChainId === ${stableChainId}`);
        setHydratingFromLocal(false);
      } else {
        debugLog.log(`🕒 Still hydrating → wagmi=${stableChainId}, context=${contextChainId}`);
        return;
      }
    }

    if (stableChainId == null) {
      debugLog.log('🛑 Skipping: stableChainId is null');
      return;
    }

    if (contextChainId == null) {
      debugLog.log('🛑 Skipping: contextChainId is null');
      return;
    }

    if (contextChainId !== stableChainId) {
      debugLog.warn(`⚠️ Chain mismatch detected → context=${contextChainId}, wagmi=${stableChainId}`);

      if (!hasReset.current) {
        setExchangeContext((prev: ExchangeContext) => {
          const { buyTokenContract, sellTokenContract } = prev.tradeData;
          debugLog.log(`🔁 Clearing tokens`);
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

        updateNetwork(stableChainId);
        hasReset.current = true;
      } else {
        debugLog.log('🛑 Already reset, skipping re-reset');
      }
    } else {
      debugLog.log(`✅ Chain ID match: ${contextChainId}`);
      hasReset.current = false;
    }

    prevChainIdRef.current = stableChainId;
  }, [stableChainId, contextChainId, hydratingFromLocal, setExchangeContext, setHydratingFromLocal]);
}
