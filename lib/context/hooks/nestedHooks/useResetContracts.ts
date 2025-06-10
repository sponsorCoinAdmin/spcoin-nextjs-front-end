'use client';

import { useExchangeContext } from '@/lib/context/hooks/useExchangeContext';
import { useEffect, useRef } from 'react';
import { useChainId } from 'wagmi';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { ExchangeContext } from '@/lib/structure';
import { useHydratingFromLocal } from '@/lib/context/HydrationContext';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_RESET_CONTRACTS === 'true';
const debugLog = createDebugLogger('useResetContracts', DEBUG_ENABLED, LOG_TIME);

export function useResetContracts(delay: number = 100): void {
  const wagmiChainId = useChainId();
  const stableChainId = useDebounce(wagmiChainId, delay);
  const hydratingFromLocal = useHydratingFromLocal(); // ✅ boolean, not destructured

  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const contextChainId = exchangeContext.network?.chainId;
  const hasReset = useRef(false);

  useEffect(() => {
    debugLog.log(
      `⏱️ useEffect triggered → stableChainId=${stableChainId}, contextChainId=${contextChainId}, hydrating=${hydratingFromLocal}, hasReset=${hasReset.current}`
    );

    if (hydratingFromLocal) {
      debugLog.log('🛑 Skipping: still hydrating');
      return;
    }

    if (stableChainId == null) {
      debugLog.log('🛑 Skipping: stableChainId is null');
      return;
    }

    if (contextChainId == null) {
      debugLog.log('🛑 Skipping: contextChainId is null');
      return;
    }

    if (hasReset.current) {
      debugLog.log('🛑 Skipping: already reset');
      return;
    }

    if (contextChainId !== stableChainId) {
      debugLog.warn(
        `⚠️ Chain mismatch detected: context=${contextChainId}, wagmi=${stableChainId} → Resetting contracts`
      );

      setExchangeContext((prev: ExchangeContext) => {
        debugLog.log(`🔁 Resetting tokens: clearing buy/sell tokens from context`);
        debugLog.log(`🧼 Prev buyTokenContract=${JSON.stringify(prev.tradeData.buyTokenContract)}`);
        debugLog.log(`🧼 Prev sellTokenContract=${JSON.stringify(prev.tradeData.sellTokenContract)}`);

        return {
          ...prev,
          network: {
            ...prev.network,
            chainId: stableChainId,
          },
          tradeData: {
            ...prev.tradeData,
            sellTokenContract: undefined,
            buyTokenContract: undefined,
          },
        };
      }, 'useResetContracts');

      hasReset.current = true;
    } else {
      debugLog.log(`✅ ChainId match: ${contextChainId}`);
    }
  }, [stableChainId, contextChainId, hydratingFromLocal]);
}
