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

/* ───────────────────────────── BranchPath (NAV ONLY) ─────────────────────────────
 * This is intentionally NOT derived from visibility/tree traversal.
 * It is a runtime navigation trace (open/close), and MUST NOT affect radio logic.
 */
const BRANCH_PATH: SP_COIN_DISPLAY[] = [];

const DEBUG_BRANCH =
  process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_TREE === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_OVERLAY_CLOSE === 'true';

const snapshotBranch = (): SP_COIN_DISPLAY[] => BRANCH_PATH.slice();

const branchPush = (panel: SP_COIN_DISPLAY): void => {
  const top: SP_COIN_DISPLAY | null = BRANCH_PATH.length
    ? (BRANCH_PATH[BRANCH_PATH.length - 1] as SP_COIN_DISPLAY)
    : null;

  if (top !== null && Number(top) === Number(panel)) return;
  BRANCH_PATH.push(panel);
};

const branchEnsureSeeded = (seed: SP_COIN_DISPLAY[]): void => {
  if (BRANCH_PATH.length > 0) return;
  if (!seed.length) return;
  BRANCH_PATH.length = 0;
  for (const p of seed) BRANCH_PATH.push(p);
};

const branchOnClose = (panel: SP_COIN_DISPLAY): void => {
  if (!BRANCH_PATH.length) return;

  const top: SP_COIN_DISPLAY = BRANCH_PATH[BRANCH_PATH.length - 1] as SP_COIN_DISPLAY;
  if (Number(top) === Number(panel)) {
    BRANCH_PATH.pop();
    return;
  }

  // If closing something in the middle, truncate from its last occurrence.
  for (let i = BRANCH_PATH.length - 1; i >= 0; i--) {
    if (Number(BRANCH_PATH[i]) === Number(panel)) {
      BRANCH_PATH.length = i; // drop the closed panel and anything after it
      return;
    }
  }
};

