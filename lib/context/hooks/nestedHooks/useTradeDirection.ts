'use client';

import { useExchangeContext } from '@/lib/context/hooks';
import { TRADE_DIRECTION } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { debugHookChange } from '@/lib/utils/debugHookChange';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_CONTEXT_HOOKS === 'true';
const debugLog = createDebugLogger('contextHooks', DEBUG_ENABLED, LOG_TIME);

/**
 * Hook to get and set the current trade direction in context.
 */
export const useTradeDirection = (): [TRADE_DIRECTION, (type: TRADE_DIRECTION) => void] => {
  const { exchangeContext, setExchangeContext: updateExchangeContext } = useExchangeContext();

  const currentDirection = exchangeContext?.tradeData?.tradeDirection ?? TRADE_DIRECTION.SELL_EXACT_OUT;

  const setTradeDirection = (type: TRADE_DIRECTION) => {
    if (!exchangeContext?.tradeData) return;

    if (currentDirection === type) {
      debugLog.log(`⚠️ tradeDirection unchanged: ${type}`);
      return;
    }

    debugHookChange('tradeDirection', currentDirection, type);

    const reason = `tradeDirection update: ${currentDirection} ➝ ${type}`;
    updateExchangeContext(prev => ({
      ...prev,
      tradeData: {
        ...prev.tradeData,
        tradeDirection: type,
      },
    }), reason);
  };

  return [currentDirection, setTradeDirection];
};
