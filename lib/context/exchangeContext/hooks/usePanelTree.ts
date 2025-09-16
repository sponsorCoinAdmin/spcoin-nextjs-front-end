// File: lib/context/exchangeContext/hooks/usePanelTree.ts
'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/constants/spCoinDisplay';

const TRADING = SP_COIN_DISPLAY.TRADING_STATION_PANEL;

type ChildEntry = {
  panel: SP_COIN_DISPLAY;
  visible: boolean;
  children?: ChildEntry[];
};

type PanelEntry = ChildEntry;

/* ----------------------------- type guards ----------------------------- */

const isChildArray = (x: any): x is ChildEntry[] =>
  Array.isArray(x) &&
  x.every(
    (n) =>
      n &&
      typeof n === 'object' &&
      typeof (n as any).panel === 'number' &&
      typeof (n as any).visible === 'boolean' &&
      (((n as any).children === undefined) || isChildArray((n as any).children))
  );

const isPanelArray = (x: any): x is PanelEntry[] =>
  Array.isArray(x) &&
  x.every(
    (n) =>
      n &&
      typeof n === 'object' &&
      typeof (n as any).panel === 'number' &&
      typeof (n as any).visible === 'boolean' &&
      (((n as any).children === undefined) || isChildArray((n as any).children))
  );

/* ------------------------------ utilities ------------------------------ */

function clone<T>(o: T): T {
  return typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));
}

/** Recursively find a child by panel id. */
function findChildById(nodes: ChildEntry[] | undefined, id: SP_COIN_DISPLAY): ChildEntry | undefined {
  if (!nodes) return undefined;
  for (const n of nodes) {
    if (n.panel === id) return n;
    const found = findChildById(n.children, id);
    if (found) return found;
  }
  return undefined;
}

/** Recursively set a child's visible property; returns new cloned subtree + change flag. */
function setChildVisibleIn(
  nodes: ChildEntry[] | undefined,
  id: SP_COIN_DISPLAY,
  visible: boolean
): { nodes?: ChildEntry[]; changed: boolean } {
  if (!nodes) return { nodes, changed: false };

  let changed = false;
  const next = nodes.map((n) => {
    let nodeChanged = false;
    let newChildren: ChildEntry[] | undefined = n.children;

    if (n.children && n.children.length) {
      const res = setChildVisibleIn(n.children, id, visible);
      if (res.changed) {
        nodeChanged = true;
        newChildren = res.nodes;
      }
    }

    if (n.panel === id && n.visible !== visible) {
      nodeChanged = true;
    }

    if (nodeChanged) {
      changed = true;
      return {
        ...n,
        visible: n.panel === id ? visible : n.visible,
        children: newChildren,
      };
    }
    return n;
  });

  return { nodes: changed ? next : nodes, changed };
}

/** Find visibility for any id (root or nested). */
function isVisibleInTree(list: PanelEntry[], id: SP_COIN_DISPLAY): boolean {
  const root = list.find((e) => e.panel === id);
  if (root) return !!root.visible;
  for (const r of list) {
    const c = findChildById(r.children, id);
    if (c) return !!c.visible;
  }
  return false;
}

/** Get children for any id (root or nested). */
function getChildrenFromTree(list: PanelEntry[], id: SP_COIN_DISPLAY): ChildEntry[] {
  const root = list.find((e) => e.panel === id);
  if (root && Array.isArray(root.children)) return root.children;
  for (const r of list) {
    const c = findChildById(r.children, id);
    if (c && Array.isArray(c.children)) return c.children;
  }
  return [];
}

/** Set visible for any id (root or nested). Returns { list, changed }. */
function setVisibleForId(
  list: PanelEntry[],
  id: SP_COIN_DISPLAY,
  visible: boolean
): { list: PanelEntry[]; changed: boolean } {
  // Root first
  const idx = list.findIndex((e) => e.panel === id);
  if (idx >= 0) {
    if (list[idx].visible === visible) return { list, changed: false };
    const next = clone(list);
    next[idx] = { ...next[idx], visible };
    return { list: next, changed: true };
  }

  // Then nested
  const next = clone(list);
  let changed = false;
  for (let i = 0; i < next.length; i++) {
    const res = setChildVisibleIn(next[i].children, id, visible);
    if (res.changed) {
      next[i] = { ...next[i], children: res.nodes };
      changed = true;
      break;
    }
  }
  return { list: changed ? next : list, changed };
}

/* --------------------------------- hook --------------------------------- */

