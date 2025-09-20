// File: lib/context/exchangeContext/hooks/usePanelTree.ts
'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/constants/spCoinDisplay';
import { createDebugLogger } from '@/lib/utils/debugLogger';

// ⬇️ Unified debug logger (kept)
const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_TREE === 'true';
const debugLog = createDebugLogger('PriceView', DEBUG_ENABLED, LOG_TIME);

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

/* ------------------------------ DEBUG utils ------------------------------ */

type PanelDbg = { panel: number; name?: string; visible?: boolean; children?: PanelDbg[] };

function __dbg_flatten(nodes: PanelDbg[] = [], out: PanelDbg[] = []): PanelDbg[] {
  for (const n of nodes) {
    out.push(n);
    if (n.children?.length) __dbg_flatten(n.children, out);
  }
  return out;
}
function __dbg_snap(nodes: PanelDbg[] = []) {
  return __dbg_flatten(nodes).map((n) => ({ panel: n.panel, name: n.name, visible: !!n.visible }));
}
/** path form: [idx, -1, childIdx, -1, ...] where -1 means ".children" boundary */
function __dbg_findPath(nodes: PanelDbg[] = [], id: number, path: number[] = []): number[] | null {
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (n.panel === id) return [...path, i];
    if (n.children?.length) {
      const p = __dbg_findPath(n.children, id, [...path, i, -1]);
      if (p) return p;
    }
  }
  return null;
}
function __dbg_countVisibleInGroup(list: PanelEntry[], group: number[]) {
  return group.reduce((n, id) => n + (list.find((e) => e.panel === id)?.visible ? 1 : 0), 0);
}

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
      debugLog.log('setChildVisibleIn:toggle', { target: id, from: n.visible, to: visible });
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
  debugLog.log('setVisibleForId:req', { id, visible });

  // Root first
  const idx = list.findIndex((e) => e.panel === id);
  if (idx >= 0) {
    if (list[idx].visible === visible) {
      debugLog.log('setVisibleForId:root-noop', { id, visible });
      return { list, changed: false };
    }
    const next = clone(list);
    debugLog.log('setVisibleForId:root-toggle', { id, from: next[idx].visible, to: visible });
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
      debugLog.log('setVisibleForId:nested-toggle', { id, rootIndex: i });
      break;
    }
  }
  if (!changed) {
    debugLog.log('setVisibleForId:not-found', { id });
  }
  return { list: changed ? next : list, changed };
}

/* ------------------------ migration (by node.name) ------------------------ */

type AnyNode = { panel: number; name?: string; visible?: boolean; children?: AnyNode[] };

function nameToEnum(name?: string): SP_COIN_DISPLAY | null {
  if (!name) return null;
  return (SP_COIN_DISPLAY as any)[name] ?? null;
}

