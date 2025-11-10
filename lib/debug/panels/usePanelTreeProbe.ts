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
      // Thread the reason as the optional methodName for telemetry/debug
      return openPanel(p, `usePanelTreeProbe:${reason}`);
    },
    [openPanel]
  );

  const close = useCallback(
    (p: SP_COIN_DISPLAY, reason = 'closePanel') => {
      markPanelApply(p, SP_COIN_DISPLAY[p], false, reason);
      markPanelClosed(reason);
      return closePanel(p, `usePanelTreeProbe:${reason}`);
    },
    [closePanel]
  );

  return { openPanel: open, closePanel: close, isVisible };
}
