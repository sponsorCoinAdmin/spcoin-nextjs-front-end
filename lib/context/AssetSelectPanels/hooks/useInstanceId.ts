// File: @/lib/context/AssetSelectPanels/hooks/useInstanceId.ts
'use client';

import { useMemo } from 'react';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';

export function useInstanceId(containerType: SP_COIN_DISPLAY): string {
  const buyMode = usePanelVisible(SP_COIN_DISPLAY.BUY_CONTRACT);
  const sellMode = usePanelVisible(SP_COIN_DISPLAY.SELL_CONTRACT);

  return useMemo(() => {
    switch (containerType) {
      case SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL:
        if (sellMode) return 'sell';
        if (buyMode) return 'buy';
        return 'sell';
      case SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL:
      case SP_COIN_DISPLAY.RECIPIENT_LIST:
        return 'recipient';
      case SP_COIN_DISPLAY.AGENT_LIST:
        return 'agent';
      case SP_COIN_DISPLAY.SPONSOR_LIST:
        return 'sponsor';
      default:
        return 'main';
    }
  }, [containerType, buyMode, sellMode]);
}
