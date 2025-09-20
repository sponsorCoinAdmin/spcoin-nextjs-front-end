// File: lib/hooks/trade/useBalanceSSOT.ts
'use client';

import type { Address } from 'viem';
import { useGetBalance } from '@/lib/hooks/useGetBalance';
import { useContextBalance } from '@/lib/hooks/useContextBalance';
import { SP_COIN_DISPLAY } from '@/lib/structure';

type Params = {
  chainId: number;
  tokenAddress?: Address;
  tokenDecimals: number;
  containerType: SP_COIN_DISPLAY;
};

export function useBalanceSSOT({ chainId, tokenAddress, tokenDecimals, containerType }: Params) {
  const side = containerType === SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST ? 'sell' : 'buy';

  const { balance, formatted, isLoading, error } = useGetBalance({
    chainId,
    tokenAddress,
    decimalsHint: tokenDecimals,
    enabled: Boolean(tokenAddress),
  });

  useContextBalance({
    balance,
    tokenAddress,
    side,
    enabled: Boolean(tokenAddress),
    mirrorTradeToken: true,
  });

  return { balance, formatted, isLoading, error };
}
