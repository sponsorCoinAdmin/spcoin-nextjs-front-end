// File: lib/hooks/useSwapTokens.ts
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
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

function toDecimalString(val: unknown): string {
  if (typeof val === 'bigint') return val.toString();
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : '0';
  if (typeof val === 'string') return val.trim() || '0';
  return '0';
}

function hasDot(s: string) {
  return s.includes('.');
}

/**
 * Shift the decimal point of a decimal string by `shift` places.
 * Examples:
 *  - shiftDecimal("1", 2)        -> "100"
 *  - shiftDecimal("123.45", -3)  -> "0.12345"
 */
function shiftDecimal(value: string, shift: number): string {
  let sign = '';
  if (value.startsWith('-')) {
    sign = '-';
    value = value.slice(1);
  }

  const [wholeRaw, fracRaw = ''] = value.split('.');
  const whole = wholeRaw.replace(/^0+(?!$)/, '');
  const frac = fracRaw;

  const digits = (whole + frac).replace(/^0+$/, '0');
  const hadOnlyZeros = /^[0]*$/.test(whole + frac);
  if (hadOnlyZeros) return '0';

  const pointIndex = whole.length;
  const newPointIndex = pointIndex + shift;

  if (newPointIndex >= digits.length) {
    const zerosToAdd = newPointIndex - digits.length;
    const out = digits + '0'.repeat(zerosToAdd);
    return sign + out;
  }

  if (newPointIndex <= 0) {
    const zerosToAdd = Math.abs(newPointIndex);
    const out = '0.' + '0'.repeat(zerosToAdd) + digits.replace(/^0+/, '');
    return sign + out.replace(/\.$/, '');
  }

  const left = digits.slice(0, newPointIndex).replace(/^0+(?!$)/, '');
  const right = digits.slice(newPointIndex).replace(/0+$/, '');

  if (right.length === 0) {
    return sign + (left || '0');
  }
  return sign + (left || '0') + '.' + right;
}

/**
 * If the original amount was a bigint and the shifted value is an integer (no dot),
 * return bigint; otherwise return a string to preserve fractional precision.
 */
function coerceShiftedAmount(original: unknown, shifted: string): bigint | string {
  if (typeof original === 'bigint') {
    if (!shifted.includes('.')) {
      try {
        return BigInt(shifted);
      } catch {
        return shifted;
      }
    }
    return shifted;
  }
  return shifted;
}

/** Format an integer base-units string into a human string using `decimals`. Supports negatives. */
function formatHumanFromIntegerString(intStr: string, decimals: number): string {
  if (!/^-?\d+$/.test(intStr)) return intStr; // not a pure integer string; return as-is
  const neg = intStr.startsWith('-');
  const digits = neg ? intStr.slice(1) : intStr;

  if (decimals === 0) return neg ? `-${digits}` : digits;

  const padded = digits.padStart(decimals + 1, '0');
  const whole = padded.slice(0, padded.length - decimals);
  const frac = padded.slice(padded.length - decimals).replace(/0+$/, '');
  const out = frac.length > 0 ? `${whole}.${frac}` : whole;
  return neg ? `-${out}` : out;
}

/** Human-friendly display: if value already has a '.', assume it is human; else format from integer using `decimals`. */
function toHumanDisplay(val: bigint | string, decimals: number): string {
  const s = typeof val === 'bigint' ? val.toString() : String(val);
  if (hasDot(s)) return s; // already a human decimal
  return formatHumanFromIntegerString(s, decimals);
}

export function useSwapTokens() {
  const { exchangeContext } = useExchangeContext();
  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();
  const [swapFlag, setSwapFlag] = useBuySellSwap();
  const { swrKey } = usePriceAPI();

  useEffect(() => {
    if (!swapFlag || !exchangeContext?.tradeData) return;

    const currentSell = exchangeContext.tradeData.sellTokenContract;
    const currentBuy  = exchangeContext.tradeData.buyTokenContract;

    if (!currentSell || !currentBuy) {
      setSwapFlag(false);
      return;
    }

    const sellDecimals = currentSell.decimals ?? 0;
    const buyDecimals  = currentBuy.decimals ?? 0;
    const sellSymbol   = currentSell.symbol ?? 'SELL';
    const buySymbol    = currentBuy.symbol ?? 'BUY';
    const sellAddr     = (currentSell as any).address ?? '';
    const buyAddr      = (currentBuy as any).address ?? '';

    const originalAmt = (currentSell as any).amount ?? 0n;

    // ✅ Correct direction: scale into buy.decimals (new SELL’s decimals)
    const shift: number = buyDecimals - sellDecimals;

    // Shift BEFORE swapping
    const shiftedStr = shiftDecimal(toDecimalString(originalAmt), shift);
    const sellAmtShifted = coerceShiftedAmount(originalAmt, shiftedStr);

    // Apply shift to BUY (which becomes the new SELL)
    const buyBecomesSell = { ...currentBuy, amount: sellAmtShifted } as typeof currentBuy;
    const sellBecomesBuy = { ...currentSell } as typeof currentSell;

    // 🔔 Debug alert with decimals, addresses, raw & human displays
    alert(
      [
        `Sell: ${sellSymbol} (${sellAddr})  decimals=${sellDecimals}`,
        `Buy : ${buySymbol} (${buyAddr})  decimals=${buyDecimals}`,
        `Shift (buy - sell): ${shift}`,
        '',
        `Orig Amount (raw):   ${toDecimalString(originalAmt)}`,
        `Orig Amount (human ${sellSymbol}): ${toHumanDisplay(originalAmt as any, sellDecimals)}`,
        '',
        `Shifted Amt (raw):   ${typeof sellAmtShifted === 'bigint' ? sellAmtShifted.toString() : sellAmtShifted}`,
        `Shifted Amt (human ${buySymbol}): ${toHumanDisplay(sellAmtShifted as any, buyDecimals)}`,
        '',
        `Swap (before → after):`,
        `${stringifyBigInt(currentSell)}`,
        '→',
        `${stringifyBigInt(buyBecomesSell)}`
      ].join('\n')
    );

    // Commit swap
    setSellTokenContract(buyBecomesSell);
    setBuyTokenContract(sellBecomesBuy);

    // Reset flag so future clicks work
    setSwapFlag(false);

    // Revalidate price AFTER state updates are queued
    if (swrKey) queueMicrotask(() => mutate(swrKey));
  }, [
    swapFlag,
    exchangeContext?.tradeData,
    setSellTokenContract,
    setBuyTokenContract,
    setSwapFlag,
    swrKey,
  ]);
}
