'use client';

import { useCallback } from 'react';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import type { SP_COIN_DISPLAY } from '@/lib/structure';

export function usePanelControls() {
  const { isVisible, openPanel, closePanel } = usePanelTree();

  const makeTag = (method: string, panelId: SP_COIN_DISPLAY, caller?: string) =>
    `${caller ?? 'usePanelControls'}:${method}(${Number(panelId)})`;

  const safeOpen = useCallback(
    (panelId: SP_COIN_DISPLAY, caller?: string) => {
      openPanel(panelId, makeTag('safeOpen', panelId, caller));
    },
    [openPanel],
  );

  const safeClose = useCallback(
    (panelId: SP_COIN_DISPLAY, caller?: string) => {
      closePanel(panelId, makeTag('safeClose', panelId, caller));
    },
    [closePanel],
  );

  const safeCloseTop = useCallback(
    (invoker?: string) => {
      closePanel(invoker ?? 'usePanelControls:safeCloseTop(pop)');
    },
    [closePanel],
  );

  const onTogglePanel = useCallback(
    (panelId: SP_COIN_DISPLAY, caller?: string) => {
      const tag = makeTag('onTogglePanel', panelId, caller);
      const visible = isVisible(panelId);

      if (visible) safeClose(panelId, tag);
      else safeOpen(panelId, tag);
    },
    [isVisible, safeClose, safeOpen],
  );

  return {
    isVisible,
    onTogglePanel,
    openPanel: safeOpen,
    closePanel: safeClose,
    closeTop: safeCloseTop,
  };
}
