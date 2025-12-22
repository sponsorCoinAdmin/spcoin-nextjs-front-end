// File: @/lib/context/exchangeContext/hooks/usePanelTree.ts
'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import {
  MAIN_OVERLAY_GROUP,
  PANEL_DEFS,
  CHILDREN,
} from '@/lib/structure/exchangeContext/registry/panelRegistry';
import { panelStore } from '@/lib/context/exchangeContext/panelStore';

import {
  type PanelEntry,
  flattenPanelTree,
  toVisibilityMap,
  panelName,
} from '@/lib/context/exchangeContext/panelTree/panelTreePersistence';

import { schedule } from '@/lib/context/exchangeContext/panelTree/panelTreeDebug';

import {
  computeManageDescendantsSet,
  makeManagePredicates,
  closeManageBranch,
  type ManageScopeConfig,
} from '@/lib/context/exchangeContext/panelTree/panelTreeManageScope';

import {
  seedNavStackFromVisibility,
  dumpNavStack,
} from '@/lib/context/exchangeContext/panelTree/panelNavStack';

import {
  createActivatePanel,
  type PanelTreeMethodsDeps,
} from '@/lib/context/exchangeContext/panelTree/panelTreeMethods';

import {
  createPanelTreeCallbacks,
  type PanelTreeCallbacksDeps,
} from '@/lib/context/exchangeContext/panelTree/panelTreeCallbacks';

const KNOWN = new Set<number>(PANEL_DEFS.map((d) => d.id));

const DEBUG_TREE =
  process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_TREE === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_STACK === 'true';

const nameOf = (id: SP_COIN_DISPLAY) => SP_COIN_DISPLAY[id] ?? String(id);

function diffAndPublish(
  prevMap: Record<number, boolean>,
  nextMap: Record<number, boolean>,
) {
  const ids = new Set<number>([
    ...Object.keys(prevMap),
    ...Object.keys(nextMap),
  ].map(Number));

  ids.forEach((idNum) => {
    const id = idNum as SP_COIN_DISPLAY;
    const prev = !!prevMap[idNum];
    const next = !!nextMap[idNum];
    if (prev !== next) panelStore.setVisible(id, next);
  });
}

function buildParentsOf(children: Record<string, unknown>) {
  const m = new Map<number, number[]>();
  for (const [parentKey, kids] of Object.entries(children)) {
    const parentId = Number(parentKey);
    if (!Array.isArray(kids)) continue;
    for (const k of kids) {
      const childId = Number(k);
      const arr = m.get(childId) ?? [];
      if (!arr.includes(parentId)) arr.push(parentId);
      m.set(childId, arr);
    }
  }
  return m;
}

