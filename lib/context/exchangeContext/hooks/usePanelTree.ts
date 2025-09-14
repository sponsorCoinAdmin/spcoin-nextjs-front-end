// File: lib/context/exchangeContext/hooks/usePanelTree.ts
'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import type { MainPanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';
import { MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/constants/spCoinDisplay';

const TRADING = SP_COIN_DISPLAY.TRADING_STATION_PANEL;

type PanelEntry = {
  panel: SP_COIN_DISPLAY;
  name?: string;
  visible?: boolean;
  // kept for legacy flattening compatibility (not used in array mode)
  children?: MainPanelNode[];
};

const clone = <T,>(o: T): T =>
  typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));

/** Normalize settings.mainPanelNode into a flat list (supports legacy object or array). */
function toList(nodeOrList?: MainPanelNode | PanelEntry[]): PanelEntry[] {
  if (!nodeOrList) return [];
  if (Array.isArray(nodeOrList)) return nodeOrList as PanelEntry[];

  const root = nodeOrList as MainPanelNode;
  const base: PanelEntry[] = [{ panel: root.panel, name: (root as any).name, visible: root.visible, children: root.children }];
  for (const c of root.children ?? []) {
    base.push({ panel: c.panel, name: (c as any).name, visible: c.visible, children: c.children });
  }
  return base;
}

const findInList = (list: PanelEntry[], panel: SP_COIN_DISPLAY) => list.find((e) => e.panel === panel);
const isMainOverlay = (panel: SP_COIN_DISPLAY) => MAIN_OVERLAY_GROUP.includes(panel);

/** Enforce exactly one visible among MAIN_OVERLAY_GROUP; fallback to TRADING if needed. */
function ensureRadioInvariant(list: PanelEntry[]): PanelEntry[] {
  const visibleCount = MAIN_OVERLAY_GROUP.reduce((n, p) => n + (findInList(list, p)?.visible ? 1 : 0), 0);
  if (visibleCount === 1) return list;

  const next = clone(list);
  for (const p of MAIN_OVERLAY_GROUP) {
    const n = findInList(next, p);
    if (n) n.visible = p === TRADING;
  }
  return next;
}

/** Read ephemeral visibility map for non-main panels. */
const getNonMainMap = (ctx: any): Record<number, boolean> =>
  ((ctx?.settings?.ui ?? {}).nonMainVisible ?? {}) as Record<number, boolean>;

/** Helper to update settings.ui.nonMainVisible immutably. */
function withNonMainUpdate(prev: any, updater: (map: Record<number, boolean>) => Record<number, boolean>) {
  const next = clone(prev);
  const settings = (next.settings ??= {});
  const ui = (settings.ui ??= {});
  const current = (ui.nonMainVisible ?? {}) as Record<number, boolean>;
  ui.nonMainVisible = updater(current);
  return next;
}

export function usePanelTree() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  // Always operate on a flat list for main overlays
  const list = useMemo(() => toList((exchangeContext as any)?.settings?.mainPanelNode), [exchangeContext]);

  // Reconcile radio invariants whenever the list hydrates/changes
  useEffect(() => {
    if (!list.length) return;
    const repaired = ensureRadioInvariant(list);
    if (repaired !== list) {
      setExchangeContext(
        (prev) => ({
          ...prev,
          settings: { ...(prev as any).settings, mainPanelNode: repaired },
        }),
        'usePanelTree:reconcile'
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length]);

  const isVisible = useCallback(
    (panel: SP_COIN_DISPLAY) =>
      isMainOverlay(panel)
        ? !!findInList(list, panel)?.visible
        : !!getNonMainMap(exchangeContext as any)[panel],
    [list, exchangeContext]
  );

  const openPanel = useCallback(
    (panel: SP_COIN_DISPLAY) => {
      if (isMainOverlay(panel)) {
        if (!list.length) return;
        setExchangeContext(
          (prev) => {
            const current = toList((prev as any)?.settings?.mainPanelNode);
            if (!current.length) return prev;

            const next = clone(current);
            for (const p of MAIN_OVERLAY_GROUP) {
              const n = findInList(next, p);
              if (n) n.visible = p === panel;
            }
            return { ...prev, settings: { ...(prev as any).settings, mainPanelNode: next } };
          },
          'usePanelTree:openPanel(main)'
        );
      } else {
        setExchangeContext(
          (prev) => withNonMainUpdate(prev, (m) => ({ ...m, [panel]: true })),
          'usePanelTree:openPanel(nonMain)'
        );
      }
    },
    [list, setExchangeContext]
  );

  const closePanel = useCallback(
    (panel: SP_COIN_DISPLAY) => {
      if (isMainOverlay(panel)) return; // cannot close radio overlays
      setExchangeContext(
        (prev) => withNonMainUpdate(prev, (m) => ({ ...m, [panel]: false })),
        'usePanelTree:closePanel(nonMain)'
      );
    },
    [setExchangeContext]
  );

  const activeMainOverlay = useMemo<SP_COIN_DISPLAY>(() => {
    for (const p of MAIN_OVERLAY_GROUP) {
      if (findInList(list, p)?.visible) return p;
    }
    return TRADING;
  }, [list]);

  const isTokenScrollVisible = useMemo(
    () =>
      !!findInList(list, SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL)?.visible ||
      !!findInList(list, SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL)?.visible,
    [list]
  );

  return {
    // state
    activeMainOverlay,
    // queries
    isVisible,
    isTokenScrollVisible,
    // actions
    openPanel,
    closePanel,
  };
}
