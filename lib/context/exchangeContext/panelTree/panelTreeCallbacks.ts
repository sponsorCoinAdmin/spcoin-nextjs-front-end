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
import { applyGlobalRadio, clearGlobalRadio } from './panelTreeRadio';

import {
  closeManageBranch,
  setScopedRadio,
  pickSponsorParent,
  ensureManageContainerAndDefaultChild,
  type ManageScopeConfig,
} from './panelTreeManageScope';

import { pushNav, removeNav, popTopIfMatches, peekNav } from './panelNavStack';

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

  activatePanel: (flat0: PanelEntry[], target: SP_COIN_DISPLAY) => PanelEntry[];

  diffAndPublish?: (
    prev: Record<number, boolean>,
    next: Record<number, boolean>,
  ) => void;

  setExchangeContext: SetExchangeContextFn;
};

/**
 * Header close can trigger multiple closePanel calls (e.g. HeaderController + overlay close handler).
 * We want EXACTLY one stack pop per click.
 */
const HEADER_CLOSE_LOCK_MS = 140;
let headerCloseLockUntil = 0;

function isHeaderCloseInvoker(invoker?: string) {
  if (!invoker) return false;
  return (
    invoker.includes('HeaderX') ||
    invoker.includes('HeaderController:onClose') ||
    invoker.includes('HeaderController') ||
    invoker.includes('TopBar') ||
    invoker.includes('TradeContainerHeader')
  );
}

function isChainedCloseInvoker(invoker?: string) {
  if (!invoker) return false;
  // This is the one from your logs that causes the second pop.
  return invoker.includes('useOverlayCloseHandler');
}

function hasAnyOverlayVisible(
  map: Record<number, boolean>,
  overlays: SP_COIN_DISPLAY[],
) {
  for (const id of overlays) if (map[Number(id)]) return true;
  return false;
}

/**
 * ✅ Safety: never allow the app to end up with "0 overlays visible".
 * This is exactly the state you saw: activeOverlaysFromMap: Array(0).
 *
 * NOTE:
 * This does NOT "default a manage radio group" on close.
 * It only guarantees a valid *global overlay* is visible (fallback trading).
 */
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

