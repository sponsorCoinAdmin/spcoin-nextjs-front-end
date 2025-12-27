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

/* ───────────────────────────── BranchStack (NAV ONLY) ───────────────────────────── */
const BRANCH_STACK: SP_COIN_DISPLAY[] = [];

const DEBUG_BRANCH =
  process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_TREE === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_OVERLAY_CLOSE === 'true';

const DEBUG_CLOSE_INVARIANTS =
  process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_CLOSE_INVARIANTS === 'true';

const DEBUG_CLOSE_INVARIANTS_VERBOSE =
  process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_CLOSE_INVARIANTS_VERBOSE === 'true';

const DEBUG_CLOSE_INVARIANTS_RENDER =
  process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_CLOSE_INVARIANTS_RENDER === 'true';

/**
 * ✅ NEW: log when we infer a missing parent for manage scoped opens
 */
const DEBUG_OPEN_INFER_PARENT =
  process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_OPEN_INFER_PARENT === 'true';

const snapshotBranch = (): SP_COIN_DISPLAY[] => BRANCH_STACK.slice();

const branchEnsureSeeded = (seed: SP_COIN_DISPLAY[] | number[]): void => {
  if (BRANCH_STACK.length > 0) return;
  if (!seed.length) return;
  BRANCH_STACK.length = 0;
  for (const p of seed as any) BRANCH_STACK.push(p as any);
};

const branchPush = (panel: SP_COIN_DISPLAY): void => {
  const idx = BRANCH_STACK.lastIndexOf(panel);
  if (idx >= 0) {
    BRANCH_STACK.length = idx + 1;
    return;
  }
  BRANCH_STACK.push(panel);
};

const branchPop = (panel: SP_COIN_DISPLAY): void => {
  if (!BRANCH_STACK.length) return;

  const top = BRANCH_STACK[BRANCH_STACK.length - 1] as SP_COIN_DISPLAY;
  if (Number(top) === Number(panel)) {
    BRANCH_STACK.pop();
    return;
  }

  const idx = BRANCH_STACK.lastIndexOf(panel);
  if (idx >= 0) {
    BRANCH_STACK.length = idx;
  }
};

const branchNodeShow = (panel: SP_COIN_DISPLAY): void => branchPush(panel);
const branchNodeHide = (panel: SP_COIN_DISPLAY): void => branchPop(panel);

const nameOf = (p: SP_COIN_DISPLAY | number | null | undefined) =>
  p == null ? null : panelName(Number(p) as any);

const toNamedStack = (arr: SP_COIN_DISPLAY[]) =>
  arr.map((p) => ({ id: Number(p), name: nameOf(p) }));

const logBranch = (tag?: string) => {
  if (!DEBUG_BRANCH) return;
  // eslint-disable-next-line no-console
  console.log(`[PanelTree] branchStack${tag ? ` (${tag})` : ''} =`, [
    ...BRANCH_STACK.map((p) => ({
      name: panelName(Number(p) as any),
      id: Number(p),
    })),
  ]);
};

type LastAction =
  | {
      kind: 'openPanel';
      panel: SP_COIN_DISPLAY;
      invoker?: string;
      parent?: SP_COIN_DISPLAY;
      navBefore: SP_COIN_DISPLAY[];
      ts: number;
    }
  | {
      kind: 'closePanel';
      requested: SP_COIN_DISPLAY;
      target: SP_COIN_DISPLAY;
      invoker?: string;
      navBefore: SP_COIN_DISPLAY[];
      ts: number;
    }
  | {
      kind: 'closeTopPanel';
      leaf: SP_COIN_DISPLAY;
      invoker?: string;
      navBefore: SP_COIN_DISPLAY[];
      ts: number;
    }
  | null;

const diffVisibility = (
  prev: Record<number, boolean> | null | undefined,
  next: Record<number, boolean>,
) => {
  const changes: Array<{ id: number; name: string; from: boolean; to: boolean }> =
    [];
  const allIds = new Set<number>([
    ...Object.keys(prev ?? {}).map(Number),
    ...Object.keys(next ?? {}).map(Number),
  ]);

  for (const id of allIds) {
    const a = !!(prev ?? {})[id];
    const b = !!next[id];
    if (a !== b) {
      changes.push({ id, name: panelName(id as any), from: a, to: b });
    }
  }
  return changes;
};

/* ───────────────────────────── Stack ↔ DisplayBranch helpers ───────────────────────────── */

const normalizeStack = (arr: Array<number | SP_COIN_DISPLAY>) =>
  arr
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x)) as number[];

const sameStack = (a: Array<number>, b: Array<number>) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (Number(a[i]) !== Number(b[i])) return false;
  return true;
};

