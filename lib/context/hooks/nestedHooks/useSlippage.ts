// File: lib/context/hooks/nestedHooks/useSlippage.ts

'use client';

import { useExchangeContext } from '@/lib/context/hooks';
import { useDebugHookChange } from '@/lib/hooks/useDebugHookChange';

export type Slippage = {
  bps: number;
  percentage: number;
  percentageString: string;
};

/**
 * Returns the full slippage object and setters.
 */
export const useSlippage = (): {
  data: Slippage;
  setSlippage: (slippage: Slippage) => void;
  setBps: (bps: number) => void;
} => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const debugHookChange = useDebugHookChange();

  const defaultSlippage: Slippage = {
    bps: 200,
    percentage: 2,
    percentageString: '2.00%',
  };

  const slippage = exchangeContext?.tradeData?.slippage ?? defaultSlippage;

  const setSlippage = (newSlippage: Slippage) => {
    const oldSlippage = exchangeContext?.tradeData?.slippage;
    debugHookChange('slippage', oldSlippage, newSlippage);

    if (!exchangeContext?.tradeData) return;

    setExchangeContext((prev) => ({
      ...prev,
      tradeData: {
        ...prev.tradeData,
        slippage: newSlippage,
      },
    }));
  };

  const setBps = (bps: number) => {
    const percentage = bps / 100;
    const newSlippage: Slippage = {
      bps,
      percentage,
      percentageString: `${percentage.toFixed(2)}%`,
    };

    setSlippage(newSlippage);
  };

  return {
    data: slippage,
    setSlippage,
    setBps,
  };
};

/**
 * Returns slippage as a formatted percent string and a setter.
 * Example: '0.5%' sets slippage to 50 bps and updates all related fields.
 */
export const useSlippagePercent = (): [string, (percent: string) => void] => {
  const { data: slippage, setBps } = useSlippage();

  const slippagePercent = `${(slippage.bps / 100)
    .toLocaleString(undefined, { maximumFractionDigits: 2 })
    .replace(/\.?0+$/, '')}%`;

  const setSlippagePercent = (percent: string) => {
    const cleaned = percent.replace('%', '').trim();
    const parsed = parseFloat(cleaned);

    if (!isNaN(parsed)) {
      setBps(Math.round(parsed * 100));
    }
  };

  return [slippagePercent, setSlippagePercent];
};