export function createPanelTreeCallbacks(deps: PanelTreeCallbacksDeps) {
  const {
    known,
    overlays,
    manageCfg,
    isGlobalOverlay,
    isManageRadioChild,
    isManageAnyChild,
    withName,
    sponsorParentRef,
    manageScopedHistoryRef,
    getActiveManageScoped,
    pushManageScopedHistory,
    activatePanel,
    setExchangeContext,
  } = deps;

  // ✅ Guard: prevent runtime crash if caller forgot diffAndPublish
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
      console.warn(
        '[panelTreeCallbacks] diffAndPublish missing; using no-op (panelStore may still be synced elsewhere).',
      );
    }
  };

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

        const openingManageContainer =
          Number(panel) === Number(manageCfg.manageContainer);
        const openingGlobal = isGlobalOverlay(panel);
        const openingSponsorDetail =
          Number(panel) === Number(manageCfg.manageSponsorPanel);
        const openingManageRadioChild = isManageRadioChild(panel);

        // stack bookkeeping (used mainly for header-close + debug tooling)
        pushNav(panel);

        if (openingSponsorDetail) {
          sponsorParentRef.current = pickSponsorParent(
            flat0,
            manageCfg,
            sponsorParentRef,
            parent,
          );
        }

        let flat = ensurePanelPresent(flat0, panel);

        if (openingSponsorDetail) {
          const parentPanel =
            sponsorParentRef.current ?? manageCfg.defaultManageChild;

          flat = ensurePanelPresent(flat, manageCfg.manageContainer);
          flat = applyGlobalRadio(
            flat,
            overlays,
            manageCfg.manageContainer,
            withName,
          );

          const prevScoped = getActiveManageScoped(flat0);
          pushManageScopedHistory(prevScoped, parentPanel);

          let next = setScopedRadio(
            flat,
            parentPanel,
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

          let next = setScopedRadio(
            flat,
            panel,
            manageCfg,
            isManageRadioChild,
            withName,
            true,
          );

          // Sponsor detail OFF
          next = next.map((e) =>
            e.panel === manageCfg.manageSponsorPanel
              ? { ...withName(e), visible: false }
              : e,
          );

          safeDiffAndPublish(toVisibilityMap(flat0), toVisibilityMap(next));
          return writeFlatTree(prev as any, next) as any;
        }

        if (openingManageContainer) {
          flat = ensurePanelPresent(flat, manageCfg.manageContainer);
          flat = applyGlobalRadio(
            flat,
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

  /**
   * closeTopPanel(): compatibility helper.
   */
  const closeTopPanel = (invoker?: string) => {
    const top = peekNav();
    if (!top) return;
    closePanel(top, invoker ?? 'HeaderX');
  };

  const closePanel = (
    panel: SP_COIN_DISPLAY,
    invoker?: string,
    _unused?: unknown,
  ) => {
    logAction('closePanel', panel, invoker);
    if (!known.has(Number(panel))) return;

    const now = Date.now();

    // ✅ If a header close just happened, ignore the chained close handler that fires right after.
    if (now < headerCloseLockUntil && isChainedCloseInvoker(invoker)) {
      if (DEBUG) {
        // eslint-disable-next-line no-console
        console.log('[panelTreeCallbacks] closePanel(ignored-by-header-lock)', {
          panel,
          invoker: invoker ?? null,
          lockUntil: headerCloseLockUntil,
        });
      }
      return;
    }

    // ✅ Header X rule: ALWAYS close stackTop (ignore passed-in panel if it isn't top).
    let panelToClose: SP_COIN_DISPLAY = panel;
    if (isHeaderCloseInvoker(invoker)) {
      headerCloseLockUntil = now + HEADER_CLOSE_LOCK_MS;

      const top = peekNav();
      if (top && known.has(Number(top))) {
        panelToClose = top;

        if (DEBUG && Number(panelToClose) !== Number(panel)) {
          // eslint-disable-next-line no-console
          console.log('[panelTreeCallbacks] header-close redirected to stackTop', {
            requested: panel,
            stackTop: panelToClose,
            invoker: invoker ?? null,
          });
        }
      }
    }

    // stack bookkeeping (kept for now)
    popTopIfMatches(panelToClose);
    removeNav(panelToClose);

    schedule(() => {
      setExchangeContext((prev) => {
        const flat0 = flattenPanelTree(
          (prev as any)?.settings?.spCoinPanelTree,
          known,
        );

        const closingManageContainer =
          Number(panelToClose) === Number(manageCfg.manageContainer);
        const closingGlobal = isGlobalOverlay(panelToClose);
        const closingSponsorDetail =
          Number(panelToClose) === Number(manageCfg.manageSponsorPanel);
        const closingManageRadioChild = isManageRadioChild(panelToClose);

        let next: PanelEntry[] = flat0;

        if (closingManageContainer) {
          manageScopedHistoryRef.current = [];
          next = closeManageBranch(
            flat0.map((e) =>
              e.panel === manageCfg.manageContainer
                ? { ...withName(e), visible: false }
                : e,
            ),
            manageCfg,
            isManageAnyChild,
            withName,
          );
        } else if (closingSponsorDetail) {
          // close sponsor detail only; underlying scoped parent remains
          next = flat0.map((e) =>
            e.panel === manageCfg.manageSponsorPanel
              ? { ...withName(e), visible: false }
              : e,
          );
        } else if (closingManageRadioChild) {
          // IMPORTANT: do NOT "default" another manage radio child on close.
          next = flat0
            .map((e) =>
              e.panel === panelToClose ? { ...withName(e), visible: false } : e,
            )
            .map((e) =>
              e.panel === manageCfg.manageSponsorPanel
                ? { ...withName(e), visible: false }
                : e,
            );
        } else if (closingGlobal) {
          const closingIsManage =
            Number(panelToClose) === Number(manageCfg.manageContainer);

          // hide just this overlay
          next = flat0.map((e) =>
            e.panel === panelToClose ? { ...withName(e), visible: false } : e,
          );

          // clear global radio flags (keeps invariants clean)
          next = clearGlobalRadio(next, overlays, withName);

          // if manage overlay closed, also close its branch
          if (closingIsManage) {
            manageScopedHistoryRef.current = [];
            next = closeManageBranch(next, manageCfg, isManageAnyChild, withName);
          }
        } else {
          next = flat0.map((e) =>
            e.panel === panelToClose ? { ...withName(e), visible: false } : e,
          );
        }

        // ✅ Restore underneath when appropriate (but never allow 0 overlays)
        const restore = peekNav();
        if (restore) next = activatePanel(next, restore);

        // ✅ The actual fix for your log:
        // never end with activeOverlaysFromMap: Array(0)
        next = ensureOneGlobalOverlayVisible(
          next,
          overlays,
          SP_COIN_DISPLAY.TRADING_STATION_PANEL,
          withName,
        );

        safeDiffAndPublish(toVisibilityMap(flat0), toVisibilityMap(next));
        return writeFlatTree(prev as any, next) as any;
      });
    });
  };

  return { openPanel, closePanel, closeTopPanel };
}
