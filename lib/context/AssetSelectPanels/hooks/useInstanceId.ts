// File: @/lib/context/AssetSelectPanels/hooks/useInstanceId.ts
'use client';

import { useMemo } from 'react';
import { SP_COIN_DISPLAY } from '@/lib/structure';

export function useInstanceId(containerType: SP_COIN_DISPLAY): string {
  return useMemo(() => {
    switch (containerType) {
      case SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL:
        return 'buy';
      case SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL:
        return 'sell';
      case SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL:
        return 'recipient';
      default:
        return 'main';
    }
  }, [containerType]);
}
