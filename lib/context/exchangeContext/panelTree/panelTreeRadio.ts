// File: @/lib/context/exchangeContext/panelTree/panelTreeRadio.ts
import { SP_COIN_DISPLAY } from '@/lib/structure';
import type { PanelEntry } from './panelTreePersistence';
import { ensurePanelPresent, panelName } from './panelTreePersistence';

const DEBUG_RADIO =
  process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_TREE === 'true';

const nameOf = (id: SP_COIN_DISPLAY) => SP_COIN_DISPLAY[id] ?? String(id);

export function applyGlobalRadio(
  accIn: PanelEntry[],
  overlays: SP_COIN_DISPLAY[],
  target: SP_COIN_DISPLAY,
  withName: (e: PanelEntry) => PanelEntry,
) {
  if (DEBUG_RADIO) {
    const before = accIn
      .filter((e) => overlays.includes(e.panel))
      .map((e) => ({ p: nameOf(e.panel), v: !!e.visible }));
    // eslint-disable-next-line no-console
    console.log('[panelTreeRadio] applyGlobalRadio BEFORE', {
      target: nameOf(target),
      before,
    });
  }

  const out = overlays.reduce((acc, id) => {
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

  if (DEBUG_RADIO) {
    const after = out
      .filter((e) => overlays.includes(e.panel))
      .map((e) => ({ p: nameOf(e.panel), v: !!e.visible }));
    // eslint-disable-next-line no-console
    console.log('[panelTreeRadio] applyGlobalRadio AFTER', {
      target: nameOf(target),
      after,
    });
  }

  return out;
}

export function clearGlobalRadio(
  flat0: PanelEntry[],
  overlays: SP_COIN_DISPLAY[],
  withName: (e: PanelEntry) => PanelEntry,
) {
  if (DEBUG_RADIO) {
    // eslint-disable-next-line no-console
    console.log('[panelTreeRadio] clearGlobalRadio', {
      overlays: overlays.map(nameOf),
    });
  }

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
