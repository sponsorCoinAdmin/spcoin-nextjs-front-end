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

/* ───────────────────────────── Runtime NAV stack (NOT persisted) ───────────────────────────── */
const NAV_STACK: SP_COIN_DISPLAY[] = [];

const DEBUG_NAV =
  process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_TREE === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_OVERLAY_CLOSE === 'true';

const DEBUG_CLOSE_INVARIANTS =
  process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_CLOSE_INVARIANTS === 'true';

const DEBUG_CLOSE_INVARIANTS_RENDER =
  process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_CLOSE_INVARIANTS_RENDER === 'true';

const DEBUG_OPEN_INFER_PARENT =
  process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_OPEN_INFER_PARENT === 'true';

const snapshotNav = (): SP_COIN_DISPLAY[] => NAV_STACK.slice();

const navEnsureSeeded = (seed: SP_COIN_DISPLAY[] | number[]): void => {
  if (NAV_STACK.length > 0) return;
  if (!seed.length) return;
  NAV_STACK.length = 0;
  for (const p of seed as any) NAV_STACK.push(p as any);
};

const navPush = (panel: SP_COIN_DISPLAY): void => {
  const idx = NAV_STACK.lastIndexOf(panel);
  if (idx >= 0) {
    NAV_STACK.length = idx + 1;
    return;
  }
  NAV_STACK.push(panel);
};

const navPop = (panel: SP_COIN_DISPLAY): void => {
  if (!NAV_STACK.length) return;

  const top = NAV_STACK[NAV_STACK.length - 1] as SP_COIN_DISPLAY;
  if (Number(top) === Number(panel)) {
    NAV_STACK.pop();
    return;
  }

  const idx = NAV_STACK.lastIndexOf(panel);
  if (idx >= 0) NAV_STACK.length = idx;
};

const navNodeShow = (panel: SP_COIN_DISPLAY): void => navPush(panel);
const navNodeHide = (panel: SP_COIN_DISPLAY): void => navPop(panel);

const nameOf = (p: SP_COIN_DISPLAY | number | null | undefined) =>
  p == null ? null : panelName(Number(p) as any);

const toNamedStack = (arr: SP_COIN_DISPLAY[]) =>
  arr.map((p) => ({ id: Number(p), name: nameOf(p) }));