export function usePanelTree() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  // Authoritative list of main overlays (array, may include children)
  const list = useMemo<PanelEntry[]>(
    () =>
      isPanelArray((exchangeContext as any)?.settings?.mainPanelNode)
        ? ((exchangeContext as any).settings.mainPanelNode as PanelEntry[])
        : [],
    [exchangeContext]
  );

  // Keep exactly one visible panel across MAIN_OVERLAY_GROUP (fallback to TRADING)
  useEffect(() => {
    if (!list.length) return;

    const visibleCount = MAIN_OVERLAY_GROUP.reduce(
      (n, id) => n + (list.find((e) => e.panel === id)?.visible ? 1 : 0),
      0
    );
    if (visibleCount === 1) return;

    setExchangeContext(
      (prev) => {
        const current = isPanelArray((prev as any)?.settings?.mainPanelNode)
          ? ((prev as any).settings.mainPanelNode as PanelEntry[])
          : [];
        if (!current.length) return prev;

        const next = current.map((e) =>
          MAIN_OVERLAY_GROUP.includes(e.panel)
            ? { ...e, visible: e.panel === TRADING }
            : e
        );

        return { ...prev, settings: { ...(prev as any).settings, mainPanelNode: next } };
      },
      'usePanelTree:reconcile'
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length]);

  /* ------------------------------- queries ------------------------------- */

  /** Works for BOTH radio overlays and nested children. */
  const isVisible = useCallback(
    (panel: SP_COIN_DISPLAY) => isVisibleInTree(list, panel),
    [list]
  );

  /** Children for a node (root or nested). */
  const getPanelChildren = useCallback(
    (parent: SP_COIN_DISPLAY): SP_COIN_DISPLAY[] =>
      getChildrenFromTree(list, parent)
        .map((c) => c?.panel)
        .filter((p): p is SP_COIN_DISPLAY => typeof p === 'number'),
    [list]
  );

  /* ------------------------------- actions -------------------------------- */

  const openPanel = useCallback(
    (panel: SP_COIN_DISPLAY) => {
      setExchangeContext(
        (prev) => {
          const current = isPanelArray((prev as any)?.settings?.mainPanelNode)
            ? ((prev as any).settings.mainPanelNode as PanelEntry[])
            : [];
          if (!current.length) return prev;

          // Radio overlays → exclusive selection
          if (MAIN_OVERLAY_GROUP.includes(panel)) {
            const alreadyActive = current.some(
              (e) => MAIN_OVERLAY_GROUP.includes(e.panel) && e.panel === panel && e.visible
            );
            if (alreadyActive) return prev;

            const next = current.map((e) =>
              MAIN_OVERLAY_GROUP.includes(e.panel)
                ? { ...e, visible: e.panel === panel }
                : e
            );
            return { ...prev, settings: { ...(prev as any).settings, mainPanelNode: next } };
          }

          // Non-radio panels → just set its visible = true anywhere in the tree
          const { list: next, changed } = setVisibleForId(current, panel, true);
          if (!changed) return prev;
          return { ...prev, settings: { ...(prev as any).settings, mainPanelNode: next } };
        },
        'usePanelTree:openPanel'
      );
    },
    [setExchangeContext]
  );

  const closePanel = useCallback(
    (panel: SP_COIN_DISPLAY) => {
      // Radio overlays aren't closable
      if (MAIN_OVERLAY_GROUP.includes(panel)) return;

      setExchangeContext(
        (prev) => {
          const current = isPanelArray((prev as any)?.settings?.mainPanelNode)
            ? ((prev as any).settings.mainPanelNode as PanelEntry[])
            : [];
          if (!current.length) return prev;

          const { list: next, changed } = setVisibleForId(current, panel, false);
          if (!changed) return prev;
          return { ...prev, settings: { ...(prev as any).settings, mainPanelNode: next } };
        },
        'usePanelTree:closePanel'
      );
    },
    [setExchangeContext]
  );

  /* ------------------------------- derived -------------------------------- */

  const activeMainOverlay = useMemo<SP_COIN_DISPLAY>(() => {
    for (const id of MAIN_OVERLAY_GROUP) {
      if (list.find((e) => e.panel === id)?.visible) return id;
    }
    return TRADING;
  }, [list]);

  const isTokenScrollVisible = useMemo(
    () =>
      isVisibleInTree(list, SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL) ||
      isVisibleInTree(list, SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL),
    [list]
  );

  return {
    // state
    activeMainOverlay,

    // queries
    isVisible,
    isTokenScrollVisible,
    getPanelChildren,

    // actions
    openPanel,
    closePanel,
  };
}
