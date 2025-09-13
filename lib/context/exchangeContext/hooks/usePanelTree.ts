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
  children?: MainPanelNode[]; // ignored in array mode; kept for compat
};

function clone<T>(o: T): T {
  return typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));
}

/** Normalize settings.mainPanelNode into a flat list (supports object or array). */
function toList(nodeOrList?: MainPanelNode | PanelEntry[]): PanelEntry[] {
  if (!nodeOrList) return [];
  if (Array.isArray(nodeOrList)) return nodeOrList as PanelEntry[];

  // Back-compat: flatten a tree root (root + its direct children)
  const root = nodeOrList as MainPanelNode;
  const base: PanelEntry[] = [
    { panel: root.panel, name: (root as any).name, visible: root.visible, children: root.children },
  ];
  for (const c of root.children ?? []) {
    base.push({ panel: c.panel, name: (c as any).name, visible: c.visible, children: c.children });
  }
  return base;
}

function findInList(list: PanelEntry[], panel: SP_COIN_DISPLAY): PanelEntry | undefined {
  return list.find((e) => e.panel === panel);
}

function isMainOverlay(panel: SP_COIN_DISPLAY) {
  return MAIN_OVERLAY_GROUP.includes(panel);
}

/** Enforce exactly one visible among MAIN_OVERLAY_GROUP; fallback to TRADING. */
function ensureRadioInvariant(list: PanelEntry[]): PanelEntry[] {
  let visibleCount = 0;
  for (const p of MAIN_OVERLAY_GROUP) {
    const n = findInList(list, p);
    if (n?.visible) visibleCount += 1;
  }
  if (visibleCount === 1) return list;

  const next = clone(list);
  for (const p of MAIN_OVERLAY_GROUP) {
    const n = findInList(next, p);
    if (n) n.visible = p === TRADING;
  }
  return next;
}

export function usePanelTree() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  // Always operate on a flat list view internally
  const list = useMemo(
    () => toList((exchangeContext as any)?.settings?.mainPanelNode),
    [exchangeContext]
  );

  // Reconcile radio invariants whenever the list hydrates/changes
  useEffect(() => {
    if (!list.length) return;
    const repaired = ensureRadioInvariant(list);
    // If a repair happened (object identity differs), persist it back as an array
    if (repaired !== list) {
      setExchangeContext(
        (prev) => ({
          ...prev,
          settings: { ...(prev as any).settings, mainPanelNode: repaired },
        }),
        'usePanelTree:reconcile(array)'
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length]);

  const isVisible = useCallback(
    (panel: SP_COIN_DISPLAY) => !!findInList(list, panel)?.visible,
    [list]
  );

  const openPanel = useCallback(
    (panel: SP_COIN_DISPLAY) => {
      if (!list.length) return;
      setExchangeContext(
        (prev) => {
          const current = toList((prev as any)?.settings?.mainPanelNode);
          if (!current.length) return prev;

          const next = clone(current);

          if (isMainOverlay(panel)) {
            // Radio behavior: set only this overlay visible
            for (const p of MAIN_OVERLAY_GROUP) {
              const n = findInList(next, p);
              if (n) n.visible = p === panel;
            }
          } else {
            const n = findInList(next, panel);
            if (n) n.visible = true;
          }

          return {
            ...prev,
            settings: { ...(prev as any).settings, mainPanelNode: next },
          };
        },
        'usePanelTree:openPanel(array)'
      );
    },
    [list, setExchangeContext]
  );

  const closePanel = useCallback(
    (panel: SP_COIN_DISPLAY) => {
      if (!list.length) return;
      if (isMainOverlay(panel)) return; // cannot close radio overlays

      setExchangeContext(
        (prev) => {
          const current = toList((prev as any)?.settings?.mainPanelNode);
          if (!current.length) return prev;

          const next = clone(current);
          const n = findInList(next, panel);
          if (n) n.visible = false;

          return {
            ...prev,
            settings: { ...(prev as any).settings, mainPanelNode: next },
          };
        },
        'usePanelTree:closePanel(array)'
      );
    },
    [list, setExchangeContext]
  );

  const activeMainOverlay = useMemo<SP_COIN_DISPLAY>(() => {
    for (const p of MAIN_OVERLAY_GROUP) {
      const n = findInList(list, p);
      if (n?.visible) return p;
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
