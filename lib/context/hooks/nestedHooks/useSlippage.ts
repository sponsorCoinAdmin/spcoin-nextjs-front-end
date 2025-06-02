// File: lib/context/hooks/nestedHooks/useSlippage.ts

import { useExchangeContext } from '@/lib/context/hooks/contextHooks';

/**
 * Returns slippage in basis points and a setter.
 * Example: 100 bps = 1.00%
 */
export const useSlippageBps = (): [number, (bps: number) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const setBps = (bps: number) => {
    setExchangeContext((prev) => ({
      ...prev,
      tradeData: {
        ...prev.tradeData,
        slippageBps: bps,
      },
    }));
  };

  return [exchangeContext.tradeData.slippageBps, setBps];
};

/**
 * Returns slippage as a formatted percent string and a setter.
 * Example: '0.5%' sets slippage to 50 bps.
 */
export const useSlippagePercent = (): [string, (percent: string) => void] => {
  const [slippageBps, setSlippageBps] = useSlippageBps();

  const slippagePercent = `${(slippageBps / 100)
    .toLocaleString(undefined, { maximumFractionDigits: 2 })
    .replace(/\.?0+$/, '')}%`;

  const setSlippagePercent = (percent: string) => {
    const cleaned = percent.replace('%', '').trim();
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) {
      setSlippageBps(Math.round(parsed * 100));
    }
  };

  return [slippagePercent, setSlippagePercent];
};
