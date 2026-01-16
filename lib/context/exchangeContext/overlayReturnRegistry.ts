// File: @/lib/context/exchangeContext/overlayReturnRegistry.ts
'use client';

import { SP_COIN_DISPLAY } from '@/lib/structure';

/**
 * For each overlay panel, remember which panel opened it.
 * Example:
 *   RECIPIENT_LIST_SELECT_PANEL_OLD → STAKING_SPCOINS_PANEL
 */
const overlayCaller = new Map<SP_COIN_DISPLAY, SP_COIN_DISPLAY>();

export function setOverlayCaller(
  child: SP_COIN_DISPLAY,
  parent: SP_COIN_DISPLAY,
) {
  overlayCaller.set(child, parent);
}

export function getOverlayCaller(
  child: SP_COIN_DISPLAY,
): SP_COIN_DISPLAY | undefined {
  return overlayCaller.get(child);
}

export function clearOverlayCaller(child: SP_COIN_DISPLAY) {
  overlayCaller.delete(child);
}

/** Optional helper if you want to debug the state. */
export function getAllOverlayCallers() {
  return Array.from(overlayCaller.entries());
}
