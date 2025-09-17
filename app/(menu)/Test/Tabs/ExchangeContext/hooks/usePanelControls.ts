// File: app/(menu)/Test/Tabs/ExchangeContext/hooks/usePanelControls.ts
'use client';

import { useCallback } from 'react';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/constants/spCoinDisplay';
import { SP_COIN_DISPLAY } from '@/lib/structure';

export function usePanelControls() {
  const { isVisible, openPanel, closePanel } = usePanelTree();

  const onTogglePanel = useCallback(
    (panelId: SP_COIN_DISPLAY) => {
      const visible = isVisible(panelId);
      const isMain = MAIN_OVERLAY_GROUP.includes(panelId);
      if (isMain) {
        if (visible && panelId !== SP_COIN_DISPLAY.TRADING_STATION_PANEL) {
          openPanel(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
        } else {
          openPanel(panelId);
        }
      } else {
        visible ? closePanel(panelId) : openPanel(panelId);
      }
    },
    [isVisible, openPanel, closePanel]
  );

  return { isVisible, onTogglePanel };
}
