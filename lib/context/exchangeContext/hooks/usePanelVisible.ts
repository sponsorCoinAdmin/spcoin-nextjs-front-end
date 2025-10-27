// File: lib/context/exchangeContext/hooks/usePanelVisible.ts

import { useSyncExternalStore } from 'react';
import { panelStore } from '@/lib/context/exchangeContext/panelStore';
import type { SP_COIN_DISPLAY } from '@/lib/structure';

/**
 * Subscribe to a single panel's visibility.
 * Component re-renders only when THIS panel changes.
 */
export function usePanelVisible(id: SP_COIN_DISPLAY): boolean {
  return useSyncExternalStore(
    (cb) => panelStore.subscribePanel(id, cb),
    () => panelStore.getPanelSnapshot(id),
    () => panelStore.getPanelSnapshot(id)
  );
}