const logBranch = (tag?: string) => {
  if (!DEBUG_BRANCH) return;
  // eslint-disable-next-line no-console
  console.log(`[PanelTree] branchStack${tag ? ` (${tag})` : ''} =`, [
    ...BRANCH_PATH.map((p) => ({
      name: panelName(Number(p) as any),
      id: Number(p),
    })),
  ]);
};

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

  const publishVisibility = useCallback((nextMap: Record<number, boolean>) => {
    for (const [idStr, v] of Object.entries(nextMap)) {
      panelStore.setVisible(Number(idStr) as SP_COIN_DISPLAY, !!v);
    }
  }, []);

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

  const base = useMemo(() => createPanelTreeCallbacks(callbacksDeps), [callbacksDeps]);

  /**
   * ✅ Wrapped actions:
   * - Update NAV-only branchStack
   * - Then call existing behavior unchanged
   *
   * This guarantees branchStackchanges do NOT affect radios/visibility.
   */
  const openPanel = useCallback(
    (panel: SP_COIN_DISPLAY, invoker?: string, parent?: SP_COIN_DISPLAY) => {
      // Seed branch once from the current DISPLAY traversal (only for initial state).
      // After that, branch is driven by open/close calls only.
      if (BRANCH_PATH.length === 0) {
        const seed = ((): SP_COIN_DISPLAY[] => {
          const start: SP_COIN_DISPLAY = SP_COIN_DISPLAY.MAIN_TRADING_PANEL;
          const seen = new Set<number>();
          const path: SP_COIN_DISPLAY[] = [];
          let current: SP_COIN_DISPLAY | null = start;

          while (current != null) {
            const curId = Number(current);
            if (seen.has(curId)) break;
            seen.add(curId);

            path.push(current);

            const children: SP_COIN_DISPLAY[] = getPanelChildren(current);
            let selectedChild: SP_COIN_DISPLAY | null = null;

            for (const c of children) {
              if (!!visibilityMap[Number(c)]) {
                selectedChild = c;
                break;
              }
            }

            if (!selectedChild) break;
            current = selectedChild;
          }

          return path;
        })();

        branchEnsureSeeded(seed);
      }

      // NAV-only: push the thing being opened.
      branchPush(panel);

      // Real behavior unchanged.
      base.openPanel(panel, invoker, parent);

      if (DEBUG_BRANCH) logBranch(`open:${panelName(Number(panel) as any)}`);
    },
    [base, getPanelChildren, visibilityMap],
  );

  /**
   * ✅ Wrapped closePanel:
   * BranchPath traversal rule:
   * - If caller attempts to close manageContainer while a deeper leaf exists,
   *   treat it as "close leaf" (branch traversal).
   * - Otherwise close exactly what caller asked.
   */
  const closePanel = useCallback(
    (panel: SP_COIN_DISPLAY, invoker?: string, arg?: unknown) => {
      const nav = snapshotBranch();
      const leaf =
        nav.length > 0 ? (nav[nav.length - 1] as SP_COIN_DISPLAY) : null;

      const target =
        leaf &&
        Number(panel) === Number(manageContainer) &&
        Number(leaf) !== Number(panel)
          ? leaf
          : panel;

      // NAV-only: update branch to support "close -> revert".
      branchOnClose(target);

      // Real behavior unchanged (aside from redirecting manageContainer close -> leaf).
      base.closePanel(target, invoker, arg);

      if (DEBUG_BRANCH) logBranch(`close:${panelName(Number(target) as any)}`);
    },
    [base, manageContainer],
  );

  /**
   * ✅ FIXED closeTopPanel:
   * Previously, base.closeTopPanel() closes MANAGE_SPONSORSHIPS (container),
   * which truncates branchStackby 2 levels (drops container + leaf).
   *
   * New behavior:
   * - Determine leaf from NAV branchStack
   * - Close THAT leaf (one level)
   * - Let base callbacks handle visibility/radio logic
   */
  const closeTopPanel = useCallback(
    (invoker?: string) => {
      const nav = snapshotBranch();
      const leaf =
        nav.length > 0 ? (nav[nav.length - 1] as SP_COIN_DISPLAY) : null;

      if (!leaf) return;

      // NAV-only: pop exactly ONE level (the leaf)
      branchOnClose(leaf);

      // Real behavior: close the leaf, not MANAGE_SPONSORSHIPS container
      base.closePanel(leaf, invoker ?? 'HeaderX');

      if (DEBUG_BRANCH)
        logBranch(`closeTop->leaf:${panelName(Number(leaf) as any)}`);
    },
    [base],
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

  /**
   * Dumps:
   * 1) DISPLAY traversal (visibility-based) for inspecting what the UI currently shows
   * 2) NAV branchStack(open/close based) for your navigation/revert logic
   */
  const dumpNavStack = useCallback(
    (tag?: string): void => {
      const start: SP_COIN_DISPLAY = SP_COIN_DISPLAY.MAIN_TRADING_PANEL;

      const seen = new Set<number>();
      const displayStack: SP_COIN_DISPLAY[] = [];
      let current: SP_COIN_DISPLAY | null = start;

      const title = `[PanelTree] Display branch${
        tag ? ` (${tag})` : ''
      } from "${panelName(Number(start) as any)}" (${Number(start)})`;

      console.groupCollapsed(title);

      while (current != null) {
        const curId: number = Number(current);

        if (seen.has(curId)) {
          console.error(
            `[PanelTree] cycle detected at "${panelName(curId as any)}" (${curId}). Stopping traversal.`,
          );
          break;
        }

        seen.add(curId);
        displayStack.push(current);

        const children: SP_COIN_DISPLAY[] = getPanelChildren(current);

        const visibleChildren: SP_COIN_DISPLAY[] = children.filter(
          (c: SP_COIN_DISPLAY) => !!visibilityMap[Number(c)],
        );

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
        '[PanelTree] displayBranch =',
        displayStack.map((p: SP_COIN_DISPLAY) => ({
          name: panelName(Number(p) as any),
          id: Number(p),
        })),
      );

      const nav = snapshotBranch();
      console.log(
        '[PanelTree] branchStack=',
        nav.map((p: SP_COIN_DISPLAY) => ({
          name: panelName(Number(p) as any),
          id: Number(p),
        })),
      );

      console.groupEnd();
    },
    [getPanelChildren, visibilityMap],
  );

  return {
    activeMainOverlay,
    isVisible,
    isTokenScrollVisible,
    getPanelChildren,

    // ✅ wrapped, behavior unchanged, only branchStacktracking added
    openPanel,
    closePanel,
    closeTopPanel,

    dumpNavStack,
  };
}
