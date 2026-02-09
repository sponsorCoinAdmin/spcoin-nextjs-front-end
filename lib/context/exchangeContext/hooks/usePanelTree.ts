// File: @/lib/context/exchangeContext/hooks/usePanelTree.ts
'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import type { DISPLAY_STACK_NODE } from '@/lib/structure/types';
import {
  MAIN_RADIO_OVERLAY_PANELS,
  PANEL_DEFS,
  CHILDREN,
} from '@/lib/structure/exchangeContext/registry/panelRegistry';
import { panelStore } from '@/lib/context/exchangeContext/panelStore';

// ✅ STACK_COMPONENT gate (only these may be pushed/popped)
import { IS_STACK_COMPONENT } from '@/lib/structure/exchangeContext/constants/spCoinDisplay';

import {
  type PanelEntry,
  flattenPanelTree,
  toVisibilityMap,
  panelName,
  // ✅ NEW: hydration repair helpers
  ensurePanelPresent,
  writeFlatTree,
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

// ✅ Use project logger (instead of raw console.log)
import { createDebugLogger } from '@/lib/utils/debugLogger';

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

// ✅ New: action-level trace logging (push/pop/open/close)
const DEBUG_ACTIONS = process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_ACTIONS === 'true';

// ✅ New: stack-focused debugging (diagnose “why stack stays empty”)
const DEBUG_STACK = process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_STACK === 'true';

// ✅ Allow closing ALL radio overlays (no forced fallback)
const ALLOW_EMPTY_GLOBAL_OVERLAY =
  process.env.NEXT_PUBLIC_ALLOW_EMPTY_GLOBAL_OVERLAY === 'true';

// ✅ Target to diagnose “opens then closes”
const TRACE_TARGET = SP_COIN_DISPLAY.TRADING_STATION_PANEL;

const nameOf = (p: SP_COIN_DISPLAY | number | null | undefined) =>
  p == null ? null : panelName(Number(p) as any);

const toNamedStack = (arr: SP_COIN_DISPLAY[]) =>
  arr.map((p) => ({ id: Number(p), name: nameOf(p) }));

const diffVisibility = (
  prev: Record<number, boolean> | null | undefined,
  next: Record<number, boolean>,
) => {
  const changes: Array<{ id: number; name: string; from: boolean; to: boolean }> = [];
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

/**
 * ✅ Persisted stack ids are ALWAYS:
 *   - not NON_INDEXED
 *   - AND members of STACK_COMPONENTS
 */
const toPersistedStackIds = (arr: Array<number | SP_COIN_DISPLAY>) =>
  normalizeIds(arr).filter(
    (p) => !NON_INDEXED.has(Number(p)) && IS_STACK_COMPONENT.has(Number(p)),
  );

const toDisplayStackNodes = (ids: SP_COIN_DISPLAY[]): DISPLAY_STACK_NODE[] =>
  ids.map((id) => ({ id, name: panelName(Number(id) as any) }));

/**
 * Accepts:
 * - new: [{id,name}]
 * - legacy: number[]
 * - older experimental: [{displayTypeId,...}]
 * - mixed (defensive)
 */
const LEGACY_BUY_LIST_NAME = 'BUY_LIST_SELECT_PANEL';
const mapLegacyPanelId = (id: number): number =>
  SP_COIN_DISPLAY[id as SP_COIN_DISPLAY] === LEGACY_BUY_LIST_NAME
    ? SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL
    : id;

const normalizeDisplayStackNodesToIds = (raw: unknown): SP_COIN_DISPLAY[] => {
  if (!Array.isArray(raw)) return [];
  const ids: number[] = [];

  for (const item of raw as any[]) {
    if (item && typeof item === 'object') {
      if ('id' in item) ids.push(mapLegacyPanelId(Number((item as any).id)));
      else if ('displayTypeId' in item) ids.push(mapLegacyPanelId(Number((item as any).displayTypeId)));
      continue;
    }
    ids.push(mapLegacyPanelId(Number(item)));
  }

  return ids.filter((x) => Number.isFinite(x)).map((x) => x as SP_COIN_DISPLAY);
};

/* ───────────────────────────── Exclusivity groups (radio or none) ───────────────────────────── */

// ACCOUNT_PANEL children: exactly 0 or 1 visible
const ACCOUNT_PANEL_MODES: readonly SP_COIN_DISPLAY[] = [
  SP_COIN_DISPLAY.SPONSOR_ACCOUNT,
  SP_COIN_DISPLAY.RECIPIENT_ACCOUNT,
  SP_COIN_DISPLAY.AGENT_ACCOUNT,
] as const;

const isAccountPanelMode = (p: SP_COIN_DISPLAY) =>
  ACCOUNT_PANEL_MODES.some((x) => Number(x) === Number(p));

// ✅ TOKEN_CONTRACT_PANEL children: exactly 0 or 1 visible
const TOKEN_CONTRACT_PANEL_MODES: readonly SP_COIN_DISPLAY[] = [
  SP_COIN_DISPLAY.BUY_TOKEN,
  SP_COIN_DISPLAY.SELL_TOKEN,
] as const;

const isTokenContractPanelMode = (p: SP_COIN_DISPLAY) =>
  TOKEN_CONTRACT_PANEL_MODES.some((x) => Number(x) === Number(p));

// Rewards modes: exactly 0 or 1 visible
const REWARDS_GROUP_MODES: readonly SP_COIN_DISPLAY[] = [
  SP_COIN_DISPLAY.ACTIVE_SPONSORSHIPS,
  SP_COIN_DISPLAY.PENDING_SPONSOR_REWARDS,
  SP_COIN_DISPLAY.PENDING_RECIPIENT_REWARDS,
  SP_COIN_DISPLAY.PENDING_AGENT_REWARDS,
] as const;

const isRewardsGroupMode = (p: SP_COIN_DISPLAY) =>
  REWARDS_GROUP_MODES.some((x) => Number(x) === Number(p));

export function usePanelTree() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const debugLog = useMemo(
    () => createDebugLogger('usePanelTree', DEBUG_ACTIONS || DEBUG_STACK),
    [],
  );

  const traceRef = useRef(0);
  const nextTraceId = useCallback(() => {
    traceRef.current += 1;
    return traceRef.current;
  }, []);

  const logAction = useCallback(
    (traceId: number, event: string, payload?: any) => {
      debugLog.log?.(`[trace:${traceId}] ${event}`, payload ?? '');
    },
    [debugLog],
  );

  const list = useMemo<PanelEntry[]>(() => {
    return flattenPanelTree((exchangeContext as any)?.settings?.spCoinPanelTree, KNOWN);
  }, [exchangeContext]);

  // ✅ Hydration repair: ensure newly-added panels exist in persisted flat tree
  useEffect(() => {
    const tree = (exchangeContext as any)?.settings?.spCoinPanelTree;

    // If there's no persisted tree yet, don't repair here (defaults/boot seeding handles it)
    if (!Array.isArray(tree)) return;

    const REQUIRED = [
      SP_COIN_DISPLAY.TOKEN_CONTRACT_PANEL,
      SP_COIN_DISPLAY.BUY_TOKEN,
      SP_COIN_DISPLAY.SELL_TOKEN,
      SP_COIN_DISPLAY.SPONSOR_ACCOUNT,
      SP_COIN_DISPLAY.RECIPIENT_ACCOUNT,
      SP_COIN_DISPLAY.AGENT_ACCOUNT,
    ];

    const hasAll = REQUIRED.every((p) => list.some((e) => Number(e.panel) === Number(p)));
    if (hasAll) return;

    try {
      (setExchangeContext as any)(
        (prev: any) => {
          const flat0 = flattenPanelTree(prev?.settings?.spCoinPanelTree, KNOWN);
          let next = flat0;

          for (const p of REQUIRED) {
            next = ensurePanelPresent(next, p);
          }

          if (next.length === flat0.length) return prev;
          return writeFlatTree(prev, next);
        },
        'usePanelTree:repairPersistedTree',
      );
    } catch {
      // eslint-disable-next-line no-console
      console.warn(
        '[usePanelTree] repairPersistedTree failed via direct set; will retry via safe wrapper.',
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exchangeContext, list]);

  const visibilityMap = useMemo(() => toVisibilityMap(list), [list]);

  const overlays = useMemo(() => MAIN_RADIO_OVERLAY_PANELS.slice(), []);
  const isGlobalOverlay = useCallback((p: SP_COIN_DISPLAY) => overlays.includes(p), [
    overlays,
  ]);

  // Manage container is still used for legacy compat / branch-close logic
  const manageContainer = SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL;

  // NEW model: no manage-scoped nested radio
  const manageScoped = useMemo<SP_COIN_DISPLAY[]>(() => {
    return [];
  }, []);

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

  const manageScopedHistoryRef = useRef<SP_COIN_DISPLAY[]>([]);

  const getActiveManageScoped = useCallback((_flat: PanelEntry[]) => null, []);
  const pushManageScopedHistory = useCallback(
    (_prevScoped: SP_COIN_DISPLAY | null, _nextScoped: SP_COIN_DISPLAY) => {},
    [],
  );

  const publishVisibility = useCallback((nextMap: Record<number, boolean>) => {
    for (const [idStr, v] of Object.entries(nextMap)) {
      panelStore.setVisible(Number(idStr) as SP_COIN_DISPLAY, !!v);
    }
  }, []);

  useEffect(() => {
    publishVisibility(visibilityMap);
  }, [visibilityMap, publishVisibility]);

  const isVisible = useCallback((panel: SP_COIN_DISPLAY) => panelStore.isVisible(panel), []);

  const getPanelChildren = useCallback(
    (panel: SP_COIN_DISPLAY): SP_COIN_DISPLAY[] =>
      (((CHILDREN as any)?.[panel] as unknown) as SP_COIN_DISPLAY[]) ?? [],
    [],
  );

  const setExchangeContextSafe = useCallback(
    (nextOrUpdater: any, hookName?: string) => {
      try {
        (setExchangeContext as any)(nextOrUpdater, hookName);
      } catch {
        if (typeof nextOrUpdater === 'function') {
          (setExchangeContext as any)(nextOrUpdater(exchangeContext), hookName);
        } else {
          (setExchangeContext as any)(nextOrUpdater, hookName);
        }
      }
    },
    [setExchangeContext, exchangeContext],
  );

  const persistedIdsRef = useRef<SP_COIN_DISPLAY[]>([]);

  const readPersistedIdsFromContext = useCallback((): SP_COIN_DISPLAY[] => {
    const currentRaw = (exchangeContext as any)?.settings?.displayStack;

    if (DEBUG_STACK) {
      const rawIds = normalizeDisplayStackNodesToIds(currentRaw);
      const persisted = toPersistedStackIds(rawIds);
      debugLog.log?.('[stack] hydrate readPersistedIdsFromContext', {
        raw_displayStack: currentRaw ?? null,
        rawIds: rawIds.map(Number),
        rawIds_named: toNamedStack(rawIds as any),
        persistedIds: persisted.map(Number),
        persistedIds_named: toNamedStack(persisted),
        note:
          'If persistedIds is empty while raw_displayStack is non-empty, filtering/gating is removing items (NON_INDEXED or IS_STACK_COMPONENT).',
      });
    }

    return toPersistedStackIds(normalizeDisplayStackNodesToIds(currentRaw));
  }, [exchangeContext, debugLog]);

  useEffect(() => {
    const next = readPersistedIdsFromContext();
    const prev = persistedIdsRef.current ?? [];
    persistedIdsRef.current = next;

    if (DEBUG_STACK && !sameStack(prev, next)) {
      debugLog.log?.('[stack] persistedIdsRef sync (render)', {
        prev: toNamedStack(prev),
        next: toNamedStack(next),
      });
    }
  }, [readPersistedIdsFromContext, debugLog]);

  const getPersistedDisplayStackIds = useCallback((): SP_COIN_DISPLAY[] => {
    return persistedIdsRef.current ?? [];
  }, []);

  const persistDisplayStack = useCallback(
    (nextIds: SP_COIN_DISPLAY[] | number[], traceId?: number, reason?: string) => {
      const nextPersistedIds = toPersistedStackIds(nextIds as any);
      const currentIds = persistedIdsRef.current ?? [];

      if (sameStack(currentIds, nextPersistedIds)) {
        if (traceId != null) {
          logAction(traceId, 'persistDisplayStack skipped (sameStack)', {
            reason: reason ?? '(none)',
            current: toNamedStack(currentIds),
          });
        }
        return;
      }

      persistedIdsRef.current = nextPersistedIds;

      const displayStack = toDisplayStackNodes(nextPersistedIds);

      if (traceId != null) {
        logAction(traceId, 'persistDisplayStack write', {
          reason: reason ?? '(none)',
          next: toNamedStack(nextPersistedIds),
          next_rawIds: nextPersistedIds.map(Number),
          next_nodes: displayStack,
        });
      }

      if (DEBUG_STACK) {
        debugLog.log?.('[stack] persistDisplayStack commit', {
          reason: reason ?? '(none)',
          nextPersistedIds_named: toNamedStack(nextPersistedIds),
        });
      }

      setExchangeContextSafe(
        (prev: any) => {
          const prevSettings = prev?.settings ?? {};
          return {
            ...prev,
            settings: {
              ...prevSettings,
              displayStack,
            },
          };
        },
        'usePanelTree:persistDisplayStack',
      );
    },
    [setExchangeContextSafe, logAction, debugLog],
  );

  const lastVisRef = useRef<Record<number, boolean> | null>(null);

  useEffect(() => {
    if (!DEBUG_CLOSE_INVARIANTS_RENDER) return;

    const claim = SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL;

    const persistedIds = getPersistedDisplayStackIds();
    const persistedRaw = (exchangeContext as any)?.settings?.displayStack ?? [];

    // eslint-disable-next-line no-console
    console.log('[PanelTree][render-sync]', {
      claimVisible_map: !!visibilityMap[Number(claim)],
      claimVisible_store: panelStore.isVisible(claim),

      displayStack_persisted: persistedRaw,
      persistedDisplayStackNow: toNamedStack(persistedIds),
    });
  }, [visibilityMap, exchangeContext, getPersistedDisplayStackIds]);

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
      manageScopedHistoryRef,
      getActiveManageScoped,
      pushManageScopedHistory,
      diffAndPublish: (prev, next) => {
        if (DEBUG_ACTIONS) {
          const before = !!(prev ?? lastVisRef.current ?? {})[Number(TRACE_TARGET)];
          const after = !!next[Number(TRACE_TARGET)];
          if (before !== after) {
            debugLog.log?.('[trace] TRADING_STATION_PANEL visibility flip', {
              from: before,
              to: after,
              id: Number(TRACE_TARGET),
              name: nameOf(TRACE_TARGET),
            });
          }
        }

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
      debugLog,
    ],
  );

  const base = useMemo(() => createPanelTreeCallbacks(callbacksDeps), [callbacksDeps]);

  const baseShow = base.openPanel;
  const baseHide = base.closePanel;

  const tagInvoker = useCallback(
    (kind: 'NAV_OPEN' | 'NAV_CLOSE', invoker?: string) => {
      const s = (invoker ?? '').trim();
      const base = s.length ? s : '(none)';
      return kind === 'NAV_OPEN' ? `NAV_OPEN:${base}` : `NAV_CLOSE:${base}`;
    },
    [],
  );

  const tagHideInvoker = useCallback((invoker?: string) => {
    const s = (invoker ?? '').trim();
    const base = s.length ? s : '(none)';
    return `HIDE:${base}`;
  }, []);

  /* ------------------------------ PRIVATE (internal) -------------------------------- */

  // ✅ renamed from showInternal
  const showDisplay = useCallback(
    (panel: SP_COIN_DISPLAY, invoker?: string, parent?: SP_COIN_DISPLAY) => {
      const traceId = nextTraceId();

      const inferredParent =
        parent == null && manageScopedSet.has(Number(panel)) ? manageContainer : parent;

      logAction(traceId, 'showDisplay called', {
        panel: { id: Number(panel), name: nameOf(panel) },
        invoker,
        parent: parent == null ? null : { id: Number(parent), name: nameOf(parent) },
        inferredParent:
          inferredParent == null
            ? null
            : { id: Number(inferredParent), name: nameOf(inferredParent) },
        visibleBefore_store: panelStore.isVisible(panel),
      });

      if (DEBUG_OPEN_INFER_PARENT && parent == null && inferredParent != null) {
        // eslint-disable-next-line no-console
        console.log('[PanelTree][open-infer-parent]', {
          panel: { id: Number(panel), name: nameOf(panel) },
          inferredParent: { id: Number(inferredParent), name: nameOf(inferredParent) },
          invoker,
        });
      }

      baseShow(panel, invoker, inferredParent);
      return inferredParent ?? null;
    },
    [baseShow, manageContainer, manageScopedSet, nextTraceId, logAction],
  );

  // ✅ renamed from hideInternal
  const hideDisplay = useCallback(
    (panel: SP_COIN_DISPLAY, invoker?: string, arg?: unknown) => {
      const traceId = nextTraceId();

      logAction(traceId, 'hideDisplay called', {
        panel: { id: Number(panel), name: nameOf(panel) },
        invoker,
        visibleBefore_store: panelStore.isVisible(panel),
        arg,
      });

      baseHide(panel, invoker, arg);
    },
    [baseHide, nextTraceId, logAction],
  );

  /* ------------------------------ STACK helpers (internal) -------------------------------- */

  const pushIfStackMember = useCallback(
    (panel: SP_COIN_DISPLAY, traceId: number, reason: string) => {
      const stackBefore = getPersistedDisplayStackIds();

      logAction(traceId, 'stack push check', {
        panel: { id: Number(panel), name: nameOf(panel) },
        isStackComponent: IS_STACK_COMPONENT.has(Number(panel)),
        isNonIndexed: NON_INDEXED.has(Number(panel)),
        stackBefore: toNamedStack(stackBefore),
      });

      if (!IS_STACK_COMPONENT.has(Number(panel))) return stackBefore;
      if (NON_INDEXED.has(Number(panel))) return stackBefore;

      const nextStack = toPersistedStackIds([...stackBefore, panel]);
      persistDisplayStack(nextStack, traceId, reason);

      if (DEBUG_NAV) {
        // eslint-disable-next-line no-console
        console.log('[PanelTree] displayStack (push) =', toNamedStack(nextStack));
      }

      return nextStack;
    },
    [getPersistedDisplayStackIds, persistDisplayStack, logAction],
  );

  const removeIfStackMember = useCallback(
    (panel: SP_COIN_DISPLAY, traceId: number, reason: string) => {
      const stackBefore = getPersistedDisplayStackIds();

      logAction(traceId, 'stack remove check', {
        panel: { id: Number(panel), name: nameOf(panel) },
        isStackComponent: IS_STACK_COMPONENT.has(Number(panel)),
        stackBefore: toNamedStack(stackBefore),
      });

      if (!IS_STACK_COMPONENT.has(Number(panel))) {
        return {
          removed: null as SP_COIN_DISPLAY | null,
          stackBefore,
          nextStack: stackBefore,
        };
      }

      let idx = -1;
      for (let i = stackBefore.length - 1; i >= 0; i--) {
        if (Number(stackBefore[i]) === Number(panel)) {
          idx = i;
          break;
        }
      }

      if (idx < 0) {
        return {
          removed: null as SP_COIN_DISPLAY | null,
          stackBefore,
          nextStack: stackBefore,
        };
      }

      const nextStack = stackBefore.slice(0, idx).concat(stackBefore.slice(idx + 1));
      persistDisplayStack(nextStack, traceId, reason);

      if (DEBUG_NAV) {
        // eslint-disable-next-line no-console
        console.log('[PanelTree] displayStack (remove) =', toNamedStack(nextStack));
      }

      return { removed: panel, stackBefore, nextStack };
    },
    [getPersistedDisplayStackIds, persistDisplayStack, logAction],
  );

  const popTop = useCallback(
    (traceId: number, reason: string) => {
      const stackBefore = getPersistedDisplayStackIds();
      if (!stackBefore.length) {
        return {
          popped: null as SP_COIN_DISPLAY | null,
          stackBefore,
          nextStack: stackBefore,
        };
      }

      let idx = stackBefore.length - 1;
      while (idx >= 0 && !IS_STACK_COMPONENT.has(Number(stackBefore[idx]))) idx--;

      if (idx < 0) {
        persistDisplayStack([], traceId, `${reason}:clear (no stackable items found)`);
        return {
          popped: null as SP_COIN_DISPLAY | null,
          stackBefore,
          nextStack: [] as SP_COIN_DISPLAY[],
        };
      }

      const popped = stackBefore[idx] as SP_COIN_DISPLAY;
      const nextStack = stackBefore.slice(0, idx);
      persistDisplayStack(nextStack, traceId, reason);
      return { popped, stackBefore, nextStack };
    },
    [getPersistedDisplayStackIds, persistDisplayStack],
  );

  /**
   * ✅ Internal close used by openPanel to enforce exclusivity.
   * Mirrors closePanel(panel, ...) behavior but avoids recursion.
   */
  const closePanelInternal = useCallback(
    (panel: SP_COIN_DISPLAY, traceId: number, invoker: string) => {
      const navInvoker = tagInvoker('NAV_CLOSE', invoker);

      logAction(traceId, 'closePanelInternal (exclusivity) called', {
        panel: { id: Number(panel), name: nameOf(panel) },
        invoker: navInvoker,
        visibleBefore_store: panelStore.isVisible(panel),
      });

      const { nextStack } = removeIfStackMember(panel, traceId, `closePanel:${navInvoker}`);

      const hideInvoker =
        ALLOW_EMPTY_GLOBAL_OVERLAY && isGlobalOverlay(panel) && nextStack.length === 0
          ? tagHideInvoker(invoker)
          : navInvoker;

      hideDisplay(panel, hideInvoker);
    },
    [
      tagInvoker,
      logAction,
      removeIfStackMember,
      hideDisplay,
      isGlobalOverlay,
      tagHideInvoker,
    ],
  );

  /* ------------------------------ Accounts sync for pending rewards (Option A) ------------------------------ */

  const syncRoleAccountForPending = useCallback(
    (panel: SP_COIN_DISPLAY, traceId: number, navInvoker: string) => {
      const accounts = (exchangeContext as any)?.accounts;
      const activeAccount = accounts?.activeAccount;

      // Only act if we have a valid activeAccount
      if (!activeAccount?.address) return;

      let patch: any = null;

      if (Number(panel) === Number(SP_COIN_DISPLAY.PENDING_SPONSOR_REWARDS)) {
        patch = { sponsorAccount: activeAccount };
      } else if (Number(panel) === Number(SP_COIN_DISPLAY.PENDING_RECIPIENT_REWARDS)) {
        patch = { recipientAccount: activeAccount };
      } else if (Number(panel) === Number(SP_COIN_DISPLAY.PENDING_AGENT_REWARDS)) {
        patch = { agentAccount: activeAccount };
      } else {
        return;
      }

      logAction(traceId, 'syncRoleAccountForPending', {
        panel: { id: Number(panel), name: nameOf(panel) },
        invoker: navInvoker,
        activeAccountPreview: String(activeAccount?.address ?? '').slice(0, 12),
        patchKeys: Object.keys(patch),
      });

      setExchangeContextSafe(
        (prev: any) => {
          const prevEx = prev?.exchangeContext ?? prev;
          const prevAccounts = prevEx?.accounts ?? {};
          const prevActive = prevAccounts?.activeAccount ?? activeAccount;

          // Skip if already set to same address (avoid extra writes)
          const nextAccounts = { ...prevAccounts, activeAccount: prevActive, ...patch };

          if (prev?.exchangeContext) {
            return {
              ...prev,
              exchangeContext: {
                ...prev.exchangeContext,
                accounts: nextAccounts,
              },
            };
          }

          return {
            ...prev,
            accounts: nextAccounts,
            activeAccount: prevActive,
          };
        },
        'usePanelTree:openPanel:syncRoleAccountForPending',
      );
    },
    [exchangeContext, setExchangeContextSafe, logAction],
  );

  /* ------------------------------ PUBLIC API (single source of truth) -------------------------------- */

  const openPanel = useCallback(
    (panel: SP_COIN_DISPLAY, invoker?: string, parent?: SP_COIN_DISPLAY) => {
      const traceId = nextTraceId();
      const navInvoker = tagInvoker('NAV_OPEN', invoker);

      logAction(traceId, 'openPanel (public) called', {
        panel: { id: Number(panel), name: nameOf(panel) },
        invoker: navInvoker,
        parent: parent == null ? null : { id: Number(parent), name: nameOf(parent) },
        isStackComponent: IS_STACK_COMPONENT.has(Number(panel)),
        isNonIndexed: NON_INDEXED.has(Number(panel)),
      });

      // ✅ Option A: sync accounts immediately when opening pending rewards panels
      syncRoleAccountForPending(panel, traceId, navInvoker);

      // ✅ Enforce “radio or none” at the source of truth
      if (isAccountPanelMode(panel)) {
        for (const other of ACCOUNT_PANEL_MODES) {
          if (Number(other) !== Number(panel) && panelStore.isVisible(other)) {
            closePanelInternal(
              other,
              traceId,
              `openPanel:${navInvoker}:accountPanelMode:closeOther`,
            );
          }
        }
      }

      // ✅ NEW: Token contract modes are mutually exclusive
      if (isTokenContractPanelMode(panel)) {
        for (const other of TOKEN_CONTRACT_PANEL_MODES) {
          if (Number(other) !== Number(panel) && panelStore.isVisible(other)) {
            closePanelInternal(
              other,
              traceId,
              `openPanel:${navInvoker}:tokenContractMode:closeOther`,
            );
          }
        }
      }

      if (isRewardsGroupMode(panel)) {
        for (const other of REWARDS_GROUP_MODES) {
          if (Number(other) !== Number(panel) && panelStore.isVisible(other)) {
            closePanelInternal(
              other,
              traceId,
              `openPanel:${navInvoker}:rewardsMode:closeOther`,
            );
          }
        }
      }

      const stackBefore = getPersistedDisplayStackIds();
      const nextStack = pushIfStackMember(panel, traceId, `openPanel:${navInvoker}`);

      showDisplay(panel, navInvoker, parent);

      if (DEBUG_STACK) {
        const stackAfter = getPersistedDisplayStackIds();
        debugLog.log?.('[stack] openPanel post', {
          panel: { id: Number(panel), name: nameOf(panel) },
          invoker: navInvoker,
          stackBefore: toNamedStack(stackBefore),
          nextStack_fromPush: toNamedStack(nextStack),
          stackAfter_ref: toNamedStack(stackAfter),
        });
      }
    },
    [
      nextTraceId,
      tagInvoker,
      logAction,
      syncRoleAccountForPending,
      getPersistedDisplayStackIds,
      pushIfStackMember,
      showDisplay,
      debugLog,
      closePanelInternal,
    ],
  );

  function closePanel(panel: SP_COIN_DISPLAY, invoker?: string, arg?: unknown): void;
  function closePanel(invoker?: string, arg?: unknown): void;
  function closePanel(a?: SP_COIN_DISPLAY | string, b?: string | unknown, c?: unknown) {
    const traceId = nextTraceId();

    const hasPanel =
      typeof a === 'number' && Number.isFinite(Number(a)) && KNOWN.has(Number(a));

    if (hasPanel) {
      const panel = a as SP_COIN_DISPLAY;
      const invoker = b as string | undefined;
      const arg = c;

      const navInvoker = tagInvoker('NAV_CLOSE', invoker);

      logAction(traceId, 'closePanel (public) called', {
        panel: { id: Number(panel), name: nameOf(panel) },
        invoker: navInvoker,
        arg,
        isStackComponent: IS_STACK_COMPONENT.has(Number(panel)),
      });

      // ✅ If closing TOKEN_CONTRACT_PANEL, also close its mode children
      if (Number(panel) === Number(SP_COIN_DISPLAY.TOKEN_CONTRACT_PANEL)) {
        for (const child of TOKEN_CONTRACT_PANEL_MODES) {
          if (panelStore.isVisible(child)) {
            closePanelInternal(
              child,
              traceId,
              `closePanel:${navInvoker}:tokenContractPanel:closeChild`,
            );
          }
        }
      }

      const { nextStack } = removeIfStackMember(panel, traceId, `closePanel:${navInvoker}`);

      const hideInvoker =
        ALLOW_EMPTY_GLOBAL_OVERLAY && isGlobalOverlay(panel) && nextStack.length === 0
          ? tagHideInvoker(invoker)
          : navInvoker;

      hideDisplay(panel, hideInvoker, arg);
      return;
    }

    const invoker = (typeof a === 'string' ? a : undefined) as string | undefined;
    const arg = b as unknown;

    const navInvoker = tagInvoker('NAV_CLOSE', invoker ?? 'closePanel:pop-top');

    logAction(traceId, 'closePanel (legacy pop-top) called', {
      invoker: navInvoker,
      arg,
    });

    const { popped, stackBefore, nextStack } = popTop(traceId, `closePanel:${navInvoker}`);
    if (!popped) {
      logAction(traceId, 'closePanel pop-top noop (stack empty)', {
        stackBefore: toNamedStack(stackBefore),
      });
      return;
    }

    logAction(traceId, 'closePanel pop-top will hide popped', {
      popped: { id: Number(popped), name: nameOf(popped) },
      nextStack: toNamedStack(nextStack),
    });

    const hideInvoker =
      ALLOW_EMPTY_GLOBAL_OVERLAY && isGlobalOverlay(popped) && nextStack.length === 0
        ? tagHideInvoker(invoker)
        : navInvoker;

    hideDisplay(popped, hideInvoker, arg);
  }

  /* ------------------------------ derived -------------------------------- */

  const activeMainOverlay = useMemo<SP_COIN_DISPLAY | null>(() => {
    for (const id of overlays) if (visibilityMap[id]) return id;
    return null;
  }, [visibilityMap, overlays]);

  const isTokenScrollVisible = useMemo(
    () =>
      visibilityMap[SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL] ||
      visibilityMap[SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL] ||
      visibilityMap[SP_COIN_DISPLAY.TOKEN_CONTRACT_PANEL],
    [visibilityMap],
  );

  const dumpNavStack = useCallback(
    (tag?: string): void => {
      const title = `[PanelTree] displayStack${tag ? ` (${tag})` : ''}`;

      // eslint-disable-next-line no-console
      console.groupCollapsed(title);

      const persistedRaw = (exchangeContext as any)?.settings?.displayStack ?? [];
      const persistedIdsFromRef = getPersistedDisplayStackIds();
      const hydratedIdsFromContext = readPersistedIdsFromContext();

      // eslint-disable-next-line no-console
      console.log('[PanelTree] displayStack (persisted raw) =', persistedRaw);
      // eslint-disable-next-line no-console
      console.log(
        '[PanelTree] displayStackIds (ref) =',
        persistedIdsFromRef.map(Number),
        toNamedStack(persistedIdsFromRef),
      );
      // eslint-disable-next-line no-console
      console.log(
        '[PanelTree] displayStackIds (rehydrate from context) =',
        hydratedIdsFromContext.map(Number),
        toNamedStack(hydratedIdsFromContext),
      );

      if (DEBUG_STACK) {
        const rawIds = normalizeDisplayStackNodesToIds(persistedRaw);
        const dropped = rawIds.filter(
          (id) =>
            Number.isFinite(Number(id)) &&
            (NON_INDEXED.has(Number(id)) || !IS_STACK_COMPONENT.has(Number(id))),
        );

        // eslint-disable-next-line no-console
        console.log(
          '[PanelTree][stack-debug] rawIds =',
          rawIds.map(Number),
          toNamedStack(rawIds as any),
        );
        // eslint-disable-next-line no-console
        console.log(
          '[PanelTree][stack-debug] droppedByGate =',
          dropped.map(Number),
          toNamedStack(dropped as any),
        );
      }

      // eslint-disable-next-line no-console
      console.groupEnd();
    },
    [exchangeContext, getPersistedDisplayStackIds, readPersistedIdsFromContext],
  );

  return {
    activeMainOverlay,
    isVisible,
    isTokenScrollVisible,
    getPanelChildren,

    // ✅ stack-aware navigation API
    openPanel,
    closePanel,

    dumpNavStack,
  };
}
