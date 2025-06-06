'use client';

import { useExchangeContext } from '@/lib/context/hooks/useExchangeContext';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_WRAPPER === 'true';
const debugLog = createDebugLogger('useAmounts', DEBUG_ENABLED, LOG_TIME);

/**
 * Hook to get and set the sell amount in the exchange context.
 */
export const useSellAmount = (): [bigint, (amount: bigint) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const sellAmount = exchangeContext.tradeData.sellTokenContract?.amount ?? 0n;

  const setSellAmount = (amount: bigint) => {
    const token = exchangeContext.tradeData.sellTokenContract;
    if (!token) return;

    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      debugLog.log('🪙 Updating sellAmount to:', amount);
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
  const buyAmount = exchangeContext.tradeData.buyTokenContract?.amount ?? 0n;

  const setBuyAmount = (amount: bigint) => {
    const token = exchangeContext.tradeData.buyTokenContract;
    if (!token) return;

    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      debugLog.log('💰 Updating buyAmount to:', amount);
      if (cloned.tradeData.buyTokenContract) {
        cloned.tradeData.buyTokenContract.amount = amount;
      }
      return cloned;
    });
  };

  return [buyAmount, setBuyAmount];
};
