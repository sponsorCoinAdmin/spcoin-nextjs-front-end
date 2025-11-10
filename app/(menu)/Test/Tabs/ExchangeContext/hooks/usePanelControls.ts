//File: app/(menu)/Test/Tabs/ExchangeContext/hooks/usePanelControls.ts

'use client';

import { useCallback } from 'react';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/registry/panelRegistry';
import type { SP_COIN_DISPLAY } from '@/lib/structure';

export function usePanelControls() {
  const { isVisible, openPanel, closePanel } = usePanelTree();

  // ⚙️ Parent tagging rule: if the caller doesn't provide a parent, we
  // synthesize one using the format Module:Method(Parameters)

  const safeOpen = useCallback(
    (panelId: SP_COIN_DISPLAY, parent?: string) => {
      const parentTag = parent ?? `usePanelControls:safeOpen(${panelId})`;
      openPanel(panelId, parentTag);
    },
    [openPanel]
  );

  const safeClose = useCallback(
    (panelId: SP_COIN_DISPLAY, parent?: string) => {
      const parentTag = parent ?? `usePanelControls:safeClose(${panelId})`;
      closePanel(panelId, parentTag);
    },
    [closePanel]
  );

  const onTogglePanel = useCallback(
    (panelId: SP_COIN_DISPLAY, parent?: string) => {
      const visible = isVisible(panelId);
      const isMain = MAIN_OVERLAY_GROUP.includes(panelId);
      const parentTag = parent ?? `usePanelControls:onTogglePanel(${panelId})`;

      if (isMain) {
        // Radio overlays: visible → close (allow "none"), otherwise open
        visible ? safeClose(panelId, parentTag) : safeOpen(panelId, parentTag);
      } else {
        // Non-radio panels: simple toggle
        visible ? safeClose(panelId, parentTag) : safeOpen(panelId, parentTag);
      }
    },
    [isVisible, safeOpen, safeClose]
  );

  // Expose the safe wrappers (parent defaulting to Module:Method(params) when omitted)
  return { isVisible, onTogglePanel, openPanel: safeOpen, closePanel: safeClose };
}
