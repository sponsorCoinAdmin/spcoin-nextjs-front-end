// File: components/Buttons/BuySellSwapArrowButton.tsx
'use client';

import React, { useCallback } from 'react';
import { ArrowDown } from 'lucide-react';
import {
  useExchangeContext,
  useSellTokenContract,
  useBuyTokenContract,
} from '@/lib/context/hooks';
import { mutate } from 'swr';
import { usePriceAPI } from '@/lib/0X/hooks/usePriceAPI';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY as SP } from '@/lib/structure';

function toDecimalString(v: unknown): string {
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '0';
  if (typeof v === 'string') return v.trim() || '0';
  return '0';
}

function shiftDecimal(value: string, shift: number): string {
  if (value === '0' || value === '-0') return '0';

  let sign = '';
  if (value.startsWith('-')) {
    sign = '-';
    value = value.slice(1);
  }

  const [wholeRaw, fracRaw = ''] = value.split('.');
  const whole = wholeRaw.replace(/^0+(?!$)/, '');
  const frac = fracRaw;
  const digits = (whole + frac).replace(/^0+$/, '0');
  const pointIndex = whole.length;
  const newPointIndex = pointIndex + shift;

  if (newPointIndex >= digits.length) {
    return sign + digits + '0'.repeat(newPointIndex - digits.length);
  }
  if (newPointIndex <= 0) {
    const zeros = -newPointIndex;
    const tail = digits.replace(/^0+/, '');
    return sign + '0.' + '0'.repeat(zeros) + (tail || '0');
  }

  const left = digits.slice(0, newPointIndex).replace(/^0+(?!$)/, '') || '0';
  const right = digits.slice(newPointIndex).replace(/0+$/, '');
  return right ? sign + left + '.' + right : sign + left;
}

function coerceShiftedAmount(original: unknown, shifted: string): bigint | string {
  if (typeof original === 'bigint' && !shifted.includes('.')) {
    try {
      return BigInt(shifted);
    } catch {}
  }
  return shifted;
}

const BuySellSwapArrowButton = () => {
  const show = usePanelVisible(SP.SWAP_ARROW_BUTTON);
  const { exchangeContext } = useExchangeContext();
  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();
  const { swrKey } = usePriceAPI();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();

      const trade = exchangeContext?.tradeData as any;
      const sell = trade?.sellTokenContract ?? undefined;
      const buy = trade?.buyTokenContract ?? undefined;
      if (!sell && !buy) return;

      const nextSell = buy ? { ...buy } : undefined;
      const nextBuy = sell ? { ...sell } : undefined;

      if (sell && buy) {
        const sellDecimals = sell.decimals ?? 0;
        const buyDecimals = buy.decimals ?? 0;
        const originalAmt = (sell as any).amount ?? 0n;

        const shift = buyDecimals - sellDecimals;
        const str = shiftDecimal(toDecimalString(originalAmt), shift);
        const amtOut = coerceShiftedAmount(originalAmt, str);

        (nextSell as any).amount = amtOut;
        if (nextBuy) delete (nextBuy as any).amount;
      } else {
        if (nextSell) delete (nextSell as any).amount;
        if (nextBuy) delete (nextBuy as any).amount;
      }

      setSellTokenContract(nextSell as any);
      setBuyTokenContract(nextBuy as any);

      if (swrKey) {
        queueMicrotask(() => mutate(swrKey));
      }
    },
    [exchangeContext?.tradeData, setSellTokenContract, setBuyTokenContract, swrKey]
  );

  if (!show) return null;

  // This row sits between Sell and Buy and pulls itself upward
  return (
<div
  id='BuySellSwapArrowButton'
  onClick={handleClick}
  className={`
    relative
    z-10
    mx-auto
    -mt-4
    -mb-3
    flex items-center justify-center
    w-6 h-6
    text-[#5F6783] bg-[#3a4157]
    rounded-lg border-[3px] border-[#0E111B]
    text-xs
    transition-colors duration-300
    cursor-pointer hover:text-white
  `}
>
  <ArrowDown size={16} />
</div>

  );
};

export default BuySellSwapArrowButton;
