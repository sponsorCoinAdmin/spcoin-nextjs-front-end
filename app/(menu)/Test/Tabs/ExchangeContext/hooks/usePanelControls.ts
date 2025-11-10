//File: app/(menu)/Test/Tabs/ExchangeContext/hooks/usePanelControls.ts

'use client';

import { useCallback } from 'react';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/registry/panelRegistry';
import type { SP_COIN_DISPLAY } from '@/lib/structure';

export function usePanelControls() {
  const { isVisible, openPanel, closePanel } = usePanelTree();

  const onTogglePanel = useCallback(
    (panelId: SP_COIN_DISPLAY) => {
      const visible = isVisible(panelId);
      const isMain = MAIN_OVERLAY_GROUP.includes(panelId);

      if (isMain) {
        // Radio overlays: visible → close (allow "none"), otherwise open
        visible ? closePanel(panelId, 'usePanelControls') : openPanel(panelId, 'usePanelControls');
      } else {
        // Non-radio panels: simple toggle
        visible ? closePanel(panelId, 'usePanelControls') : openPanel(panelId, 'usePanelControls');
      }
    },
    [isVisible, openPanel, closePanel]
  );

  return { isVisible, onTogglePanel };
}
