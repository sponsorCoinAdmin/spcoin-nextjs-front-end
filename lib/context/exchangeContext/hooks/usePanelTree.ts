// File: lib/context/exchangeContext/hooks/usePanelTree.ts
'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/registry/panelRegistry';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_TREE === 'true';
const debugLog = createDebugLogger('usePanelTree', DEBUG_ENABLED, LOG_TIME);

const TRADING = SP_COIN_DISPLAY.TRADING_STATION_PANEL;

/** The only shape we keep now: flat list of { panel, visible }. */
type PanelEntry = { panel: SP_COIN_DISPLAY; visible: boolean };

/* ------------------------------ helpers ------------------------------ */

/** Recursively flatten any legacy nested structure into a flat list. */
function flattenAny(nodes: any[] | undefined, out: PanelEntry[] = []): PanelEntry[] {
  if (!Array.isArray(nodes)) return out;
  for (const n of nodes) {
    if (n && typeof n === 'object' && typeof n.panel === 'number') {
      out.push({ panel: n.panel as SP_COIN_DISPLAY, visible: !!n.visible });
      if (Array.isArray(n.children) && n.children.length) flattenAny(n.children, out);
    }
  }
  return out;
}

/** Read the current flat list from context, flattening legacy trees if needed. */
function readFlatList(exchangeContext: any): PanelEntry[] {
  const raw = exchangeContext?.settings?.mainPanelNode;
  const flat = flattenAny(Array.isArray(raw) ? raw : []);
  // De-dupe by panel id (keep first occurrence)
  const seen = new Set<number>();
  const dedup: PanelEntry[] = [];
  for (const e of flat) {
    if (!seen.has(e.panel)) {
      seen.add(e.panel);
      dedup.push(e);
    }
  }
  return dedup;
}

/** Convert flat list to a fast lookup map. */
function toMap(list: PanelEntry[]): Record<number, boolean> {
  const m: Record<number, boolean> = {};
  for (const e of list) m[e.panel] = !!e.visible;
  return m;
}

/** Ensure at most one visible in the radio group; keep first visible or TRADING if needed. */
function reconcileRadio(list: PanelEntry[], radioIds: SP_COIN_DISPLAY[]): PanelEntry[] {
  const visible = radioIds.filter((id) => list.find((e) => e.panel === id && e.visible));
  if (visible.length <= 1) return list; // already fine (0 or 1)
  const keep = visible[0] ?? TRADING;
  return list.map((e) =>
    radioIds.includes(e.panel) ? { ...e, visible: e.panel === keep } : e
  );
}

/** Upsert a single panel’s visibility (non-radio). */
function setVisible(list: PanelEntry[], panel: SP_COIN_DISPLAY, visible: boolean): PanelEntry[] {
  const idx = list.findIndex((e) => e.panel === panel);
  if (idx === -1) return [...list, { panel, visible }];
  if (list[idx].visible === visible) return list;
  const next = [...list];
  next[idx] = { ...next[idx], visible };
  return next;
}

/** Ensure all required radio ids exist in the flat list (hidden by default). */
function ensurePresent(list: PanelEntry[], required: SP_COIN_DISPLAY[]): PanelEntry[] {
  const have = new Set(list.map((e) => e.panel));
  const adds = required
    .filter((id) => !have.has(id))
    .map((id) => ({ panel: id, visible: false } as PanelEntry));
  return adds.length ? [...list, ...adds] : list;
}

/* --------------------------------- hook --------------------------------- */

