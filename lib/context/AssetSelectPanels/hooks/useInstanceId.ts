// File: lib/context/AssetSelectPanels/hooks/useInstanceId.ts
'use client';

import { useMemo } from 'react';
import { SP_COIN_DISPLAY } from '@/lib/structure';

export function useInstanceId(containerType: SP_COIN_DISPLAY): string {
  return useMemo(() => {
    switch (containerType) {
      case SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL:
        return 'buy';
      case SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL:
        return 'sell';
      case SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL:
        return 'recipient';
      default:
        return 'main';
    }
  }, [containerType]);
}
