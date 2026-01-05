// File: @/lib/context/exchangeContext/panelTree/panelTreeCallbacks.ts
'use client';

import type React from 'react';
import { SP_COIN_DISPLAY } from '@/lib/structure';

import type { PanelEntry } from './panelTreePersistence';
import {
  flattenPanelTree,
  ensurePanelPresent,
  toVisibilityMap,
  writeFlatTree,
} from './panelTreePersistence';

import { schedule, logAction } from './panelTreeDebug';
import {
  applyGlobalRadio,
  ensureOneGlobalOverlayVisible,
  restorePrevRadioMember,
  type RadioGroup,
} from './panelTreeRadioController';

import {
  closeManageBranch,
  setScopedRadio,
  pickSponsorParent,
  ensureManageContainerAndDefaultChild,
  type ManageScopeConfig,
} from './panelTreeManageScope';

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_TREE === 'true';

/**
 * ✅ If true, allows ALL global overlays to be closed (no forced fallback).
 * If false, legacy behavior remains: at least one overlay stays visible.
 */
const ALLOW_EMPTY_GLOBAL_OVERLAY =
  process.env.NEXT_PUBLIC_ALLOW_EMPTY_GLOBAL_OVERLAY === 'true';

/* ---------------- POP detection ---------------- */
function isPopInvoker(invoker?: unknown) {
  if (typeof invoker !== 'string' || !invoker) return false;

  const s = invoker.trim();

  if (s.startsWith('NAV_CLOSE:')) return true;
  if (s.startsWith('NAV_POP:')) return true;

  if (s.startsWith('HIDE:')) return false;

  return (
    s.includes('closePanel') ||
    s.includes('persist-pop') ||
    s.includes('useOverlayCloseHandler') ||
    s.includes('HeaderController') ||
    s.includes('HeaderX') ||
    s.includes('TradeContainerHeader')
  );
}

/* ---------------- displayStack normalize ---------------- */

type DISPLAY_STACK_NODE = { id: SP_COIN_DISPLAY; name: string };

function displayStackNodesToIdsStrict(raw: unknown): SP_COIN_DISPLAY[] {
  if (!Array.isArray(raw)) return [];

  const ids: number[] = [];
  for (const item of raw as any[]) {
    if (!item || typeof item !== 'object') {
      if (DEBUG) {
        // eslint-disable-next-line no-console
        console.warn(
          '[panelTreeCallbacks] displayStack contains non-object item (ignored):',
          item,
        );
      }
      continue;
    }

    if (!('id' in item)) {
      if (DEBUG) {
        // eslint-disable-next-line no-console
        console.warn(
          '[panelTreeCallbacks] displayStack node missing id (ignored):',
          item,
        );
      }
      continue;
    }

    ids.push(Number((item as DISPLAY_STACK_NODE).id));
  }

  return ids
    .filter((x) => Number.isFinite(x))
    .map((x) => x as SP_COIN_DISPLAY);
}

/* ---------------- tiny helpers ---------------- */

function setVisible(
  flat: PanelEntry[],
  panel: SP_COIN_DISPLAY,
  visible: boolean,
  withName: (e: PanelEntry) => PanelEntry,
) {
  const n = Number(panel);
  return flat.map((e) =>
    Number(e.panel) === n ? { ...withName(e), visible } : e,
  );
}

/* ---------------- types ---------------- */

export type SetExchangeContextFn<TState = any> = (
  updater: (prev: TState) => TState,
  hookName?: string,
) => void;

export type PanelTreeCallbacksDeps = {
  known: Set<number>;
  overlays: SP_COIN_DISPLAY[];

  manageCfg: ManageScopeConfig;
  manageScoped: SP_COIN_DISPLAY[];
  manageScopedSet: Set<number>;

  isGlobalOverlay: (p: SP_COIN_DISPLAY) => boolean;
  isManageRadioChild: (p: SP_COIN_DISPLAY) => boolean;
  isManageAnyChild: (p: SP_COIN_DISPLAY) => boolean;

  withName: (e: PanelEntry) => PanelEntry;

  sponsorParentRef: React.MutableRefObject<SP_COIN_DISPLAY | null>;
  manageScopedHistoryRef: React.MutableRefObject<SP_COIN_DISPLAY[]>;

  getActiveManageScoped: (flat: PanelEntry[]) => SP_COIN_DISPLAY | null;
  pushManageScopedHistory: (
    prevScoped: SP_COIN_DISPLAY | null,
    nextScoped: SP_COIN_DISPLAY,
  ) => void;

  diffAndPublish?: (
    prev: Record<number, boolean>,
    next: Record<number, boolean>,
  ) => void;

  setExchangeContext: SetExchangeContextFn;
};

