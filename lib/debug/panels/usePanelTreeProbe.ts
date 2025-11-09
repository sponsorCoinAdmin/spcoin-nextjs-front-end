// File: lib/debug/panels/usePanelTreeProbe.ts
'use client';

import { useCallback } from 'react';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { markPanelApply, markPanelClosed } from './panelVisibilityProbe';

export function usePanelTreeProbe() {
  const { openPanel, closePanel, isVisible } = usePanelTree();

  const open = useCallback(
    (p: SP_COIN_DISPLAY, reason = 'openPanel') => {
      // mark *intent* and let the tree do its thing
      markPanelApply(p, SP_COIN_DISPLAY[p], true, reason);
      return openPanel(p);
    },
    [openPanel]
  );

  const close = useCallback(
    (p: SP_COIN_DISPLAY, reason = 'closePanel') => {
      markPanelApply(p, SP_COIN_DISPLAY[p], false, reason);
      markPanelClosed(reason);
      return closePanel(p);
    },
    [closePanel]
  );

  return { openPanel: open, closePanel: close, isVisible };
}
