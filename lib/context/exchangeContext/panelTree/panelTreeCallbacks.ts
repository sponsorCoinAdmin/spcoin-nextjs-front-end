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

/* ---------------- POP detection ----------------
 *
 * RULES (important):
 * - closePanel(...) may be used as:
 *    (A) HIDE ONLY  -> do NOT restore radio siblings
 *    (B) POP/CLOSE  -> HIDE + RESTORE (radio fallback), driven by displayStack
 *
 * We detect POP intent ONLY via invoker strings.
 * The new upstream convention tags invokers like:
 *   - "NAV_CLOSE:..."   (means: this close is stack-driven / pop-like)
 *   - "HIDE:..."        (means: hide-only)
 *
 * Keep backward compatibility for older callers that used substring checks.
 */
function isPopInvoker(invoker?: unknown) {
  if (typeof invoker !== 'string' || !invoker) return false;

  const s = invoker.trim();

  // ✅ New explicit tags (single-source-of-truth callers should use these)
  if (s.startsWith('NAV_CLOSE:')) return true;

  // (Optional future tag if you add it elsewhere)
  if (s.startsWith('NAV_POP:')) return true;

  // ✅ If explicitly tagged as HIDE, do not pop/restore.
  // (This prevents accidental restores if some invoker contains "closePanel" as text.)
  if (s.startsWith('HIDE:')) return false;

  // ✅ Back-compat: previous heuristics
  return (
    s.includes('closePanel') ||
    s.includes('persist-pop') ||
    s.includes('useOverlayCloseHandler') ||
    s.includes('HeaderController') ||
    s.includes('HeaderX') ||
    s.includes('TradeContainerHeader')
  );
}

/* ---------------- displayStack normalize ----------------
 *
 * ✅ STRICT MODE: displayStack is always:
 *   DISPLAY_STACK_NODE[] = [{ id: number, name: string }, ...]
 *
 * No more number[], no more {displayTypeId}.
 */
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

    schedule(() => {
      setExchangeContext((prev) => {
        const flat0 = flattenPanelTree(
          (prev as any)?.settings?.spCoinPanelTree,
          known,
        );

        const panelToClose: SP_COIN_DISPLAY = panel;

        // ✅ Strict: persisted settings.displayStack is DISPLAY_STACK_NODE[]
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
              next = closeManageBranch(next, manageCfg, isManageAnyChild, withName);
            }

            next = ensureOneGlobalOverlayVisible(
              next,
              overlays,
              SP_COIN_DISPLAY.TRADING_STATION_PANEL,
              withName,
            );
          }
        } else {
          // HIDE ONLY
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