/* ---------------- factory ---------------- */

export function createPanelTreeCallbacks(deps: PanelTreeCallbacksDeps) {
  const {
    known,
    overlays,
    manageCfg,
    // ✅ removed: manageScoped (unused in new model)
    isGlobalOverlay,
    isManageRadioChild,
    isManageAnyChild,
    withName,
    sponsorParentRef,
    manageScopedHistoryRef,
    getActiveManageScoped,
    pushManageScopedHistory,
    setExchangeContext,
  } = deps;

  // Keep imported symbol used even in the new model (avoid TS "declared but never used")
  void ensureManageContainerAndDefaultChild;

  /**
   * ✅ Local-only panel that must NEVER be treated as:
   * - a stack component
   * - a global overlay radio member
   * - a manage branch member that gets auto-closed
   *
   * BUT: it still must be able to flip visibility via showPanel/hidePanel,
   * which may call openPanel/closePanel internally.
   */
  const isPendingRewards = (p: SP_COIN_DISPLAY) =>
    Number(p) === Number(SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS);

  /**
   * ✅ Wrap manage-branch membership so closeManageBranch can never touch Pending Rewards.
   */
  const isManageAnyChildNoPending = (p: SP_COIN_DISPLAY) =>
    !isPendingRewards(p) && isManageAnyChild(p);

  let warned = false;
  const safeDiffAndPublish = (
    prev: Record<number, boolean>,
    next: Record<number, boolean>,
  ) => {
    const fn = deps.diffAndPublish;
    if (typeof fn === 'function') return fn(prev, next);

    if (DEBUG && !warned) {
      warned = true;
      // eslint-disable-next-line no-console
      console.warn('[panelTreeCallbacks] diffAndPublish missing (noop).');
    }
  };

  const radioGroupsPriority: RadioGroup[] = [
    { name: 'MAIN_OVERLAY_GROUP', members: overlays },
  ];

  /* ---------------- open ---------------- */

  const openPanel = (
    panel: SP_COIN_DISPLAY,
    invoker?: string,
    parent?: SP_COIN_DISPLAY,
  ) => {
    logAction('openPanel', panel, invoker);
    if (!known.has(Number(panel))) return;

    // ✅ Pending Rewards: treat "open" as a pure visibility toggle (NO radio, NO stack).
    if (isPendingRewards(panel)) {
      schedule(() => {
        setExchangeContext((prev) => {
          const flat0 = flattenPanelTree(
            (prev as any)?.settings?.spCoinPanelTree,
            known,
          );

          let next = ensurePanelPresent(flat0, SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS);
          next = setVisible(
            next,
            SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS,
            true,
            withName,
          );

          safeDiffAndPublish(toVisibilityMap(flat0), toVisibilityMap(next));
          return writeFlatTree(prev as any, next) as any;
        });
      });
      return;
    }

    schedule(() => {
      setExchangeContext((prev) => {
        const flat0 = flattenPanelTree(
          (prev as any)?.settings?.spCoinPanelTree,
          known,
        );

        const openingGlobal = isGlobalOverlay(panel);

        const openingManageContainer =
          Number(panel) === Number(manageCfg.manageContainer);

        const openingSponsorDetail =
          Number(panel) === Number(manageCfg.manageSponsorPanel);

        const openingManageRadioChild = isManageRadioChild(panel);

        let flat = ensurePanelPresent(flat0, panel);

        if (openingSponsorDetail) {
          sponsorParentRef.current = pickSponsorParent(
            flat0,
            manageCfg,
            sponsorParentRef,
            parent,
          );

          flat = ensurePanelPresent(flat, manageCfg.manageSponsorPanel);

          const next = applyGlobalRadio(
            flat,
            overlays,
            manageCfg.manageSponsorPanel,
            withName,
          ).map((e) =>
            e.panel === manageCfg.manageSponsorPanel
              ? { ...withName(e), visible: true }
              : e,
          );

          safeDiffAndPublish(toVisibilityMap(flat0), toVisibilityMap(next));
          return writeFlatTree(prev as any, next) as any;
        }

        if (openingManageRadioChild) {
          const prevScoped = getActiveManageScoped(flat0);
          pushManageScopedHistory(prevScoped, panel);

          flat = applyGlobalRadio(flat, overlays, panel, withName);

          const next = setScopedRadio(
            flat,
            panel,
            manageCfg,
            isManageRadioChild,
            withName,
            false,
          );

          safeDiffAndPublish(toVisibilityMap(flat0), toVisibilityMap(next));
          return writeFlatTree(prev as any, next) as any;
        }

        if (openingManageContainer) {
          const next = applyGlobalRadio(
            flat,
            overlays,
            manageCfg.manageContainer,
            withName,
          );

          safeDiffAndPublish(toVisibilityMap(flat0), toVisibilityMap(next));
          return writeFlatTree(prev as any, next) as any;
        }

        if (openingGlobal) {
          let next = applyGlobalRadio(flat, overlays, panel, withName);

          // ✅ When switching away from Manage, closeManageBranch must NOT touch Pending Rewards.
          if (Number(panel) !== Number(manageCfg.manageContainer)) {
            manageScopedHistoryRef.current = [];
            next = closeManageBranch(
              next,
              manageCfg,
              isManageAnyChildNoPending,
              withName,
            );
          }

          safeDiffAndPublish(toVisibilityMap(flat0), toVisibilityMap(next));
          return writeFlatTree(prev as any, next) as any;
        }

        const nextFlat = flat.map((e) =>
          e.panel === panel ? { ...withName(e), visible: true } : e,
        );

        safeDiffAndPublish(toVisibilityMap(flat0), toVisibilityMap(nextFlat));
        return writeFlatTree(prev as any, nextFlat) as any;
      });
    });
  };

  /* ---------------- close ---------------- */

  const closePanel = (
    panel: SP_COIN_DISPLAY,
    invoker?: string,
    _unused?: unknown,
  ) => {
    logAction('closePanel', panel, invoker);
    if (!known.has(Number(panel))) return;

    // ✅ Pending Rewards: treat "close" as pure visibility toggle OFF (NO pop/restore).
    if (isPendingRewards(panel)) {
      schedule(() => {
        setExchangeContext((prev) => {
          const flat0 = flattenPanelTree(
            (prev as any)?.settings?.spCoinPanelTree,
            known,
          );

          let next = ensurePanelPresent(flat0, SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS);
          next = setVisible(
            next,
            SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS,
            false,
            withName,
          );

          safeDiffAndPublish(toVisibilityMap(flat0), toVisibilityMap(next));
          return writeFlatTree(prev as any, next) as any;
        });
      });
      return;
    }

    schedule(() => {
      setExchangeContext((prev) => {
        const flat0 = flattenPanelTree(
          (prev as any)?.settings?.spCoinPanelTree,
          known,
        );

        const panelToClose: SP_COIN_DISPLAY = panel;

        const displayStackIds = displayStackNodesToIdsStrict(
          (prev as any)?.settings?.displayStack,
        );

        let next: PanelEntry[] = flat0;

        if (isPopInvoker(invoker)) {
          const restoredResult = restorePrevRadioMember({
            flatIn: flat0,
            displayStack: displayStackIds,
            closing: panelToClose,
            radioGroupsPriority,
            withName,
          });

          next = restoredResult.nextFlat;

          if (isGlobalOverlay(panelToClose)) {
            if (Number(panelToClose) === Number(manageCfg.manageContainer)) {
              manageScopedHistoryRef.current = [];
              next = closeManageBranch(
                next,
                manageCfg,
                isManageAnyChildNoPending,
                withName,
              );
            }

            // ✅ Allow "close all overlays" when enabled
            if (!ALLOW_EMPTY_GLOBAL_OVERLAY) {
              next = ensureOneGlobalOverlayVisible(
                next,
                overlays,
                SP_COIN_DISPLAY.TRADING_STATION_PANEL,
                withName,
              );
            }
          }
        } else {
          next = flat0.map((e) =>
            e.panel === panelToClose ? { ...withName(e), visible: false } : e,
          );
        }

        safeDiffAndPublish(toVisibilityMap(flat0), toVisibilityMap(next));
        return writeFlatTree(prev as any, next) as any;
      });
    });
  };

  return { openPanel, closePanel };
}
