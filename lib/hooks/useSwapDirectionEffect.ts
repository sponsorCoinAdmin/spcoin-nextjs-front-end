// File: lib/hooks/useSwapDirectionEffect.ts

'use client';

import { useEffect } from 'react';
import { useExchangeContext, useSellTokenContract, useBuyTokenContract } from '@/lib/context/hooks';
import { useBuySellSwap } from '@/components/Buttons/BuySellSwapArrowButton';
import { mutate } from 'swr';
import { usePriceAPI } from '@/lib/0X/hooks/usePriceAPI'

export function useSwapDirectionEffect() {
  const { exchangeContext } = useExchangeContext();
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();
  const [containerSwapStatus, setContainerSwapStatus] = useBuySellSwap();
  const { swrKey } = usePriceAPI();

  useEffect(() => {
    if (containerSwapStatus && exchangeContext.tradeData) {
      const oldSellAmount = exchangeContext.tradeData.sellTokenContract?.amount || 0n;
      const newSell = exchangeContext.tradeData.buyTokenContract;
      const newBuy = exchangeContext.tradeData.sellTokenContract;

      setSellTokenContract(newSell);
      setBuyTokenContract(newBuy);
      setContainerSwapStatus(false);

      if (swrKey) mutate(swrKey);
    }
  }, [containerSwapStatus, exchangeContext.tradeData, setSellTokenContract, setBuyTokenContract, setContainerSwapStatus, swrKey]);
}
