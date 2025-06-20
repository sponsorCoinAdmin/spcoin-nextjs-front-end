'use client';

import { useMemo } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import { TradeData } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_CONTEXT_HOOKS === 'true';
const debugLog = createDebugLogger('contextHooks', DEBUG_ENABLED, LOG_TIME);

/**
 * Hook to memoize and return the full tradeData object.
 */
export const useTradeData = (): TradeData => {
  const { exchangeContext } = useExchangeContext();
  const tradeData = useMemo(() => exchangeContext?.tradeData ?? {} as TradeData, [exchangeContext?.tradeData]);
  debugLog.log(`📦 useTradeData() returned:`, tradeData);
  return tradeData;
};

/**
 * Hook to return a function that updates partial tradeData.
 */
export const useSetTradeData = (): ((partial: Partial<TradeData>) => void) => {
  const { setExchangeContext: updateExchangeContext } = useExchangeContext();

  return (partial: Partial<TradeData>) => {
    const reason = `reason: contextHooks updating tradeData keys: ${Object.keys(partial).join(', ')}`;
    debugLog.log(`🛠️ ${reason}`, partial);

    updateExchangeContext(prev => ({
      ...prev,
      tradeData: {
        ...prev.tradeData,
        ...partial,
      },
    }), reason);
  };
};