export function usePanelTree() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const list = useMemo<PanelEntry[]>(
    () =>
      flattenPanelTree(
        (exchangeContext as any)?.settings?.spCoinPanelTree,
        KNOWN,
      ),
    [exchangeContext],
  );

  const map = useMemo(() => toVisibilityMap(list), [list]);

  // Global overlays (top-level radio)
  const overlays = useMemo(() => MAIN_OVERLAY_GROUP.slice(), []);

  // ───────────────────────── Manage scope config ─────────────────────────

  const manageContainer = SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS;

  const manageScoped = useMemo<SP_COIN_DISPLAY[]>(() => {
    const kids = (CHILDREN as any)?.[manageContainer] as
      | SP_COIN_DISPLAY[]
      | undefined;
    return Array.isArray(kids) ? kids.slice() : [];
  }, [manageContainer]);

  const manageScopedSet = useMemo(
    () => new Set<number>(manageScoped as unknown as number[]),
    [manageScoped],
  );

  const manageCfg: ManageScopeConfig = useMemo(
    () => ({
      known: KNOWN,
      children: CHILDREN as any,
      manageContainer,
      manageScoped,
      defaultManageChild: SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
      manageSponsorPanel: SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL,
      sponsorAllowedParents: new Set<number>([
        SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL,
        SP_COIN_DISPLAY.CLAIM_SPONSOR_REWARDS_LIST_PANEL,
      ]),
    }),
    [manageContainer, manageScoped],
  );

  const manageDescendantsSet = useMemo(
    () => computeManageDescendantsSet(manageCfg),
    [manageCfg],
  );

  const { isManageRadioChild, isManageAnyChild } = useMemo(
    () => makeManagePredicates(manageCfg, manageScopedSet, manageDescendantsSet),
    [manageCfg, manageScopedSet, manageDescendantsSet],
  );

  const isGlobalOverlay = useCallback(
    (p: SP_COIN_DISPLAY) => overlays.includes(p),
    [overlays],
  );

  const withName = useCallback(
    (e: PanelEntry) => ({ ...e, name: e.name ?? panelName(e.panel) }),
    [],
  );

  // ───────────────────────── Seed nav stack ─────────────────────────

  useEffect(() => {
    seedNavStackFromVisibility({
      map,
      overlays,
      manageContainer: manageCfg.manageContainer,
      manageScoped,
      manageSponsorPanel: manageCfg.manageSponsorPanel,
    });

    if (DEBUG_TREE) {
      // eslint-disable-next-line no-console
      console.log('[usePanelTree] seedNavStackFromVisibility', {
        activeOverlay: overlays.find((id) => !!map[Number(id)])
          ? nameOf(overlays.find((id) => !!map[Number(id)]) as SP_COIN_DISPLAY)
          : null,
      });
    }
  }, [
    map,
    overlays,
    manageCfg.manageContainer,
    manageCfg.manageSponsorPanel,
    manageScoped,
  ]);

  // ───────────────────────── Parents lookup (multi-parent support) ─────────────────────────

  const parentsOf = useMemo(() => buildParentsOf(CHILDREN as any), []);

  const pickParentForChild = useCallback(
    (
      child: SP_COIN_DISPLAY,
      visMap: Record<number, boolean>,
    ): SP_COIN_DISPLAY | null => {
      const parents = parentsOf.get(Number(child)) ?? [];
      if (!parents.length) return null;

      for (const p of parents) {
        if (visMap[p]) return p as SP_COIN_DISPLAY;
      }
      return parents[0] as SP_COIN_DISPLAY;
    },
    [parentsOf],
  );

  // sponsor parent tracking
  const sponsorParentRef = useRef<SP_COIN_DISPLAY | null>(null);

  // manage scoped history
  const manageScopedHistoryRef = useRef<SP_COIN_DISPLAY[]>([]);

  const getActiveManageScoped = useCallback(
    (flat: PanelEntry[]) => {
      const m = toVisibilityMap(flat);
      for (const id of manageScoped) {
        if (m[Number(id)]) return id;
      }
      return null;
    },
    [manageScoped],
  );

  const pushManageScopedHistory = useCallback(
    (prevScoped: SP_COIN_DISPLAY | null, nextScoped: SP_COIN_DISPLAY) => {
      if (!prevScoped) return;
      if (Number(prevScoped) === Number(nextScoped)) return;
      const st = manageScopedHistoryRef.current;
      if (st.length && Number(st[st.length - 1]) === Number(prevScoped)) return;
      st.push(prevScoped);
    },
    [],
  );

  /* ------------------ keep panelStore in sync with computed map ------------------ */

  const prevMapRef = useRef<Record<number, boolean> | null>(null);
  useEffect(() => {
    const prev = prevMapRef.current ?? {};
    diffAndPublish(prev, map);
    prevMapRef.current = map;
  }, [map]);

  /* ------------------ enforce single global overlay visible ------------------ */

  useEffect(() => {
    const visible = overlays.filter((id) => !!map[id]);
    if (visible.length <= 1) return;

    const keep = visible[0] as SP_COIN_DISPLAY;

    if (DEBUG_TREE) {
      // eslint-disable-next-line no-console
      console.warn('[usePanelTree] multiple global overlays visible; repairing', {
        keep: nameOf(keep),
        visible: visible.map((id) => nameOf(id as SP_COIN_DISPLAY)),
      });
    }

    schedule(() => {
      setExchangeContext((prev) => {
        const flatPrev = flattenPanelTree(
          (prev as any)?.settings?.spCoinPanelTree,
          KNOWN,
        );

        let next = flatPrev.map((e) =>
          overlays.includes(e.panel)
            ? { ...withName(e), visible: e.panel === keep }
            : e,
        );

        if (keep !== manageCfg.manageContainer) {
          manageScopedHistoryRef.current = [];
          next = closeManageBranch(next, manageCfg, isManageAnyChild, withName);
        }

        diffAndPublish(toVisibilityMap(flatPrev), toVisibilityMap(next));
        return {
          ...prev,
          settings: {
            ...(prev as any)?.settings,
            spCoinPanelTree: next,
          },
        } as any;
      });
    });
  }, [
    map,
    overlays,
    setExchangeContext,
    manageCfg,
    isManageAnyChild,
    withName,
  ]);

  /* ------------------------------- queries ------------------------------- */

  const isVisible = useCallback((panel: SP_COIN_DISPLAY) => {
    return panelStore.isVisible(panel);
  }, []);

  const getPanelChildren = useCallback(
    (invoker: SP_COIN_DISPLAY) =>
      ((CHILDREN as any)?.[invoker] as SP_COIN_DISPLAY[] | undefined) ?? [],
    [],
  );

  /* -------------------- activation (stack restore) -------------------- */

  const methodsDeps: PanelTreeMethodsDeps = useMemo(
    () => ({
      overlays,
      manageCfg,
      manageScopedSet,
      isGlobalOverlay,
      isManageRadioChild,
      parentsOf,
      pickParentForChild,
      withName,
      sponsorParentRef,
    }),
    [
      overlays,
      manageCfg,
      manageScopedSet,
      isGlobalOverlay,
      isManageRadioChild,
      parentsOf,
      pickParentForChild,
      withName,
    ],
  );

  const activatePanel = useMemo(() => createActivatePanel(methodsDeps), [methodsDeps]);

  /* ------------------------------- actions ------------------------------- */

  // ✅ FIX: Match PanelTreeCallbacksDeps exactly
  const callbacksDeps: PanelTreeCallbacksDeps = useMemo(
    () => ({
      known: KNOWN,
      overlays,

      manageCfg,
      manageScoped,
      manageScopedSet,

      isGlobalOverlay,
      isManageRadioChild,
      isManageAnyChild,

      withName,

      sponsorParentRef,
      manageScopedHistoryRef,

      getActiveManageScoped,
      pushManageScopedHistory,

      activatePanel,
      diffAndPublish,

      setExchangeContext,
    }),
    [
      overlays,
      manageCfg,
      manageScoped,
      manageScopedSet,
      isGlobalOverlay,
      isManageRadioChild,
      isManageAnyChild,
      withName,
      getActiveManageScoped,
      pushManageScopedHistory,
      activatePanel,
      setExchangeContext,
    ],
  );

  const { openPanel, closePanel } = useMemo(
    () => createPanelTreeCallbacks(callbacksDeps),
    [callbacksDeps],
  );

  /* ------------------------------- derived -------------------------------- */

  const activeMainOverlay = useMemo<SP_COIN_DISPLAY | null>(() => {
    for (const id of overlays) if (map[id]) return id;
    return null;
  }, [map, overlays]);

  const isTokenScrollVisible = useMemo(
    () =>
      map[SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL] ||
      map[SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL],
    [map],
  );

  const dumpStack = useCallback(
    (tag?: string) => dumpNavStack({ tag, map, overlays, known: KNOWN }),
    [map, overlays],
  );

  return {
    activeMainOverlay,
    isVisible,
    isTokenScrollVisible,
    getPanelChildren,
    openPanel,
    closePanel,

    // Debug
    dumpNavStack: dumpStack,
  };
}
