// File: @/lib/context/exchangeContext/panelTree/panelTreeRadio.ts
import { SP_COIN_DISPLAY } from '@/lib/structure';
import type { PanelEntry } from './panelTreePersistence';
import { ensurePanelPresent, panelName } from './panelTreePersistence';

const DEBUG_RADIO = process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_TREE === 'true';

const nameOf = (id: SP_COIN_DISPLAY) => SP_COIN_DISPLAY[id] ?? String(id);

function summarizeOverlayState(list: PanelEntry[], overlays: SP_COIN_DISPLAY[]) {
  return list
    .filter((e) => overlays.includes(e.panel))
    .map((e) => ({ p: nameOf(e.panel), v: !!e.visible }));
}

function hasAnyVisible(list: PanelEntry[], overlays: SP_COIN_DISPLAY[]) {
  for (const e of list) {
    if (overlays.includes(e.panel) && !!e.visible) return true;
  }
  return false;
}

function diffCount(
  before: Array<{ p: string; v: boolean }>,
  after: Array<{ p: string; v: boolean }>,
) {
  const m = new Map(before.map((x) => [x.p, x.v]));
  let changed = 0;
  for (const a of after) {
    if (m.get(a.p) !== a.v) changed++;
  }
  return changed;
}

/**
 * Enforces a "global overlay radio" selection:
 * - exactly one overlay in `overlays` is visible (the `target`)
 * - other overlays are set to visible=false
 *
 * Stage4 note:
 * - When using branch replay, this is called repeatedly during replay.
 * - It is intentionally deterministic: it always enforces the full group.
 */
export function applyGlobalRadio(
  accIn: PanelEntry[],
  overlays: SP_COIN_DISPLAY[],
  target: SP_COIN_DISPLAY,
  withName: (e: PanelEntry) => PanelEntry,
) {
  const before = DEBUG_RADIO ? summarizeOverlayState(accIn, overlays) : null;

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
    const after = summarizeOverlayState(out, overlays);
    const changed = diffCount(before ?? [], after);

    // Only log when something actually changes (keeps logs readable).
    if (changed > 0) {
      // eslint-disable-next-line no-console
      console.log('[panelTreeRadio] applyGlobalRadio', {
        target: nameOf(target),
        changed,
        before,
        after,
      });
    }
  }

  return out;
}

export function clearGlobalRadio(
  flat0: PanelEntry[],
  overlays: SP_COIN_DISPLAY[],
  withName: (e: PanelEntry) => PanelEntry,
) {
  const shouldLog = DEBUG_RADIO && hasAnyVisible(flat0, overlays);
  const before = shouldLog ? summarizeOverlayState(flat0, overlays) : null;

  const out = overlays.reduce((acc, id) => {
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

  if (shouldLog) {
    const after = summarizeOverlayState(out, overlays);
    const changed = diffCount(before ?? [], after);
    if (changed > 0) {
      // eslint-disable-next-line no-console
      console.log('[panelTreeRadio] clearGlobalRadio', {
        changed,
        before,
        after,
      });
    }
  }

  return out;
}

/**
 * NEW (Stage4): ensure exactly one overlay is visible.
 * - If any overlay is already visible, do nothing.
 * - Otherwise ensure defaultOverlay is present and selected.
 *
 * This is handy for branch replay and close paths.
 */
export function ensureOneGlobalOverlayVisible(
  flatIn: PanelEntry[],
  overlays: SP_COIN_DISPLAY[],
  defaultOverlay: SP_COIN_DISPLAY,
  withName: (e: PanelEntry) => PanelEntry,
) {
  const m = new Map<number, boolean>();
  for (const e of flatIn) m.set(Number(e.panel), !!e.visible);

  let any = false;
  for (const id of overlays) {
    if (m.get(Number(id))) {
      any = true;
      break;
    }
  }
  if (any) return flatIn;

  let next = ensurePanelPresent(flatIn, defaultOverlay);
  next = applyGlobalRadio(next, overlays, defaultOverlay, withName);
  return next;
}

export function switchToDefaultGlobal(
  flatIn: PanelEntry[],
  overlays: SP_COIN_DISPLAY[],
  defaultOverlay: SP_COIN_DISPLAY,
  withName: (e: PanelEntry) => PanelEntry,
) {
  // Keep this log minimal: this is usually only hit during fallback paths.
  if (DEBUG_RADIO) {
    // eslint-disable-next-line no-console
    console.log('[panelTreeRadio] switchToDefaultGlobal', {
      defaultOverlay: nameOf(defaultOverlay),
    });
  }

  let next = ensurePanelPresent(flatIn, defaultOverlay);
  next = applyGlobalRadio(next, overlays, defaultOverlay, withName);
  return next;
}
