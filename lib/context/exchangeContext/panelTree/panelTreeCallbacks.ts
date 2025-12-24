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
import { applyGlobalRadio } from './panelTreeRadio';

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

function hasAnyOverlayVisible(
  map: Record<number, boolean>,
  overlays: SP_COIN_DISPLAY[],
) {
  for (const id of overlays) if (map[Number(id)]) return true;
  return false;
}

function ensureOneGlobalOverlayVisible(
  flat: PanelEntry[],
  overlays: SP_COIN_DISPLAY[],
  fallback: SP_COIN_DISPLAY,
  withName: (e: PanelEntry) => PanelEntry,
) {
  const m = toVisibilityMap(flat);
  if (hasAnyOverlayVisible(m, overlays)) return flat;

  let next = ensurePanelPresent(flat, fallback);
  next = applyGlobalRadio(next, overlays, fallback, withName);
  return next;
}

/**
 * Old (priority) close-top chooser.
 * Kept as a fallback if branch traversal can’t determine a top.
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

/**
 * Branch design:
 * - start at MAIN_TRADING_PANEL
 * - follow first visible child in CHILDREN[] order
 * - return the last node in that path (the “top” of the branch)
 */
function deriveTopFromBranch(opts: {
  flat: PanelEntry[];
  manageCfg: ManageScopeConfig;
  known: Set<number>;
}): SP_COIN_DISPLAY | null {
  const { flat, manageCfg, known } = opts;
  const m = toVisibilityMap(flat);

  const ROOT: SP_COIN_DISPLAY = SP_COIN_DISPLAY.MAIN_TRADING_PANEL;

  // If root isn’t visible (it should be), we can’t traverse safely.
  if (!m[Number(ROOT)]) return null;

  const seen = new Set<number>();
  let current: SP_COIN_DISPLAY | null = ROOT;
  let last: SP_COIN_DISPLAY = ROOT;

  while (current != null) {
    const curId: number = Number(current);
    if (seen.has(curId)) {
      // cycle: bail out and use what we have
      return last;
    }
    seen.add(curId);

    last = current;

    const kids: SP_COIN_DISPLAY[] =
      (manageCfg.children?.[curId] as SP_COIN_DISPLAY[] | undefined) ?? [];

    // first visible child in order
    let next: SP_COIN_DISPLAY | null = null;
    for (const k of kids) {
      const kn: number = Number(k);
      if (!known.has(kn)) continue;
      if (m[kn]) {
        next = k;
        break;
      }
    }

    if (!next) break;
    current = next;
  }

  // If the branch is only root, treat as “nothing to close”
  return Number(last) === Number(ROOT) ? null : last;
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

  // Close "top" derived from BRANCH when invoker is a header close.
  const closeTopPanel = (invoker?: string) => {
    closePanel(manageCfg.manageContainer, invoker ?? 'HeaderX');
  };

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

        let panelToClose: SP_COIN_DISPLAY = panel;

        if (isHeaderCloseInvoker(invoker)) {
          headerCloseLockUntil = now + HEADER_CLOSE_LOCK_MS;

          // Branch-first: close the last node on the computed branch.
          const branchTop = deriveTopFromBranch({
            flat: flat0,
            manageCfg,
            known,
          });

          if (branchTop) {
            panelToClose = branchTop;
          } else {
            // Fallback to old priority-based selection.
            const derived = deriveTopFromVisibility({
              flat: flat0,
              overlays,
              manageScoped,
              manageCfg,
            });
            if (derived) panelToClose = derived;
          }
        }

        let next = flat0.map((e) =>
          e.panel === panelToClose ? { ...withName(e), visible: false } : e,
        );

        // If closing a global overlay, enforce fallback and possibly close manage branch.
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

  return { openPanel, closePanel, closeTopPanel };
}
