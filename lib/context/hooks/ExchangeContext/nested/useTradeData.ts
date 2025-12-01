// File: @/lib/context/hooks/ExchangeContext/nested/useTradeData.ts
'use client';

import { useCallback } from 'react';
import { useExchangeContext } from '../useExchangeContext';

// Infer the TradeData type from the context
type TradeData = ReturnType<typeof useExchangeContext>['exchangeContext']['tradeData'];

type TradeDataUpdater = TradeData | ((prev: TradeData) => TradeData);

export function useTradeData(): [TradeData, (next: TradeDataUpdater) => void] {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const tradeData = exchangeContext.tradeData as TradeData;

  const setTradeData = useCallback(
    (next: TradeDataUpdater) => {
      setExchangeContext(
        (prev) => {
          const current = prev.tradeData as TradeData;
          const updated =
            typeof next === 'function'
              ? (next as (p: TradeData) => TradeData)(current)
              : next;

          return {
            ...prev,
            tradeData: updated,
          };
        },
        'useTradeData:setTradeData',
      );
    },
    [setExchangeContext],
  );

  return [tradeData, setTradeData];
}
