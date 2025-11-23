// File: @/lib/hooks/useContextBalance.ts
'use client';

import { useEffect } from 'react';
import type { Address } from 'viem';
import { useExchangeContext } from '@/lib/context/hooks';
import { NATIVE_TOKEN_ADDRESS } from '@/lib/structure';

type Params = {
  /** The live balance (bigint) you already computed elsewhere */
  balance?: bigint;

  /** The token address whose balance this is (native sentinel OK) */
  tokenAddress?: Address;

  /** Which side’s token in tradeData to update */
  side?: 'sell' | 'buy';

  /** Mirror into tradeData.[sell|buy]TokenContract.balance (default true) */
  mirrorTradeToken?: boolean;

  /** Gate writes */
  enabled?: boolean;
};

function sameAddr(a?: string, b?: string) {
  return a && b ? a.toLowerCase() === b.toLowerCase() : false;
}

function normalizeNative(addr?: string): string | undefined {
  if (!addr) return addr;
  return addr.toLowerCase() === String(NATIVE_TOKEN_ADDRESS).toLowerCase()
    ? String(NATIVE_TOKEN_ADDRESS)
    : addr;
}

/**
 * Mirrors an externally-sourced balance into ExchangeContext.tradeData.*TokenContract.balance.
 * - No fetching here; pure write-through when dependencies change.
 */
export function useContextBalance({
  balance,
  tokenAddress,
  side,
  mirrorTradeToken = true,
  enabled = true,
}: Params) {
  const { setExchangeContext } = useExchangeContext();

  useEffect(() => {
    if (!enabled) return;
    if (!mirrorTradeToken) return;
    if (!side) return;
    if (balance === undefined) return;

    const normToken = normalizeNative(tokenAddress as string | undefined);
    if (!normToken) return;

    setExchangeContext((prev) => {
      if (!prev?.tradeData) return prev;

      const current =
        side === 'sell' ? prev.tradeData.sellTokenContract : prev.tradeData.buyTokenContract;
      if (!current?.address) return prev;

      const currAddr = normalizeNative(String(current.address));
      if (!sameAddr(currAddr, normToken)) return prev;

      if (current.balance === balance) return prev;

      const updated = { ...current, balance };

      return {
        ...prev,
        tradeData: {
          ...prev.tradeData,
          ...(side === 'sell'
            ? { sellTokenContract: updated }
            : { buyTokenContract: updated }),
        },
      };
    });
  }, [enabled, mirrorTradeToken, side, balance, tokenAddress, setExchangeContext]);
}
