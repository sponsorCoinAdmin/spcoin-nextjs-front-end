// File: @/lib/context/exchangeContext/panelTree/panelTreeCallbacks.ts
'use client';

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

/* ---------------- header close guard ---------------- */

const HEADER_CLOSE_LOCK_MS = 140;
let headerCloseLockUntil = 0;

function isHeaderCloseInvoker(invoker?: string) {
  if (!invoker) return false;
  return (
    invoker.includes('HeaderX') ||
    invoker.includes('HeaderController') ||
    invoker.includes('TopBar') ||
    invoker.includes('TradeContainerHeader')
  );
}

function isChainedCloseInvoker(invoker?: string) {
  if (!invoker) return false;
  return invoker.includes('useOverlayCloseHandler');
}

/**
 * Priority close-top chooser (VISIBILITY-BASED).
 *
 * If callers pass the true leaf (your NAV displayStack logic), we close exactly what
 * was requested and DO NOT re-derive a different "top" here.
 */
function deriveTopFromVisibility(opts: {
  flat: PanelEntry[];
  overlays: SP_COIN_DISPLAY[];
  manageScoped: SP_COIN_DISPLAY[];
  manageCfg: ManageScopeConfig;
}) {
  const { flat, overlays, manageScoped, manageCfg } = opts;
  const m = toVisibilityMap(flat);

  // 1) Sponsor detail wins
  if (m[Number(manageCfg.manageSponsorPanel)]) return manageCfg.manageSponsorPanel;

  // 2) Active manage scoped child (radio)
  for (const id of manageScoped) {
    if (m[Number(id)]) return id;
  }

  // 3) Active global overlay
  for (const id of overlays) {
    if (m[Number(id)]) return id;
  }

  return null;
}

/* ---------------- displayStack normalize ---------------- */

function normalizeDisplayStackNodesToIds(raw: unknown): SP_COIN_DISPLAY[] {
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
}

/* ---------------- factory ---------------- */

export function createPanelTreeCallbacks(deps: PanelTreeCallbacksDeps) {
  const {
    known,
    overlays,
    manageCfg,
    manageScoped,
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
    // Most-nested / highest priority first
    { name: 'MANAGE_SCOPED', members: manageScoped },
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

          flat = ensurePanelPresent(flat, manageCfg.manageContainer);
          flat = applyGlobalRadio(
            flat,
            overlays,
            manageCfg.manageContainer,
            withName,
          );

          const prevScoped = getActiveManageScoped(flat0);
          pushManageScopedHistory(
            prevScoped,
            sponsorParentRef.current ?? manageCfg.defaultManageChild,
          );

          let next = setScopedRadio(
            flat,
            sponsorParentRef.current ?? manageCfg.defaultManageChild,
            manageCfg,
            isManageRadioChild,
            withName,
            true,
          );

          next = ensurePanelPresent(next, manageCfg.manageSponsorPanel);
          next = next.map((e) =>
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

          flat = ensurePanelPresent(flat, manageCfg.manageContainer);
          flat = applyGlobalRadio(
            flat,
            overlays,
            manageCfg.manageContainer,
            withName,
          );

          const next = setScopedRadio(
            flat,
            panel,
            manageCfg,
            isManageRadioChild,
            withName,
            true,
          );

          safeDiffAndPublish(toVisibilityMap(flat0), toVisibilityMap(next));
          return writeFlatTree(prev as any, next) as any;
        }

        if (openingManageContainer) {
          flat = applyGlobalRadio(
            ensurePanelPresent(flat, manageCfg.manageContainer),
            overlays,
            manageCfg.manageContainer,
            withName,
          );

          const setScoped = (fi: PanelEntry[], p: SP_COIN_DISPLAY) =>
            setScopedRadio(fi, p, manageCfg, isManageRadioChild, withName, true);

          const next = ensureManageContainerAndDefaultChild(
            flat,
            manageCfg,
            withName,
            setScoped,
          );

          safeDiffAndPublish(toVisibilityMap(flat0), toVisibilityMap(next));
          return writeFlatTree(prev as any, next) as any;
        }

        if (openingGlobal) {
          let next = applyGlobalRadio(flat, overlays, panel, withName);

          if (Number(panel) !== Number(manageCfg.manageContainer)) {
            manageScopedHistoryRef.current = [];
            next = closeManageBranch(next, manageCfg, isManageAnyChild, withName);
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

    const now = Date.now();
    if (now < headerCloseLockUntil && isChainedCloseInvoker(invoker)) return;

    schedule(() => {
      setExchangeContext((prev) => {
        const flat0 = flattenPanelTree(
          (prev as any)?.settings?.spCoinPanelTree,
          known,
        );

        // Close EXACTLY what the caller requested.
        // Only legacy header-close-of-container is allowed to "derive top".
        let panelToClose: SP_COIN_DISPLAY = panel;

        if (
          isHeaderCloseInvoker(invoker) &&
          Number(panel) === Number(manageCfg.manageContainer)
        ) {
          headerCloseLockUntil = now + HEADER_CLOSE_LOCK_MS;

          const derived = deriveTopFromVisibility({
            flat: flat0,
            overlays,
            manageScoped,
            manageCfg,
          });

          if (derived) panelToClose = derived;
        }

        // displayStack drives "restore previous radio member" behavior
        const displayStackIds = normalizeDisplayStackNodesToIds(
          (prev as any)?.settings?.displayStack,
        );

        // Hide + (if needed) restore previous radio member (nested-first priority)
        const restoredResult = restorePrevRadioMember({
          flatIn: flat0,
          displayStack: displayStackIds,
          closing: panelToClose,
          radioGroupsPriority,
          withName,
        });

        let next = restoredResult.nextFlat;

        // If closing a global overlay, enforce fallback and possibly close manage branch.
        // NOTE: restorePrevRadioMember may already have restored another overlay in the same group.
        if (isGlobalOverlay(panelToClose)) {
          if (Number(panelToClose) === Number(manageCfg.manageContainer)) {
            manageScopedHistoryRef.current = [];
            next = closeManageBranch(next, manageCfg, isManageAnyChild, withName);
          }

          next = ensureOneGlobalOverlayVisible(
            next,
            overlays,
            SP_COIN_DISPLAY.TRADING_STATION_PANEL,
            withName,
          );
        }

        safeDiffAndPublish(toVisibilityMap(flat0), toVisibilityMap(next));
        return writeFlatTree(prev as any, next) as any;
      });
    });
  };

  return { openPanel, closePanel };
}
