// File: lib/context/hooks/nestedHooks/useTradeState.ts

import { useMemo } from 'react';
import { useExchangeContext } from '@/lib/context/hooks/contextHooks';
import {
  TRADE_DIRECTION,
  CONTAINER_TYPE,
  TradeData,
} from '@/lib/structure/types';
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
 * Read and update the current container type (SELL or BUY selector).
 */
export const useContainerType = (
  initialType?: CONTAINER_TYPE
): [CONTAINER_TYPE, (type: CONTAINER_TYPE) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const current = exchangeContext.containerType;

  // Initialize if undefined
  if (current === undefined && initialType !== undefined) {
    debugLog.log(`🆕 Initializing containerType to: ${initialType}`);
    setExchangeContext((prev) => ({
      ...prev,
      containerType: initialType,
    }));
  }

  return [
    current || CONTAINER_TYPE.SELL_SELECT_CONTAINER,
    (type: CONTAINER_TYPE) => {
      if (current === type) {
        debugLog.log(`⚠️ containerType unchanged: ${type}`);
        return;
      }

      debugLog.log(`🔁 containerType changed: ${current} → ${type}`);

      setExchangeContext((prev) => ({
        ...prev,
        containerType: type,
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
