import { useMemo } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import {
  TRADE_DIRECTION,
  TradeData,
} from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_CONTEXT_HOOKS === 'true';
const debugLog = createDebugLogger('contextHooks', DEBUG_ENABLED, LOG_TIME);

/**
 * Read and update the current trade direction.
 */
export const useTradeDirection = (): [TRADE_DIRECTION, (type: TRADE_DIRECTION) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  return [
    exchangeContext.tradeData.tradeDirection,
    (type: TRADE_DIRECTION) => {
      if (exchangeContext.tradeData.tradeDirection === type) {
        debugLog.log(`⚠️ tradeDirection unchanged: ${type}`);
        return;
      }

      debugLog.log(`🔁 tradeDirection changed: ${exchangeContext.tradeData.tradeDirection} → ${type}`);

      setExchangeContext((prev) => ({
        ...prev,
        tradeData: {
          ...prev.tradeData,
          tradeDirection: type,
        },
      }));
    },
  ];
};

/**
 * Memoized read-only hook for accessing the full trade data block.
 */
export const useTradeData = (): TradeData => {
  const { exchangeContext } = useExchangeContext();
  return useMemo(() => exchangeContext.tradeData, [exchangeContext.tradeData]);
};
