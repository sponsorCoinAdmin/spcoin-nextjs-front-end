// File: @/lib/hooks/useResetAmountsOnTokenChange.ts

'use client';

import { useEffect, useRef } from 'react';
import { useExchangeContext, useSellAmount, useBuyAmount } from '@/lib/context/hooks';
import { TRADE_DIRECTION } from '@/lib/structure';

export function useResetAmountsOnTokenChange() {
  const { exchangeContext } = useExchangeContext();
  const [, setSellAmount] = useSellAmount();
  const [, setBuyAmount] = useBuyAmount();
  const tradeData = exchangeContext.tradeData;

  const previousSell = useRef(tradeData?.sellTokenContract);
  const previousBuy = useRef(tradeData?.buyTokenContract);

  useEffect(() => {
    if (!tradeData) return;

    const sellChanged = previousSell.current?.address !== tradeData.sellTokenContract?.address;
    const buyChanged = previousBuy.current?.address !== tradeData.buyTokenContract?.address;

    if (tradeData.tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT && (sellChanged || buyChanged)) {
      setBuyAmount(0n);
    }

    if (tradeData.tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN && (sellChanged || buyChanged)) {
      setSellAmount(0n);
    }

    previousSell.current = tradeData.sellTokenContract;
    previousBuy.current = tradeData.buyTokenContract;
  }, [tradeData, setSellAmount, setBuyAmount]);
}