const logNav = (tag?: string) => {
  if (!DEBUG_NAV) return;
  // eslint-disable-next-line no-console
  console.log(`[PanelTree] navStack${tag ? ` (${tag})` : ''} =`, [
    ...NAV_STACK.map((p) => ({
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
    if (a !== b) changes.push({ id, name: panelName(id as any), from: a, to: b });
  }
  return changes;
};

/* ───────────────────────────── Display stack helpers (Option A) ───────────────────────────── */

type DISPLAY_STACK_NODE = { id: SP_COIN_DISPLAY; name: string };

const normalizeIds = (arr: Array<number | SP_COIN_DISPLAY>) =>
  arr
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x))
    .map((x) => x as SP_COIN_DISPLAY) as SP_COIN_DISPLAY[];

const sameStack = (
  a: Array<number | SP_COIN_DISPLAY>,
  b: Array<number | SP_COIN_DISPLAY>,
) => {
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

// Wrapper nodes to SKIP in persisted nav stack
const NON_INDEXED = new Set<number>([
  Number(SP_COIN_DISPLAY.MAIN_TRADING_PANEL),
  Number(SP_COIN_DISPLAY.TRADE_CONTAINER_HEADER),
  Number(SP_COIN_DISPLAY.CONFIG_SLIPPAGE_PANEL),
]);

const toPersistedNavIds = (arr: Array<number | SP_COIN_DISPLAY>) =>
  normalizeIds(arr).filter((p) => !NON_INDEXED.has(Number(p)));

const toDisplayStackNodes = (ids: SP_COIN_DISPLAY[]): DISPLAY_STACK_NODE[] =>
  ids.map((id) => ({ id, name: panelName(Number(id) as any) }));

/**
 * Accepts:
 * - new: [{id,name}]
 * - legacy: number[]
 * - older experimental: [{displayTypeId,...}]
 * - mixed (defensive)
 */
const normalizeDisplayStackNodesToIds = (raw: unknown): SP_COIN_DISPLAY[] => {
  if (!Array.isArray(raw)) return [];
  const ids: number[] = [];

  for (const item of raw as any[]) {
    if (item && typeof item === 'object') {
      if ('id' in item) ids.push(Number((item as any).id));
      else if ('displayTypeId' in item) ids.push(Number((item as any).displayTypeId));
      continue;
    }
    ids.push(Number(item));
  }

  return ids
    .filter((x) => Number.isFinite(x))
    .map((x) => x as SP_COIN_DISPLAY);
};

export function usePanelTree() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  /* ------------------------------- source -------------------------------- */

  const list = useMemo<PanelEntry[]>(() => {
    return flattenPanelTree((exchangeContext as any)?.settings?.spCoinPanelTree, KNOWN);
  }, [exchangeContext]);

  const visibilityMap = useMemo(() => toVisibilityMap(list), [list]);

  /* -------------------------- global overlays ----------------------------- */

  const overlays = useMemo(() => MAIN_OVERLAY_GROUP.slice(), []);
  const isGlobalOverlay = useCallback((p: SP_COIN_DISPLAY) => overlays.includes(p), [
    overlays,
  ]);

  /* -------------------------- manage scope -------------------------------- */

  const manageContainer = SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS;

  const manageScoped = useMemo<SP_COIN_DISPLAY[]>(() => {
    const kids = (CHILDREN as any)?.[manageContainer] as SP_COIN_DISPLAY[] | undefined;
    return Array.isArray(kids) ? kids.slice() : [];
  }, [manageContainer]);

  const manageScopedSet = useMemo(() => new Set<number>(manageScoped as any), [
    manageScoped,
  ]);

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

  const manageDescendantsSet = useMemo(() => computeManageDescendantsSet(manageCfg), [
    manageCfg,
  ]);

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
      for (const id of manageScoped) if (map[Number(id)]) return id;
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

  useMemo(() => publishVisibility(visibilityMap), [visibilityMap, publishVisibility]);

  /* ------------------------------ queries -------------------------------- */

  const isVisible = useCallback((panel: SP_COIN_DISPLAY) => panelStore.isVisible(panel), []);
  const getPanelChildren = useCallback(
    (panel: SP_COIN_DISPLAY): SP_COIN_DISPLAY[] =>
      (((CHILDREN as any)?.[panel] as unknown) as SP_COIN_DISPLAY[]) ?? [],
    [],
  );

  /* ------------------------------ display branch -------------------------- */

  const displayBranch = useMemo(() => {
    const start = SP_COIN_DISPLAY.MAIN_TRADING_PANEL;
    return computeDisplayBranch(start, getPanelChildren, (p) => !!visibilityMap[Number(p)]);
  }, [getPanelChildren, visibilityMap]);

  /* ------------------------------ safe context update --------------------- */

  const setExchangeContextSafe = useCallback(
    (nextOrUpdater: any) => {
      try {
        (setExchangeContext as any)(nextOrUpdater);
      } catch {
        if (typeof nextOrUpdater === 'function') {
          (setExchangeContext as any)(nextOrUpdater(exchangeContext));
        } else {
          (setExchangeContext as any)(nextOrUpdater);
        }
      }
    },
    [setExchangeContext, exchangeContext],
  );

  /* ------------------------------ persistence ----------------------------- */

  const persistDisplayStack = useCallback(
    (nextIds: SP_COIN_DISPLAY[] | number[]) => {
      const nextPersistedIds = toPersistedNavIds(nextIds as any);

      const currentRaw = (exchangeContext as any)?.settings?.displayStack;
      const currentIds = toPersistedNavIds(normalizeDisplayStackNodesToIds(currentRaw));

      if (sameStack(currentIds, nextPersistedIds)) return;

      const displayStack = toDisplayStackNodes(nextPersistedIds);

      setExchangeContextSafe((prev: any) => {
        const prevSettings = prev?.settings ?? {};
        return {
          ...prev,
          settings: {
            ...prevSettings,
            displayStack,
          },
        };
      });
    },
    [exchangeContext, setExchangeContextSafe],
  );

  // Hydration + invariants:
  // - seed NAV_STACK from persisted displayStack OR derived displayBranch
  // - if persisted missing, derive + persist
  // - keep persisted aligned to derived visible branch
  // - keep NAV_STACK aligned too
  useEffect(() => {
    const settingsStackRaw = (exchangeContext as any)?.settings?.displayStack;

    const hasPersistedStack = Array.isArray(settingsStackRaw);
    const persistedIds = hasPersistedStack
      ? toPersistedNavIds(normalizeDisplayStackNodesToIds(settingsStackRaw))
      : [];

    const derivedIds = toPersistedNavIds(displayBranch);

    // 1) Seed runtime stack if empty
    if (NAV_STACK.length === 0) {
      if (persistedIds.length > 0) navEnsureSeeded(persistedIds);
      else if (derivedIds.length > 0) navEnsureSeeded(derivedIds);
    }

    // 2) Missing/empty persisted stack: derive + persist immediately
    if ((!hasPersistedStack || persistedIds.length === 0) && derivedIds.length > 0) {
      persistDisplayStack(derivedIds);
      return;
    }

    // 3) Persisted diverges from derived visible branch: overwrite with derived
    if (derivedIds.length > 0 && !sameStack(persistedIds, derivedIds)) {
      persistDisplayStack(derivedIds);
    }

    // 4) Runtime invariant: NAV_STACK matches derived stack
    if (derivedIds.length > 0) {
      const navNow = toPersistedNavIds(snapshotNav());
      if (!sameStack(navNow, derivedIds)) {
        NAV_STACK.length = 0;
        for (const id of derivedIds) NAV_STACK.push(id);
      }
    }
  }, [exchangeContext, displayBranch, persistDisplayStack]);

  /* ------------------------------ debug tracer ---------------------------- */

  const lastActionRef = useRef<LastAction>(null);
  const lastVisRef = useRef<Record<number, boolean> | null>(null);

  const visibleManageKidsFromStore = () =>
    manageScoped
      .filter((p) => panelStore.isVisible(p))
      .map((p) => ({ id: Number(p), name: nameOf(p) }));

  const visibleManageKidsFromMap = () =>
    manageScoped
      .filter((p) => !!visibilityMap[Number(p)])
      .map((p) => ({ id: Number(p), name: nameOf(p) }));

  useEffect(() => {
    if (!DEBUG_CLOSE_INVARIANTS_RENDER) return;

    const action = lastActionRef.current;
    const claim = SP_COIN_DISPLAY.CLAIM_SPONSOR_REWARDS_LIST_PANEL;

    const persistedRaw = (exchangeContext as any)?.settings?.displayStack ?? [];
    const persistedIds = toPersistedNavIds(normalizeDisplayStackNodesToIds(persistedRaw));

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
                    requested: { id: Number(action.requested), name: nameOf(action.requested) },
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
      derivedPersistedBranchNow: toNamedStack(toPersistedNavIds(displayBranch)),
      navStackNow: toNamedStack(snapshotNav()),
      persistedDisplayStackNow: toNamedStack(persistedIds),

      displayStack_persisted: persistedRaw,
    });
  }, [visibilityMap, manageScoped, displayBranch, exchangeContext]);

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

        // eslint-disable-next-line no-console
        console.log('[PanelTree][close-invariants] publishVisibility', {
          lastAction: action ? { ...action, ageMs } : null,
          visibilityChanges: changes.length ? changes : '(none)',
        });

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

  const base = useMemo(() => createPanelTreeCallbacks(callbacksDeps), [callbacksDeps]);

  const openPanel = useCallback(
    (panel: SP_COIN_DISPLAY, invoker?: string, parent?: SP_COIN_DISPLAY) => {
      const inferredParent =
        parent == null && manageScopedSet.has(Number(panel)) ? manageContainer : parent;

      if (DEBUG_OPEN_INFER_PARENT && parent == null && inferredParent != null) {
        // eslint-disable-next-line no-console
        console.log('[PanelTree][open-infer-parent]', {
          panel: { id: Number(panel), name: nameOf(panel) },
          inferredParent: { id: Number(inferredParent), name: nameOf(inferredParent) },
          invoker,
        });
      }

      const navBefore = snapshotNav();
      lastActionRef.current = {
        kind: 'openPanel',
        panel,
        invoker,
        parent: inferredParent,
        navBefore,
        ts: Date.now(),
      };

      navNodeShow(panel);
      persistDisplayStack(toPersistedNavIds(snapshotNav()));
      base.openPanel(panel, invoker, inferredParent);

      if (DEBUG_NAV) logNav(`show:${panelName(Number(panel) as any)}`);
    },
    [base, manageContainer, manageScopedSet, persistDisplayStack],
  );

  const closePanel = useCallback(
    (panel: SP_COIN_DISPLAY, invoker?: string, arg?: unknown) => {
      const navBefore = snapshotNav();
      const leaf = navBefore.length ? (navBefore[navBefore.length - 1] as SP_COIN_DISPLAY) : null;

      // closing manage container closes leaf (child) if leaf is not container
      const target =
        leaf && Number(panel) === Number(manageContainer) && Number(leaf) !== Number(panel)
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

      navNodeHide(target);
      persistDisplayStack(toPersistedNavIds(snapshotNav()));
      base.closePanel(target, invoker, arg);

      if (DEBUG_NAV) logNav(`hide:${panelName(Number(target) as any)}`);
    },
    [base, manageContainer, persistDisplayStack],
  );

  const closeTopPanel = useCallback(
    (invoker?: string) => {
      const navBefore = snapshotNav();
      const leaf = navBefore.length ? (navBefore[navBefore.length - 1] as SP_COIN_DISPLAY) : null;
      if (!leaf) return;

      lastActionRef.current = {
        kind: 'closeTopPanel',
        leaf,
        invoker,
        navBefore,
        ts: Date.now(),
      };

      navNodeHide(leaf);
      persistDisplayStack(toPersistedNavIds(snapshotNav()));
      base.closePanel(leaf, invoker ?? 'HeaderX');

      if (DEBUG_NAV) logNav(`hideTop:${panelName(Number(leaf) as any)}`);
    },
    [base, persistDisplayStack],
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
      const title = `[PanelTree] Display branch${tag ? ` (${tag})` : ''} from "${panelName(
        Number(start) as any,
      )}" (${Number(start)})`;

      // eslint-disable-next-line no-console
      console.groupCollapsed(title);

      const displayStack = computeDisplayBranch(
        start,
        getPanelChildren,
        (p) => !!visibilityMap[Number(p)],
      );

      // eslint-disable-next-line no-console
      console.log('[PanelTree] displayBranch =', toNamedStack(displayStack));
      // eslint-disable-next-line no-console
      console.log('[PanelTree] derivedPersistedIds =', toNamedStack(toPersistedNavIds(displayStack)));
      // eslint-disable-next-line no-console
      console.log(
        '[PanelTree] derivedPersistedNodes =',
        toDisplayStackNodes(toPersistedNavIds(displayStack)),
      );
      // eslint-disable-next-line no-console
      console.log('[PanelTree] navStack =', toNamedStack(snapshotNav()));
      // eslint-disable-next-line no-console
      console.log(
        '[PanelTree] displayStack (persisted) =',
        (exchangeContext as any)?.settings?.displayStack ?? [],
      );

      // eslint-disable-next-line no-console
      console.groupEnd();
    },
    [exchangeContext, getPanelChildren, visibilityMap],
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
