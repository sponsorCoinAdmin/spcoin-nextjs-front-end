// File: @/lib/context/exchangeContext/hooks/usePanelTree.ts
'use client';

import { useCallback, useMemo, useRef } from 'react';
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

import {
  computeManageDescendantsSet,
  makeManagePredicates,
  type ManageScopeConfig,
} from '@/lib/context/exchangeContext/panelTree/panelTreeManageScope';

import {
  createPanelTreeCallbacks,
  type PanelTreeCallbacksDeps,
} from '@/lib/context/exchangeContext/panelTree/panelTreeCallbacks';

const KNOWN = new Set<number>(PANEL_DEFS.map((d) => d.id));

export function usePanelTree() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  /* ------------------------------- source -------------------------------- */

  const list = useMemo<PanelEntry[]>(() => {
    return flattenPanelTree(
      (exchangeContext as any)?.settings?.spCoinPanelTree,
      KNOWN,
    );
  }, [exchangeContext]);

  const visibilityMap = useMemo(() => toVisibilityMap(list), [list]);

  /* -------------------------- global overlays ----------------------------- */

  const overlays = useMemo(() => MAIN_OVERLAY_GROUP.slice(), []);

  const isGlobalOverlay = useCallback(
    (p: SP_COIN_DISPLAY) => overlays.includes(p),
    [overlays],
  );

  /* -------------------------- manage scope -------------------------------- */

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

  /* ------------------------------ helpers --------------------------------- */

  const withName = useCallback(
    (e: PanelEntry) => ({ ...e, name: e.name ?? panelName(e.panel) }),
    [],
  );

  const sponsorParentRef = useRef<SP_COIN_DISPLAY | null>(null);
  const manageScopedHistoryRef = useRef<SP_COIN_DISPLAY[]>([]);

  const getActiveManageScoped = useCallback(
    (flat: PanelEntry[]) => {
      const map = toVisibilityMap(flat);
      for (const id of manageScoped) {
        if (map[Number(id)]) return id;
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

  /* -------------------------- panelStore sync ----------------------------- */

  const publishVisibility = useCallback(
    (nextMap: Record<number, boolean>) => {
      for (const [idStr, v] of Object.entries(nextMap)) {
        panelStore.setVisible(Number(idStr) as SP_COIN_DISPLAY, !!v);
      }
    },
    [],
  );

  useMemo(() => {
    publishVisibility(visibilityMap);
  }, [visibilityMap, publishVisibility]);

  /* ------------------------------ queries -------------------------------- */

  const isVisible = useCallback(
    (panel: SP_COIN_DISPLAY) => panelStore.isVisible(panel),
    [],
  );

  const getPanelChildren = useCallback(
    (panel: SP_COIN_DISPLAY): SP_COIN_DISPLAY[] =>
      (((CHILDREN as any)?.[panel] as unknown) as SP_COIN_DISPLAY[]) ?? [],
    [],
  );

  /* ------------------------------ actions -------------------------------- */

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

      diffAndPublish: (_prev, next) => {
        publishVisibility(next);
      },
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
      publishVisibility,
      setExchangeContext,
    ],
  );

  const { openPanel, closePanel, closeTopPanel } = useMemo(
    () => createPanelTreeCallbacks(callbacksDeps),
    [callbacksDeps],
  );

  /* ------------------------------ derived -------------------------------- */

  const activeMainOverlay = useMemo<SP_COIN_DISPLAY | null>(() => {
    for (const id of overlays) if (visibilityMap[id]) return id;
    return null;
  }, [visibilityMap, overlays]);

  const isTokenScrollVisible = useMemo(
    () =>
      visibilityMap[SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL] ||
      visibilityMap[SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL],
    [visibilityMap],
  );

  /* ------------------------------ debug ---------------------------------- */

  const dumpNavStack = useCallback((): void => {
    // Start at the active overlay if one exists; otherwise pick the first visible panel we can find.
    const start = SP_COIN_DISPLAY.MAIN_TRADING_PANEL;

    if (!start) {
      console.warn('[PanelTree] dumpNavStack(): no visible start panel found.');
      return;
    }

    const seen = new Set<number>();
    const stack: SP_COIN_DISPLAY[] = [];

    let current: SP_COIN_DISPLAY | null = start;

    console.groupCollapsed(
      `[PanelTree] Display stack from "${panelName(Number(start) as any)}" (${Number(start)})`,
    );

    while (current != null) {
      const curId = Number(current);

      if (seen.has(curId)) {
        console.error(
          `[PanelTree] cycle detected at "${panelName(curId as any)}" (${curId}). Stopping traversal.`,
        );
        break;
      }
      seen.add(curId);
      stack.push(current);

      const children: SP_COIN_DISPLAY[] = getPanelChildren(current);
      const visibleChildren: SP_COIN_DISPLAY[] = children.filter(
        (c: SP_COIN_DISPLAY) => visibilityMap[Number(c)],
      );

      // Our "current stack for display" rule:
      // follow the FIRST visible child in children[] order (if any).
      const selectedChild: SP_COIN_DISPLAY | null =
        visibleChildren.length > 0 ? visibleChildren[0] : null;

      console.log({
        node: panelName(curId as any),
        id: curId,
        isVisible: !!visibilityMap[curId],
        children: children.map((c: SP_COIN_DISPLAY) => ({
          name: panelName(Number(c) as any),
          id: Number(c),
          visible: !!visibilityMap[Number(c)],
        })),
        selectedChild: selectedChild
          ? {
              name: panelName(Number(selectedChild) as any),
              id: Number(selectedChild),
            }
          : null,
      });

      if (!selectedChild) break;
      current = selectedChild;
    }

    console.log(
      '[PanelTree] displayStack =',
      stack.map((p: SP_COIN_DISPLAY) => ({
        name: panelName(Number(p) as any),
        id: Number(p),
      })),
    );

    console.groupEnd();
  }, [activeMainOverlay, getPanelChildren, list, visibilityMap]);

  return {
    activeMainOverlay,
    isVisible,
    isTokenScrollVisible,
    getPanelChildren,
    openPanel,
    closePanel,
    closeTopPanel,
    dumpNavStack,
  };
}
