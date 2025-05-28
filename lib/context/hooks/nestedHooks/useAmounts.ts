// File: lib/context/hooks/nestedHooks/useAmounts.ts

import { useExchangeContext } from '@/lib/context/hooks/useExchangeContext';

/**
 * Hook to get and set the sell amount in the exchange context.
 */
export const useSellAmount = (): [bigint, (amount: bigint) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const sellAmount = exchangeContext.tradeData.sellTokenContract?.amount ?? 0n;

  const setSellAmount = (amount: bigint) => {
    const token = exchangeContext.tradeData.sellTokenContract;
    if (!token) return;
    setExchangeContext(prev => ({
      ...prev,
      tradeData: {
        ...prev.tradeData,
        sellTokenContract: { ...token, amount },
      },
    }));
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
    setExchangeContext(prev => ({
      ...prev,
      tradeData: {
        ...prev.tradeData,
        buyTokenContract: { ...token, amount },
      },
    }));
  };

  return [buyAmount, setBuyAmount];
};