/** Remap nodes whose `name` implies a different enum id than the persisted numeric `panel`. */
function remapIdsByName(nodes: AnyNode[] | undefined): { nodes?: AnyNode[]; changed: boolean } {
  if (!Array.isArray(nodes)) return { nodes, changed: false };

  let changed = false;

  const next = nodes.map((n) => {
    let innerChanged = false;

    // Fix children first
    let newChildren = n.children;
    if (Array.isArray(n.children) && n.children.length) {
      const res = remapIdsByName(n.children);
      if (res.changed) {
        newChildren = res.nodes;
        innerChanged = true;
      }
    }

    // Validate this node’s panel id against its `name`
    const desired = nameToEnum(n.name);
    if (typeof desired === 'number' && desired !== n.panel) {
      innerChanged = true;
      return { ...n, panel: desired, children: newChildren };
    }

    if (innerChanged) {
      changed = true;
      return { ...n, children: newChildren };
    }
    return n;
  });

  return { nodes: changed ? next : nodes, changed };
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

  // ⬇️ Run a one-time migration to remap numeric ids using each node's `name`
  useEffect(() => {
    if (!list.length) return;
    const { nodes, changed } = remapIdsByName(list as unknown as AnyNode[]);
    if (!changed) return;

    debugLog.log('migrate:remap-ids-by-name');
    setExchangeContext(
      (prev) => {
        const cur = (prev as any)?.settings?.mainPanelNode;
        if (!isPanelArray(cur)) return prev;
        return {
          ...prev,
          settings: {
            ...(prev as any).settings,
            mainPanelNode: nodes as PanelEntry[],
          },
        };
      },
      'usePanelTree:migrateIds'
    );
  }, [list, setExchangeContext]);

  // ⬇️ NEW: restrict the radio group to ids that actually exist as roots right now.
  // This keeps behavior resilient when defaults/storage evolve.
  const radioRootIds = useMemo<SP_COIN_DISPLAY[]>(
    () => list.map((e) => e.panel).filter((id) => MAIN_OVERLAY_GROUP.includes(id)),
    [list]
  );

  // Keep exactly one visible panel across the radio roots (fallback to TRADING)
  useEffect(() => {
    if (!list.length || !radioRootIds.length) return;

    const visCount = __dbg_countVisibleInGroup(list, radioRootIds);
    debugLog.log('reconcile:run', { rootVisibleCount: visCount });
    if (visCount === 1) return;

    setExchangeContext(
      (prev) => {
        const current = isPanelArray((prev as any)?.settings?.mainPanelNode)
          ? ((prev as any).settings.mainPanelNode as PanelEntry[])
          : [];
        if (!current.length) return prev;

        const next = current.map((e) =>
          radioRootIds.includes(e.panel)
            ? { ...e, visible: e.panel === TRADING }
            : e
        );

        debugLog.log('reconcile:normalize-to-trading');
        return { ...prev, settings: { ...(prev as any).settings, mainPanelNode: next } };
      },
      'usePanelTree:reconcile'
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length, radioRootIds.join('|')]);

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
      debugLog.log('open:req', {
        panel,
        path: __dbg_findPath(list as any, panel),
      });

      setExchangeContext(
        (prev) => {
          const current = isPanelArray((prev as any)?.settings?.mainPanelNode)
            ? ((prev as any).settings.mainPanelNode as PanelEntry[])
            : [];
          if (!current.length) return prev;

          // Radio overlays → exclusive selection among *present* radio roots
          if (radioRootIds.includes(panel)) {
            const alreadyActive = current.some(
              (e) => radioRootIds.includes(e.panel) && e.panel === panel && e.visible
            );
            if (alreadyActive) {
              debugLog.log('open:radio-already-active', { panel });
              return prev;
            }

            const next = current.map((e) =>
              radioRootIds.includes(e.panel)
                ? { ...e, visible: e.panel === panel }
                : e
            );

            debugLog.log('open:radio-set', { panel });
            return { ...prev, settings: { ...(prev as any).settings, mainPanelNode: next } };
          }

          // Non-radio panels → just set its visible = true anywhere in the tree
          const { list: next, changed } = setVisibleForId(current, panel, true);
          if (!changed) {
            debugLog.log('open:non-radio-noop', { panel });
            return prev;
          }

          // Detect parent flip (panel 0) which could collapse TRADING_STATION_PANEL
          const before0 = (__dbg_flatten(current as any).find((n) => n.panel === TRADING) || {} as any).visible;
          const after0  = (__dbg_flatten(next as any).find((n) => n.panel === TRADING) || {} as any).visible;
          if (before0 !== after0) {
            debugLog.log('open:parent-trading-changed', { panel, before0, after0 });
          }

          debugLog.log('open:non-radio-set', { panel });
          return { ...prev, settings: { ...(prev as any).settings, mainPanelNode: next } };
        },
        'usePanelTree:openPanel'
      );
    },
    [setExchangeContext, list, radioRootIds]
  );

  const closePanel = useCallback(
    (panel: SP_COIN_DISPLAY) => {
      debugLog.log('close:req', {
        panel,
        path: __dbg_findPath(list as any, panel),
      });

      // Radio overlays aren't closable
      if (radioRootIds.includes(panel)) {
        debugLog.log('close:not-closable-radio', { panel });
        return;
      }

      setExchangeContext(
        (prev) => {
          const current = isPanelArray((prev as any)?.settings?.mainPanelNode)
            ? ((prev as any).settings.mainPanelNode as PanelEntry[])
            : [];
          if (!current.length) return prev;

          const { list: next, changed } = setVisibleForId(current, panel, false);
          if (!changed) {
            debugLog.log('close:non-radio-noop', { panel });
            return prev;
          }

          const before0 = (__dbg_flatten(current as any).find((n) => n.panel === TRADING) || {} as any).visible;
          const after0  = (__dbg_flatten(next as any).find((n) => n.panel === TRADING) || {} as any).visible;
          if (before0 !== after0) {
            debugLog.log('close:parent-trading-changed', { panel, before0, after0 });
          }

          debugLog.log('close:non-radio-set', { panel });
          return { ...prev, settings: { ...(prev as any).settings, mainPanelNode: next } };
        },
        'usePanelTree:closePanel'
      );
    },
    [setExchangeContext, list, radioRootIds]
  );

  /* ------------------------------- derived -------------------------------- */

  const activeMainOverlay = useMemo<SP_COIN_DISPLAY>(() => {
    for (const id of radioRootIds) {
      if (list.find((e) => e.panel === id)?.visible) return id;
    }
    return TRADING;
  }, [list, radioRootIds]);

  const isTokenScrollVisible = useMemo(
    () =>
      isVisibleInTree(list, SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST) ||
      isVisibleInTree(list, SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST),
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
