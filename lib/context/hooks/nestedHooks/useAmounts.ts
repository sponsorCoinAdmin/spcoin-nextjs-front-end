'use client';

import { useExchangeContext } from '@/lib/context/hooks/useExchangeContext';
import { createDebugLogger, debugHookChange } from '@/lib/utils';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_USE_AMOUNT === 'true';
const debugLog = createDebugLogger('useAmounts', DEBUG_ENABLED, LOG_TIME);

/**
 * Hook to get and set the sell amount in the exchange context.
 */
export const useSellAmount = (): [bigint, (amount: bigint) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const token = exchangeContext.tradeData?.sellTokenContract;

  if (!token) {
    debugLog.warn('⚠️ sellTokenContract is undefined — defaulting sellAmount to 0n');
  }

  const sellAmount = token?.amount ?? 0n;

  const setSellAmount = (amount: bigint) => {
    if (!token) {
      debugLog.warn('⛔ Cannot set sellAmount — sellTokenContract is undefined');
      return;
    }

    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      const prevAmount = cloned.tradeData.sellTokenContract?.amount ?? 0n;

      debugLog.log(`reason: useAmounts updating sellTokenContract.amount from ${prevAmount} to ${amount}`);
      debugHookChange('sellTokenContract.amount', prevAmount, amount);

      if (cloned.tradeData.sellTokenContract) {
        cloned.tradeData.sellTokenContract.amount = amount;
      }

      return cloned;
    });
  };

  return [sellAmount, setSellAmount];
};

/**
 * Hook to get and set the buy amount in the exchange context.
 */
export const useBuyAmount = (): [bigint, (amount: bigint) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const token = exchangeContext.tradeData?.buyTokenContract;

  if (!token) {
    debugLog.warn('⚠️ buyTokenContract is undefined — defaulting buyAmount to 0n');
  }

  const buyAmount = token?.amount ?? 0n;

  const setBuyAmount = (amount: bigint) => {
    if (!token) {
      debugLog.warn('⛔ Cannot set buyAmount — buyTokenContract is undefined');
      return;
    }

    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      const prevAmount = cloned.tradeData.buyTokenContract?.amount ?? 0n;

      debugLog.log(`reason: useAmounts updating buyTokenContract.amount from ${prevAmount} to ${amount}`);
      debugHookChange('buyTokenContract.amount', prevAmount, amount);

      if (cloned.tradeData.buyTokenContract) {
        cloned.tradeData.buyTokenContract.amount = amount;
      }

      return cloned;
    });
  };

  return [buyAmount, setBuyAmount];
};
