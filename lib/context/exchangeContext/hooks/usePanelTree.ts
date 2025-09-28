// File: lib/context/exchangeContext/hooks/usePanelTree.ts
'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/constants/spCoinDisplay';
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

/* --------------------------------- hook --------------------------------- */

export function usePanelTree() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  // Always operate on a flat list
  const list = useMemo<PanelEntry[]>(
    () => readFlatList(exchangeContext),
    [exchangeContext]
  );

  // Keep the radio set limited to ids that exist in the flat list
  const radioRootIds = useMemo<SP_COIN_DISPLAY[]>(
    () =>
      list
        .map((e) => e.panel)
        .filter((id): id is SP_COIN_DISPLAY => MAIN_OVERLAY_GROUP.includes(id)),
    [list]
  );

  // One-time reconciliation if multiple radio overlays are visible
  useEffect(() => {
    if (!list.length || !radioRootIds.length) return;
    const vis = radioRootIds.filter((id) => list.find((e) => e.panel === id && e.visible));
    if (vis.length <= 1) return;

    debugLog.log('reconcile: multiple radio visible → collapsing to first');
    setExchangeContext(
      (prev) => {
        const flat = readFlatList(prev);
        const next = reconcileRadio(flat, radioRootIds);
        return { ...prev, settings: { ...(prev as any).settings, mainPanelNode: next } };
      },
      'usePanelTree:reconcile'
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radioRootIds.join('|'), list.length]);

  /* ------------------------------- queries ------------------------------- */

  const isVisible = useCallback(
    (panel: SP_COIN_DISPLAY) => {
      const map = toMap(list);
      return !!map[panel];
    },
    [list]
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

          // Radio overlays: exclusive selection among radio roots that exist
          if (radioRootIds.includes(panel)) {
            const next = flat.map((e) =>
              radioRootIds.includes(e.panel) ? { ...e, visible: e.panel === panel } : e
            );
            debugLog.log('open:radio', { panel });
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
    [setExchangeContext, radioRootIds]
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
    for (const id of radioRootIds) {
      if (list.find((e) => e.panel === id)?.visible) return id;
    }
    return TRADING;
  }, [list, radioRootIds]);

  // Use the updated enum names from your recent config (scroll panels)
  const isTokenScrollVisible = useMemo(
    () =>
      isVisible(SP_COIN_DISPLAY.BUY_SELECT_PANEL) ||
      isVisible(SP_COIN_DISPLAY.SELL_SELECT_PANEL),
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
