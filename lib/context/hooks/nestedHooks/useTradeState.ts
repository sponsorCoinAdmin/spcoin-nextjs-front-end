// File: lib/context/hooks/nestedHooks/useTradeState.ts

import { useMemo } from 'react';
import { useExchangeContext } from '@/lib/context/hooks/contextHooks';
import {
  TRADE_DIRECTION,
  CONTAINER_TYPE,
  TradeData,
} from '@/lib/structure/types';

/**
 * Read and update the current trade direction.
 * Example: TRADE_DIRECTION.BUY_EXACT_IN
 */
export const useTradeDirection = (): [TRADE_DIRECTION, (type: TRADE_DIRECTION) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  return [
    exchangeContext.tradeData.tradeDirection,
    (type: TRADE_DIRECTION) =>
      setExchangeContext((prev) => ({
        ...prev,
        tradeData: {
          ...prev.tradeData,
          tradeDirection: type,
        },
      })),
  ];
};

/**
 * Read and update the current container type (SELL or BUY selector).
 */
export const useContainerType = (
  initialType?: CONTAINER_TYPE
): [CONTAINER_TYPE, (type: CONTAINER_TYPE) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  // Initialize containerType if undefined and initialType is provided
  if (exchangeContext.containerType === undefined && initialType !== undefined) {
    setExchangeContext((prev) => ({
      ...prev,
      containerType: initialType,
    }));
  }

  return [
    exchangeContext.containerType || CONTAINER_TYPE.SELL_SELECT_CONTAINER,
    (type: CONTAINER_TYPE) =>
      setExchangeContext((prev) => ({
        ...prev,
        containerType: type,
      })),
  ];
};

/**
 * Memoized read-only hook for accessing the full trade data block.
 */
export const useTradeData = (): TradeData => {
  const { exchangeContext } = useExchangeContext();
  return useMemo(() => exchangeContext.tradeData, [exchangeContext.tradeData]);
};
