// File: components/Buttons/BuySellSwapArrowButton.tsx
'use client';

import React from 'react';
import styles from '@/styles/Exchange.module.css';
import { ArrowDown } from 'lucide-react';
import {
  useExchangeContext,
  useSellTokenContract,
  useBuyTokenContract,
} from '@/lib/context/hooks';
import { mutate } from 'swr';
import { usePriceAPI } from '@/lib/0X/hooks/usePriceAPI';

/** Normalize mixed numeric inputs to a decimal string. */
function toDecimalString(v: unknown): string {
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '0';
  if (typeof v === 'string') return v.trim() || '0';
  return '0';
}

/** Shift the decimal point of a decimal string by `shift` places. */
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
    const zeros = newPointIndex - digits.length;
    return sign + digits + '0'.repeat(zeros);
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

/** If original was bigint and shifted is integer (no '.'), return bigint; else keep string. */
function coerceShiftedAmount(original: unknown, shifted: string): bigint | string {
  if (typeof original === 'bigint' && !shifted.includes('.')) {
    try {
      return BigInt(shifted);
    } catch {
      // fall back to string if BigInt fails
    }
  }
  return shifted;
}

const BuySellSwapArrowButton = () => {
  const { exchangeContext } = useExchangeContext();
  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();
  const { swrKey } = usePriceAPI();

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();

    const trade = exchangeContext?.tradeData;
    const currentSell = trade?.sellTokenContract;
    const currentBuy = trade?.buyTokenContract;
    if (!currentSell || !currentBuy) return;

    const sellDecimals = currentSell.decimals ?? 0;
    const buyDecimals = currentBuy.decimals ?? 0;
    const originalAmt = (currentSell as any).amount ?? 0n;

    // Scale old SELL amount into the new SELL token’s decimals
    const shift = buyDecimals - sellDecimals;
    const shiftedStr = shiftDecimal(toDecimalString(originalAmt), shift);
    const shiftedAmount = coerceShiftedAmount(originalAmt, shiftedStr);

    // Apply swap
    const nextSell = { ...currentBuy, amount: shiftedAmount } as typeof currentBuy;
    const nextBuy = { ...currentSell } as typeof currentSell;

    setSellTokenContract(nextSell);
    setBuyTokenContract(nextBuy);

    // Revalidate pricing after state is queued
    if (swrKey) queueMicrotask(() => mutate(swrKey));
  };

  return (
    <div id="BuySellSwapArrowButton" className={styles.switchButton}>
      <ArrowDown
        size={20}
        className={styles.switchArrow}
        onClick={handleClick}
      />
    </div>
  );
};

export default BuySellSwapArrowButton;
