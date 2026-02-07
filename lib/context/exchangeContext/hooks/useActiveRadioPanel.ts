// File: @/lib/context/exchangeContext/hooks/useActiveRadioPanel.ts
'use client';

import { useSyncExternalStore } from 'react';
import { panelStore } from '@/lib/context/exchangeContext/panelStore';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { MAIN_RADIO_OVERLAY_PANELS } from '@/lib/structure/exchangeContext/constants/spCoinDisplay';

type SP = SP_COIN_DISPLAY;

/**
 * Returns the active "radio" overlay panel (only one should be visible at a time).
 * Source of truth is panelStore (same as usePanelVisible).
 */
export function useActiveRadioPanel(): SP | undefined {
  return useSyncExternalStore(
    (cb) => {
      // subscribe to all panels in the radio group
      const unsubs = (MAIN_RADIO_OVERLAY_PANELS as readonly SP[]).map((id) => panelStore.subscribePanel(id, cb));
      return () => {
        for (const u of unsubs) u?.();
      };
    },
    () => {
      // snapshot: find the first visible panel in the radio group
      for (const id of MAIN_RADIO_OVERLAY_PANELS as readonly SP[]) {
        if (panelStore.getPanelSnapshot(id)) return id;
      }
      return undefined;
    },
    // server snapshot must be deterministic
    () => undefined,
  );
}
