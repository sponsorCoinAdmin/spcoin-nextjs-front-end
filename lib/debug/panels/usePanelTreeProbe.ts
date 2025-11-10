// File: lib/debug/panels/usePanelTreeProbe.ts
'use client';

import { useCallback } from 'react';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { markPanelApply, markPanelClosed } from './panelVisibilityProbe';

type ProbeOpts =
  | string
  | {
      reason?: string;
      parent?: SP_COIN_DISPLAY; // forwarded to usePanelTree (logged there)
    };

export function usePanelTreeProbe() {
  const { openPanel, closePanel, isVisible } = usePanelTree();

  const open = useCallback(
    (p: SP_COIN_DISPLAY, opts: ProbeOpts = 'openPanel') => {
      const reason = typeof opts === 'string' ? opts : opts.reason ?? 'openPanel';
      const parent = typeof opts === 'string' ? undefined : opts.parent;

      // Avoid noisy intent marks if already visible
      if (!isVisible(p)) {
        markPanelApply(p, SP_COIN_DISPLAY[p], true, reason);
      }

      // Thread reason (+ parent if provided) into panelTree
      return typeof opts === 'string'
        ? openPanel(p, `usePanelTreeProbe:${reason}`)
        : openPanel(p, { reason: `usePanelTreeProbe:${reason}`, parent });
    },
    [openPanel, isVisible]
  );

  const close = useCallback(
    (p: SP_COIN_DISPLAY, opts: ProbeOpts = 'closePanel') => {
      const reason = typeof opts === 'string' ? opts : opts.reason ?? 'closePanel';
      const parent = typeof opts === 'string' ? undefined : opts.parent;

      // Only mark close when it would actually change state
      if (isVisible(p)) {
        markPanelApply(p, SP_COIN_DISPLAY[p], false, reason);
        markPanelClosed(reason);
      }

      return typeof opts === 'string'
        ? closePanel(p, `usePanelTreeProbe:${reason}`)
        : closePanel(p, { reason: `usePanelTreeProbe:${reason}`, parent });
    },
    [closePanel, isVisible]
  );

  return { openPanel: open, closePanel: close, isVisible };
}
