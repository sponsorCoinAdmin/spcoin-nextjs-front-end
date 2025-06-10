// File: lib/context/hooks/nestedHooks/useTradeDirection.ts

import { useMemo } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import { TRADE_DIRECTION, TradeData } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { debugHookChange } from '@/lib/utils/debugHookChange';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_CONTEXT_HOOKS === 'true';
const debugLog = createDebugLogger('contextHooks', DEBUG_ENABLED, LOG_TIME);

/**
 * Hook to get and set the current trade direction in context.
 */
export const useTradeDirection = (): [TRADE_DIRECTION, (type: TRADE_DIRECTION) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const currentDirection = exchangeContext?.tradeData?.tradeDirection ?? TRADE_DIRECTION.SELL_EXACT_OUT;

  const setTradeDirection = (type: TRADE_DIRECTION) => {
    if (!exchangeContext?.tradeData) return;

    if (currentDirection === type) {
      debugLog.log(`⚠️ tradeDirection unchanged: ${type}`);
      return;
    }

    debugHookChange('tradeDirection', currentDirection, type);

    setExchangeContext(prev => ({
      ...prev,
      tradeData: {
        ...prev.tradeData,
        tradeDirection: type,
      },
    }));
  };

  return [currentDirection, setTradeDirection];
};

/**
 * Hook to memoize and return the full tradeData object.
 */
export const useTradeData = (): TradeData => {
  const { exchangeContext } = useExchangeContext();
  return useMemo(() => exchangeContext?.tradeData ?? {} as TradeData, [exchangeContext?.tradeData]);
};