const computeDisplayBranch = (
  start: SP_COIN_DISPLAY,
  getChildren: (p: SP_COIN_DISPLAY) => SP_COIN_DISPLAY[],
  visible: (p: SP_COIN_DISPLAY) => boolean,
): SP_COIN_DISPLAY[] => {
  const seen = new Set<number>();
  const path: SP_COIN_DISPLAY[] = [];
  let current: SP_COIN_DISPLAY | null = start;

  while (current != null) {
    const id = Number(current);
    if (seen.has(id)) break;
    seen.add(id);

    path.push(current);

    const kids = getChildren(current);
    let selected: SP_COIN_DISPLAY | null = null;
    for (const k of kids) {
      if (visible(k)) {
        selected = k;
        break;
      }
    }
    if (!selected) break;
    current = selected;
  }

  return path;
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

  /* ------------------------------ display branch -------------------------- */

  const displayBranch = useMemo(() => {
    const start = SP_COIN_DISPLAY.MAIN_TRADING_PANEL;
    return computeDisplayBranch(
      start,
      getPanelChildren,
      (p) => !!visibilityMap[Number(p)],
    );
  }, [getPanelChildren, visibilityMap]);

  /* ------------------------------ persistence ----------------------------- */

  const persistPanelTypeIdStack = useCallback(
    (next: SP_COIN_DISPLAY[] | number[]) => {
      const nextIds = normalizeStack(next as any);

      const currentIds = normalizeStack(
        ((exchangeContext as any)?.settings?.panelTypeIdStack ?? []) as any,
      );

      if (sameStack(currentIds, nextIds)) return;

      // Object-style update (safe even if setter is not useState-setter)
      setExchangeContext({
        ...(exchangeContext as any),
        settings: {
          ...((exchangeContext as any)?.settings ?? {}),
          panelTypeIdStack: nextIds,
        },
      });
    },
    [exchangeContext, setExchangeContext],
  );

  // Hydration + invariant enforcement:
  // - Seed runtime BRANCH_STACK from persisted stack or derived displayBranch.
  // - If persisted stack missing, derive from displayBranch and persist immediately.
  // - Keep persisted stack aligned to displayBranch; keep BRANCH_STACK aligned too.
  const didHydrateNavRef = useRef(false);

  useEffect(() => {
    const settingsStackRaw = (exchangeContext as any)?.settings?.panelTypeIdStack;

    const hasPersistedStack =
      Array.isArray(settingsStackRaw) && settingsStackRaw.length > 0;

    const persistedStack = hasPersistedStack
      ? normalizeStack(settingsStackRaw as any)
      : [];

    const derivedStack = normalizeStack(displayBranch as any);

    // 1) Seed runtime stack if empty
    if (BRANCH_STACK.length === 0) {
      if (persistedStack.length > 0) {
        branchEnsureSeeded(persistedStack);
      } else if (derivedStack.length > 0) {
        branchEnsureSeeded(derivedStack);
      }
    }

    // 2) Missing persisted stack: derive + persist immediately (mandatory field)
    if (!hasPersistedStack && derivedStack.length > 0) {
      persistPanelTypeIdStack(displayBranch);
      didHydrateNavRef.current = true;
      return;
    }

    // 3) Persisted stack diverges from visible branch: overwrite with derived
    if (
      hasPersistedStack &&
      derivedStack.length > 0 &&
      !sameStack(persistedStack, derivedStack)
    ) {
      persistPanelTypeIdStack(displayBranch);
    }

    // 4) Runtime invariant: BRANCH_STACK matches visible branch
    if (derivedStack.length > 0) {
      const navNow = normalizeStack(snapshotBranch() as any);
      if (!sameStack(navNow, derivedStack)) {
        BRANCH_STACK.length = 0;
        for (const id of derivedStack) BRANCH_STACK.push(id as any);
      }
    }

    didHydrateNavRef.current = true;
  }, [exchangeContext, displayBranch, persistPanelTypeIdStack]);

  /* ------------------------------ debug state ----------------------------- */

  const lastActionRef = useRef<LastAction>(null);
  const lastVisRef = useRef<Record<number, boolean> | null>(null);

  const debugGroup = (title: string) => {
    if (!DEBUG_CLOSE_INVARIANTS) return;
    if (DEBUG_CLOSE_INVARIANTS_VERBOSE) {
      // eslint-disable-next-line no-console
      console.log(title);
      return;
    }
    // eslint-disable-next-line no-console
    console.groupCollapsed(title);
  };

  const debugGroupEnd = () => {
    if (!DEBUG_CLOSE_INVARIANTS) return;
    if (DEBUG_CLOSE_INVARIANTS_VERBOSE) return;
    // eslint-disable-next-line no-console
    console.groupEnd();
  };

  const visibleManageKidsFromStore = () =>
    manageScoped
      .filter((p) => panelStore.isVisible(p))
      .map((p) => ({ id: Number(p), name: nameOf(p) }));

  const visibleManageKidsFromMap = () =>
    manageScoped
      .filter((p) => !!visibilityMap[Number(p)])
      .map((p) => ({ id: Number(p), name: nameOf(p) }));

  /* ------------------------------ render sync tracer ---------------------- */

  useEffect(() => {
    if (!DEBUG_CLOSE_INVARIANTS_RENDER) return;

    const action = lastActionRef.current;
    const claim = SP_COIN_DISPLAY.CLAIM_SPONSOR_REWARDS_LIST_PANEL;

    // eslint-disable-next-line no-console
    console.log('[PanelTree][render-sync]', {
      lastAction: action
        ? {
            kind: action.kind,
            ts: action.ts,
            ageMs: Date.now() - action.ts,
            ...(action.kind === 'openPanel'
              ? {
                  panel: { id: Number(action.panel), name: nameOf(action.panel) },
                  invoker: action.invoker,
                  parent:
                    action.parent != null
                      ? { id: Number(action.parent), name: nameOf(action.parent) }
                      : null,
                }
              : action.kind === 'closePanel'
                ? {
                    requested: {
                      id: Number(action.requested),
                      name: nameOf(action.requested),
                    },
                    target: { id: Number(action.target), name: nameOf(action.target) },
                    invoker: action.invoker,
                  }
                : {
                    leaf: { id: Number(action.leaf), name: nameOf(action.leaf) },
                    invoker: action.invoker,
                  }),
          }
        : null,

      claimVisible_map: !!visibilityMap[Number(claim)],
      claimVisible_store: panelStore.isVisible(claim),

      manageVisible_map: visibleManageKidsFromMap(),
      manageVisible_store: visibleManageKidsFromStore(),

      displayBranchNow: toNamedStack(displayBranch),
      branchStackNow: toNamedStack(snapshotBranch()),
    });
  }, [visibilityMap, manageScoped, displayBranch]);

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

      diffAndPublish: (prev, next) => {
        publishVisibility(next);

        if (!DEBUG_CLOSE_INVARIANTS) {
          lastVisRef.current = next;
          return;
        }

        const changes = diffVisibility(prev ?? lastVisRef.current, next);
        const action = lastActionRef.current;
        const ageMs = action ? Date.now() - action.ts : null;

        debugGroup('[PanelTree][close-invariants] publishVisibility');
        // eslint-disable-next-line no-console
        console.log('lastAction', action ? { ...action, ageMs } : null);
        // eslint-disable-next-line no-console
        console.log('visibilityChanges', changes.length ? changes : '(none)');
        debugGroupEnd();

        lastVisRef.current = next;
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

  const base = useMemo(
    () => createPanelTreeCallbacks(callbacksDeps),
    [callbacksDeps],
  );

  /**
   * ✅ openPanel:
   * - branch stack is first-class (persisted)
   * - manage-scoped opens infer parent when missing
   */
  const openPanel = useCallback(
    (panel: SP_COIN_DISPLAY, invoker?: string, parent?: SP_COIN_DISPLAY) => {
      const inferredParent =
        parent == null && manageScopedSet.has(Number(panel))
          ? manageContainer
          : parent;

      if (DEBUG_OPEN_INFER_PARENT && parent == null && inferredParent != null) {
        // eslint-disable-next-line no-console
        console.log('[PanelTree][open-infer-parent]', {
          panel: { id: Number(panel), name: nameOf(panel) },
          inferredParent: { id: Number(inferredParent), name: nameOf(inferredParent) },
          invoker,
        });
      }

      const navBefore = snapshotBranch();
      lastActionRef.current = {
        kind: 'openPanel',
        panel,
        invoker,
        parent: inferredParent,
        navBefore,
        ts: Date.now(),
      };

      if (DEBUG_CLOSE_INVARIANTS) {
        // eslint-disable-next-line no-console
        console.log('[PanelTree][close-invariants] openPanel()', {
          panel: { id: Number(panel), name: nameOf(panel) },
          parent:
            inferredParent != null
              ? { id: Number(inferredParent), name: nameOf(inferredParent) }
              : null,
          invoker,
          navBefore: toNamedStack(navBefore),
          visibleBefore_map: !!visibilityMap[Number(panel)],
          visibleBefore_store: panelStore.isVisible(panel),
        });
      }

      branchNodeShow(panel);
      persistPanelTypeIdStack(snapshotBranch());
      base.openPanel(panel, invoker, inferredParent);

      if (DEBUG_BRANCH) logBranch(`show:${panelName(Number(panel) as any)}`);
    },
    [
      base,
      visibilityMap,
      manageContainer,
      manageScopedSet,
      persistPanelTypeIdStack,
    ],
  );

  const closePanel = useCallback(
    (panel: SP_COIN_DISPLAY, invoker?: string, arg?: unknown) => {
      const navBefore = snapshotBranch();
      const leaf =
        navBefore.length > 0
          ? (navBefore[navBefore.length - 1] as SP_COIN_DISPLAY)
          : null;

      const target =
        leaf &&
        Number(panel) === Number(manageContainer) &&
        Number(leaf) !== Number(panel)
          ? leaf
          : panel;

      lastActionRef.current = {
        kind: 'closePanel',
        requested: panel,
        target,
        invoker,
        navBefore,
        ts: Date.now(),
      };

      if (DEBUG_CLOSE_INVARIANTS) {
        debugGroup('[PanelTree][close-invariants] closePanel() request');
        // eslint-disable-next-line no-console
        console.log('requested', { id: Number(panel), name: nameOf(panel) });
        // eslint-disable-next-line no-console
        console.log('target', { id: Number(target), name: nameOf(target) });
        // eslint-disable-next-line no-console
        console.log(
          'leaf',
          leaf != null ? { id: Number(leaf), name: nameOf(leaf) } : null,
        );
        // eslint-disable-next-line no-console
        console.log('invoker', invoker);
        // eslint-disable-next-line no-console
        console.log('navBefore', toNamedStack(navBefore));
        // eslint-disable-next-line no-console
        console.log('visibleBefore_map', !!visibilityMap[Number(target)]);
        // eslint-disable-next-line no-console
        console.log('visibleBefore_store', panelStore.isVisible(target));
        debugGroupEnd();
      }

      branchNodeHide(target);
      persistPanelTypeIdStack(snapshotBranch());
      base.closePanel(target, invoker, arg);

      if (DEBUG_BRANCH) logBranch(`hide:${panelName(Number(target) as any)}`);

      if (DEBUG_CLOSE_INVARIANTS) {
        const check = (phase: 'microtask' | 'timeout') => {
          const navNow = snapshotBranch();
          const vStore = panelStore.isVisible(target);
          // eslint-disable-next-line no-console
          console.log(`[PanelTree][close-invariants] post-close (${phase})`, {
            target: { id: Number(target), name: nameOf(target) },
            requested: { id: Number(panel), name: nameOf(panel) },
            invoker,
            targetVisible_store: vStore,
            branchStackNow: toNamedStack(navNow),
            manageScopedVisibleNow_store: visibleManageKidsFromStore(),
          });
        };

        queueMicrotask(() => check('microtask'));
        setTimeout(() => check('timeout'), 0);
      }
    },
    [
      base,
      manageContainer,
      visibilityMap,
      manageScoped,
      persistPanelTypeIdStack,
    ],
  );

  const closeTopPanel = useCallback(
    (invoker?: string) => {
      const navBefore = snapshotBranch();
      const leaf =
        navBefore.length > 0
          ? (navBefore[navBefore.length - 1] as SP_COIN_DISPLAY)
          : null;

      if (!leaf) return;

      lastActionRef.current = {
        kind: 'closeTopPanel',
        leaf,
        invoker,
        navBefore,
        ts: Date.now(),
      };

      if (DEBUG_CLOSE_INVARIANTS) {
        // eslint-disable-next-line no-console
        console.log('[PanelTree][close-invariants] closeTopPanel()', {
          leaf: { id: Number(leaf), name: nameOf(leaf) },
          invoker,
          navBefore: toNamedStack(navBefore),
          visibleBefore_map: !!visibilityMap[Number(leaf)],
          visibleBefore_store: panelStore.isVisible(leaf),
        });
      }

      branchNodeHide(leaf);
      persistPanelTypeIdStack(snapshotBranch());
      base.closePanel(leaf, invoker ?? 'HeaderX');

      if (DEBUG_BRANCH) logBranch(`hideTop:${panelName(Number(leaf) as any)}`);
    },
    [base, visibilityMap, persistPanelTypeIdStack],
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
            ? { name: panelName(Number(selectedChild) as any), id: Number(selectedChild) }
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
        '[PanelTree] branchStack =',
        nav.map((p: SP_COIN_DISPLAY) => ({
          name: panelName(Number(p) as any),
          id: Number(p),
        })),
      );

      const persisted = (exchangeContext as any)?.settings?.panelTypeIdStack ?? [];
      console.log(
        '[PanelTree] panelTypeIdStack (persisted) =',
        (persisted as any[]).map((p) => ({
          name: panelName(Number(p) as any),
          id: Number(p),
        })),
      );

      console.groupEnd();
    },
    [getPanelChildren, visibilityMap, exchangeContext],
  );

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
