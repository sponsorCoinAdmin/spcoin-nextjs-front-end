// File: @/lib/context/exchangeContext/hooks/usePanelTree.ts
'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import type { DISPLAY_STACK_NODE } from '@/lib/structure/types';
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

const DEBUG_NAV =
  process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_TREE === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_OVERLAY_CLOSE === 'true';

const DEBUG_CLOSE_INVARIANTS =
  process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_CLOSE_INVARIANTS === 'true';

const DEBUG_CLOSE_INVARIANTS_RENDER =
  process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_CLOSE_INVARIANTS_RENDER === 'true';

const DEBUG_OPEN_INFER_PARENT =
  process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_OPEN_INFER_PARENT === 'true';

const nameOf = (p: SP_COIN_DISPLAY | number | null | undefined) =>
  p == null ? null : panelName(Number(p) as any);

const toNamedStack = (arr: SP_COIN_DISPLAY[]) =>
  arr.map((p) => ({ id: Number(p), name: nameOf(p) }));

type LastAction =
  | {
      kind: 'openPanel';
      panel: SP_COIN_DISPLAY;
      invoker?: string;
      parent?: SP_COIN_DISPLAY | null;
      stackBefore: SP_COIN_DISPLAY[];
      ts: number;
    }
  | {
      kind: 'closePanel';
      requested: SP_COIN_DISPLAY;
      target: SP_COIN_DISPLAY;
      invoker?: string;
      stackBefore: SP_COIN_DISPLAY[];
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

/* ───────────────────────────── DisplayStack helpers (single source of truth) ───────────────────────────── */

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

// Wrapper nodes to SKIP in persisted stack
const NON_INDEXED = new Set<number>([
  Number(SP_COIN_DISPLAY.MAIN_TRADING_PANEL),
  Number(SP_COIN_DISPLAY.TRADE_CONTAINER_HEADER),
  Number(SP_COIN_DISPLAY.CONFIG_SLIPPAGE_PANEL),
]);

const toPersistedStackIds = (arr: Array<number | SP_COIN_DISPLAY>) =>
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

  const list = useMemo<PanelEntry[]>(() => {
    return flattenPanelTree(
      (exchangeContext as any)?.settings?.spCoinPanelTree,
      KNOWN,
    );
  }, [exchangeContext]);

  const visibilityMap = useMemo(() => toVisibilityMap(list), [list]);

  const overlays = useMemo(() => MAIN_OVERLAY_GROUP.slice(), []);
  const isGlobalOverlay = useCallback((p: SP_COIN_DISPLAY) => overlays.includes(p), [
    overlays,
  ]);

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

  const manageDescendantsSet = useMemo(
    () => computeManageDescendantsSet(manageCfg),
    [manageCfg],
  );

  const { isManageRadioChild, isManageAnyChild } = useMemo(
    () => makeManagePredicates(manageCfg, manageScopedSet, manageDescendantsSet),
    [manageCfg, manageScopedSet, manageDescendantsSet],
  );

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

  const publishVisibility = useCallback((nextMap: Record<number, boolean>) => {
    for (const [idStr, v] of Object.entries(nextMap)) {
      panelStore.setVisible(Number(idStr) as SP_COIN_DISPLAY, !!v);
    }
  }, []);

  // ✅ Correct side-effect hook (no useMemo side-effects)
  useEffect(() => {
    publishVisibility(visibilityMap);
  }, [visibilityMap, publishVisibility]);

  const isVisible = useCallback(
    (panel: SP_COIN_DISPLAY) => panelStore.isVisible(panel),
    [],
  );

  const getPanelChildren = useCallback(
    (panel: SP_COIN_DISPLAY): SP_COIN_DISPLAY[] =>
      (((CHILDREN as any)?.[panel] as unknown) as SP_COIN_DISPLAY[]) ?? [],
    [],
  );

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

  const getPersistedDisplayStackIds = useCallback((): SP_COIN_DISPLAY[] => {
    const currentRaw = (exchangeContext as any)?.settings?.displayStack;
    return toPersistedStackIds(normalizeDisplayStackNodesToIds(currentRaw));
  }, [exchangeContext]);

  const persistDisplayStack = useCallback(
    (nextIds: SP_COIN_DISPLAY[] | number[]) => {
      const nextPersistedIds = toPersistedStackIds(nextIds as any);
      const currentIds = getPersistedDisplayStackIds();
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
    [getPersistedDisplayStackIds, setExchangeContextSafe],
  );

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

    const claim = SP_COIN_DISPLAY.CLAIM_SPONSOR_REWARDS_LIST_PANEL;

    const persistedIds = getPersistedDisplayStackIds();
    const persistedRaw = (exchangeContext as any)?.settings?.displayStack ?? [];
    const action = lastActionRef.current;

    // eslint-disable-next-line no-console
    console.log('[PanelTree][render-sync]', {
      lastAction: action,
      claimVisible_map: !!visibilityMap[Number(claim)],
      claimVisible_store: panelStore.isVisible(claim),
      manageVisible_map: visibleManageKidsFromMap(),
      manageVisible_store: visibleManageKidsFromStore(),

      // ✅ one source of truth (raw)
      displayStack_persisted: persistedRaw,

      // optional helper: ids in named form for readability
      persistedDisplayStackNow: toNamedStack(persistedIds),
    });
  }, [visibilityMap, manageScoped, exchangeContext, getPersistedDisplayStackIds]);

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
        // eslint-disable-next-line no-console
        console.log('[PanelTree][close-invariants] publishVisibility', {
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

  /* ------------------------------ actions -------------------------------- */

  /**
   * pushPanel: stack-only (persist displayStack push). No visibility side effects.
   */
  const pushPanel = useCallback(
    (panel: SP_COIN_DISPLAY) => {
      const stackBefore = getPersistedDisplayStackIds();
      const nextStack = toPersistedStackIds([...stackBefore, panel]);
      persistDisplayStack(nextStack);

      if (DEBUG_NAV) {
        // eslint-disable-next-line no-console
        console.log('[PanelTree] displayStack (push) =', toNamedStack(nextStack));
      }

      return { stackBefore, nextStack };
    },
    [getPersistedDisplayStackIds, persistDisplayStack],
  );

  /**
   * popPanel: stack-only (persist displayStack pop). No visibility side effects.
   * Returns the popped id or null.
   */
  const popPanel = useCallback(() => {
    const stackBefore = getPersistedDisplayStackIds();
    if (!stackBefore.length) {
      return {
        popped: null as SP_COIN_DISPLAY | null,
        stackBefore,
        nextStack: stackBefore,
      };
    }

    const popped = stackBefore[stackBefore.length - 1] as SP_COIN_DISPLAY;
    const nextStack = stackBefore.slice(0, -1);

    persistDisplayStack(nextStack);

    if (DEBUG_NAV) {
      // eslint-disable-next-line no-console
      console.log('[PanelTree] displayStack (pop) =', toNamedStack(nextStack));
    }

    return { popped, stackBefore, nextStack };
  }, [getPersistedDisplayStackIds, persistDisplayStack]);

  /**
   * showPanel: visibility-only (open panel). No stack side effects.
   * Keeps the "infer parent" behavior for manage-scoped panels.
   */
  const showPanel = useCallback(
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

      base.openPanel(panel, invoker, inferredParent);
      return inferredParent ?? null;
    },
    [base, manageContainer, manageScopedSet],
  );

  /**
   * hidePanel: visibility-only (close panel). No stack side effects.
   */
  const hidePanel = useCallback(
    (panel: SP_COIN_DISPLAY, invoker?: string, arg?: unknown) => {
      base.closePanel(panel, invoker, arg);
    },
    [base],
  );

  /**
   * openPanel: composed behavior (push + show)
   */
  const openPanel = useCallback(
    (panel: SP_COIN_DISPLAY, invoker?: string, parent?: SP_COIN_DISPLAY) => {
      const stackBefore = getPersistedDisplayStackIds();

      // push (persist)
      pushPanel(panel);

      // show (visibility)
      const inferredParent = showPanel(panel, invoker, parent);

      lastActionRef.current = {
        kind: 'openPanel',
        panel,
        invoker,
        parent: inferredParent,
        stackBefore,
        ts: Date.now(),
      };
    },
    [getPersistedDisplayStackIds, pushPanel, showPanel],
  );

  /**
   * closeTopOfDisplayStack: composed behavior (pop + hide)
   */
  const closeTopOfDisplayStack = useCallback(
    (invoker?: string, arg?: unknown) => {
      const { popped: closing, stackBefore } = popPanel();
      if (!closing) return;

      lastActionRef.current = {
        kind: 'closePanel',
        requested: closing,
        target: closing,
        invoker: invoker ?? 'usePanelTree:closeTopOfDisplayStack',
        stackBefore,
        ts: Date.now(),
      };

      hidePanel(closing, invoker ?? 'closeTopOfDisplayStack:persist-pop', arg);
    },
    [popPanel, hidePanel],
  );

  // ✅ visibility-based leaf inference (because stack top may be hidden)
  const deriveVisibleManageLeaf = useCallback((): SP_COIN_DISPLAY | null => {
    const pending = SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS;
    if (isVisible(pending)) return pending;

    for (const id of manageScoped) {
      if (isVisible(id)) return id;
    }
    return null;
  }, [isVisible, manageScoped]);

  /**
   * closePanel: visibility-only close (no stack change), but preserves manageContainer behavior.
   */
  const closePanel = useCallback(
    (panel: SP_COIN_DISPLAY, invoker?: string, arg?: unknown) => {
      const stackBefore = getPersistedDisplayStackIds();

      let target = panel;

      // hide-only close of manageContainer closes the currently visible manage leaf
      if (Number(panel) === Number(manageContainer)) {
        target = deriveVisibleManageLeaf() ?? manageContainer;
      }

      lastActionRef.current = {
        kind: 'closePanel',
        requested: panel,
        target,
        invoker,
        stackBefore,
        ts: Date.now(),
      };

      hidePanel(target, invoker, arg);
    },
    [manageContainer, getPersistedDisplayStackIds, deriveVisibleManageLeaf, hidePanel],
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

  const dumpNavStack = useCallback(
    (tag?: string): void => {
      const title = `[PanelTree] displayStack${tag ? ` (${tag})` : ''}`;

      // eslint-disable-next-line no-console
      console.groupCollapsed(title);

      const persistedRaw = (exchangeContext as any)?.settings?.displayStack ?? [];
      const persistedIds = getPersistedDisplayStackIds();

      // ✅ one source of truth
      // eslint-disable-next-line no-console
      console.log('[PanelTree] displayStack (persisted) =', persistedRaw);

      // Optional: ids only (NOT rebuilt nodes)
      // eslint-disable-next-line no-console
      console.log('[PanelTree] displayStackIds =', persistedIds.map(Number));

      // eslint-disable-next-line no-console
      console.groupEnd();
    },
    [exchangeContext, getPersistedDisplayStackIds],
  );

  return {
    activeMainOverlay,
    isVisible,
    isTokenScrollVisible,
    getPanelChildren,
    openPanel,
    closePanel,
    closeTopOfDisplayStack,
    dumpNavStack,

    // new primitives
    pushPanel,
    popPanel,
    showPanel,
    hidePanel,
  };
}