export function usePanelTree() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  // Always operate on a flat list from state
  const list = useMemo<PanelEntry[]>(
    () => readFlatList(exchangeContext),
    [exchangeContext]
  );

  // Fast lookup for visibility checks
  const visMap = useMemo(() => toMap(list), [list]);

  // Canonical radio ids come from the registry-backed constant
  const radioAllIds = MAIN_OVERLAY_GROUP as SP_COIN_DISPLAY[];

  // Among the current list, which radios are already present?
  const radioPresentIds = useMemo<SP_COIN_DISPLAY[]>(
    () => list.map((e) => e.panel).filter((id): id is SP_COIN_DISPLAY => radioAllIds.includes(id)),
    [list, radioAllIds]
  );

  // If multiple radio overlays are visible, collapse to the first.
  // Also auto-append any missing radio ids (hidden) so new overlays migrate into old local states.
  useEffect(() => {
    if (!radioAllIds.length) return;

    setExchangeContext(
      (prev) => {
        const flat = readFlatList(prev);

        // 1) Ensure all radio ids are present (hidden by default)
        const withAll = ensurePresent(flat, radioAllIds);

        // 2) Reconcile if multiple radios are visible
        const currentlyVisible = radioAllIds.filter((id) =>
          withAll.find((e) => e.panel === id && e.visible)
        );
        if (currentlyVisible.length <= 1) {
          // nothing to reconcile, but we may still have appended missing radios
          if (withAll === flat) return prev; // no-op
          debugLog.log('migrate: appended missing radio ids (hidden)');
          return { ...prev, settings: { ...(prev as any).settings, mainPanelNode: withAll } };
        }

        debugLog.log('reconcile: multiple radio visible → collapsing to first');
        const next = reconcileRadio(withAll, radioAllIds);
        return { ...prev, settings: { ...(prev as any).settings, mainPanelNode: next } };
      },
      'usePanelTree:reconcile+migrate'
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radioAllIds.join('|')]);

  /* ------------------------------- queries ------------------------------- */

  const isVisible = useCallback(
    (panel: SP_COIN_DISPLAY) => !!visMap[panel],
    [visMap]
  );

  // Children are no longer modeled; return [] for compatibility.
  const getPanelChildren = useCallback((_parent: SP_COIN_DISPLAY) => [] as SP_COIN_DISPLAY[], []);

  /* ------------------------------- actions ------------------------------- */

  const openPanel = useCallback(
    (panel: SP_COIN_DISPLAY) => {
      debugLog.log('open:req', { panel });

      setExchangeContext(
        (prev) => {
          const flat = readFlatList(prev);

          // For radio overlays: ensure all radios exist, then exclusively select this one
          if (radioAllIds.includes(panel)) {
            const withAll = ensurePresent(flat, radioAllIds);
            const next = withAll.map((e) =>
              radioAllIds.includes(e.panel) ? { ...e, visible: e.panel === panel } : e
            );
            debugLog.log('open:radio', { panel });
            // If nothing changed, avoid write
            if (JSON.stringify(next) === JSON.stringify(flat)) return prev;
            return { ...prev, settings: { ...(prev as any).settings, mainPanelNode: next } };
          }

          // Non-radio: simply set this one to visible (idempotent)
          const next = setVisible(flat, panel, true);
          if (next === flat) {
            debugLog.log('open:non-radio-noop', { panel });
            return prev;
          }
          debugLog.log('open:non-radio', { panel });
          return { ...prev, settings: { ...(prev as any).settings, mainPanelNode: next } };
        },
        'usePanelTree:open'
      );
    },
    [setExchangeContext, radioAllIds]
  );

  const closePanel = useCallback(
    (panel: SP_COIN_DISPLAY) => {
      debugLog.log('close:req', { panel });

      setExchangeContext(
        (prev) => {
          const flat = readFlatList(prev);
          const cur = flat.find((e) => e.panel === panel);
          if (!cur || cur.visible === false) {
            debugLog.log('close:noop', { panel });
            return prev;
          }
          const next = setVisible(flat, panel, false);
          debugLog.log('close:set', { panel });
          return { ...prev, settings: { ...(prev as any).settings, mainPanelNode: next } };
        },
        'usePanelTree:close'
      );
    },
    [setExchangeContext]
  );

  /* ------------------------------- derived -------------------------------- */

  const activeMainOverlay = useMemo<SP_COIN_DISPLAY>(() => {
    // Prefer the first radio id that is visible, else default to TRADING
    for (const id of radioAllIds) {
      if (list.find((e) => e.panel === id)?.visible) return id as SP_COIN_DISPLAY;
    }
    return TRADING;
  }, [list, radioAllIds]);

  // Token “scroll/list” overlays visible?
  const isTokenScrollVisible = useMemo(
    () =>
      isVisible(SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST) ||
      isVisible(SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST),
    [isVisible]
  );

  return {
    // state
    activeMainOverlay,

    // queries
    isVisible,
    isTokenScrollVisible,
    getPanelChildren, // now always []

    // actions
    openPanel,
    closePanel,
  };
}
