// File: lib/hooks/useSwapTokensEffect.ts
'use client';

import { useEffect } from 'react';
import {
  useExchangeContext,
  useSellTokenContract,
  useBuyTokenContract,
} from '@/lib/context/hooks';
import { useBuySellSwap } from '@/components/Buttons/BuySellSwapArrowButton';
import { mutate } from 'swr';
import { usePriceAPI } from '@/lib/0X/hooks/usePriceAPI';

export function useSwapTokensEffect() {
  const { exchangeContext } = useExchangeContext();
  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();
  const [swapFlag, setSwapFlag] = useBuySellSwap();
  const { swrKey } = usePriceAPI();

  useEffect(() => {
    if (!swapFlag || !exchangeContext?.tradeData) return;

    const currentSell = exchangeContext.tradeData.sellTokenContract;
    const currentBuy  = exchangeContext.tradeData.buyTokenContract;

    // Guard: both tokens must be present to swap
    if (!currentSell || !currentBuy) {
      setSwapFlag(false);
      return;
    }

    // Take the current SELL amount (default 0n if missing)
    const sellAmt = (currentSell as any).amount ?? 0n;

    // OPTION 2:
    // 1) Put the SELL amount onto the BUY token (which will become the new SELL after swap)
    const buyBecomesSell = { ...currentBuy, amount: sellAmt } as typeof currentBuy;

    // 2) Old SELL becomes new BUY. You can keep or clear its amount.
    //    Keeping its old amount is harmless; most flows will overwrite it on next quote anyway.
    const sellBecomesBuy = { ...currentSell } as typeof currentSell;

    // 3) Apply the swap
    setSellTokenContract(buyBecomesSell);
    setBuyTokenContract(sellBecomesBuy);

    // Reset the pulse so future clicks work
    setSwapFlag(false);

    // 4) Revalidate price AFTER state updates are queued
    if (swrKey) queueMicrotask(() => mutate(swrKey));
  }, [swapFlag, exchangeContext?.tradeData, setSellTokenContract, setBuyTokenContract, setSwapFlag, swrKey]);
}
