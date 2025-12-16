// File: @/lib/context/exchangeContext/panelTree/panelTreeRadio.ts

import { SP_COIN_DISPLAY } from '@/lib/structure';
import type { PanelEntry } from './panelTreePersistence';
import { ensurePanelPresent, panelName } from './panelTreePersistence';

export function applyGlobalRadio(
  accIn: PanelEntry[],
  overlays: SP_COIN_DISPLAY[],
  target: SP_COIN_DISPLAY,
  withName: (e: PanelEntry) => PanelEntry,
) {
  return overlays.reduce((acc, id) => {
    const idx = acc.findIndex((e) => e.panel === id);
    if (idx >= 0) {
      acc[idx] = { ...withName(acc[idx]), visible: id === target };
    } else {
      acc.push({
        panel: id as SP_COIN_DISPLAY,
        visible: id === target,
        name: panelName(id),
      });
    }
    return acc;
  }, [...accIn]);
}

export function clearGlobalRadio(
  flat0: PanelEntry[],
  overlays: SP_COIN_DISPLAY[],
  withName: (e: PanelEntry) => PanelEntry,
) {
  return overlays.reduce((acc, id) => {
    const idx = acc.findIndex((e) => e.panel === id);
    if (idx >= 0) {
      acc[idx] = { ...withName(acc[idx]), visible: false };
    } else {
      acc.push({
        panel: id as SP_COIN_DISPLAY,
        visible: false,
        name: panelName(id),
      });
    }
    return acc;
  }, [...flat0]);
}

export function switchToDefaultGlobal(
  flatIn: PanelEntry[],
  overlays: SP_COIN_DISPLAY[],
  defaultOverlay: SP_COIN_DISPLAY,
  withName: (e: PanelEntry) => PanelEntry,
) {
  let next = ensurePanelPresent(flatIn, defaultOverlay);
  next = applyGlobalRadio(next, overlays, defaultOverlay, withName);
  return next;
}
