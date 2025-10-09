'use client';

import { useExchangeContext } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { debugHookChange } from '@/lib/utils/debugHookChange';

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
      debugLog.log('🪙 Updating sellAmount to:', amount);

      if (cloned.tradeData.sellTokenContract) {
        const prevAmount = cloned.tradeData.sellTokenContract.amount;
        debugHookChange('sellTokenContract.amount', prevAmount, amount);
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
      debugLog.log('💰 Updating buyAmount to:', amount);

      if (cloned.tradeData.buyTokenContract) {
        const prevAmount = cloned.tradeData.buyTokenContract.amount;
        debugHookChange('buyTokenContract.amount', prevAmount, amount);
        cloned.tradeData.buyTokenContract.amount = amount;
      }

      return cloned;
    });
  };

  return [buyAmount, setBuyAmount];
};
