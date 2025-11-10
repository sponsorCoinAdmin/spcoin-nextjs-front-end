// File: lib/debug/panels/usePanelTreeProbe.ts
'use client';

import { useCallback } from 'react';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { markPanelApply, markPanelClosed } from './panelVisibilityProbe';

type ProbeOpts = string; // now just a label that becomes the parent string

export function usePanelTreeProbe() {
  const { openPanel, closePanel, isVisible } = usePanelTree();

  const open = useCallback(
    (p: SP_COIN_DISPLAY, reason: ProbeOpts = 'openPanel') => {
      const parent = `usePanelTreeProbe:${reason}`;

      // Avoid noisy intent marks if already visible
      if (!isVisible(p)) {
        markPanelApply(p, SP_COIN_DISPLAY[p], true, reason);
      }

      return openPanel(p, parent);
    },
    [openPanel, isVisible]
  );

  const close = useCallback(
    (p: SP_COIN_DISPLAY, reason: ProbeOpts = 'closePanel') => {
      const parent = `usePanelTreeProbe:${reason}`;

      // Only mark close when it would actually change state
      if (isVisible(p)) {
        markPanelApply(p, SP_COIN_DISPLAY[p], false, reason);
        markPanelClosed(reason);
      }

      return closePanel(p, parent);
    },
    [closePanel, isVisible]
  );

  return { openPanel: open, closePanel: close, isVisible };
}
