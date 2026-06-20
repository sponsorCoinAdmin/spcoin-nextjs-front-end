// File: lib/context/exchangeContext/panelTree/panelTreeCallbacks.ts
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
import { appendDebugTrace } from '@/lib/utils/debugTrace';
import {
  applyGlobalRadio,
  ensureOneGlobalOverlayVisible,
  restorePrevRadioMember,
  type RadioGroup,
} from './panelTreeRadioController';

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_TREE === 'true';

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
        console.warn('[panelTreeCallbacks] displayStack non-object item (ignored):', item);
      }
      continue;
    }
    if (!('id' in item)) {
      if (DEBUG) {
        // eslint-disable-next-line no-console
        console.warn('[panelTreeCallbacks] displayStack node missing id (ignored):', item);
      }
      continue;
    }
    ids.push(Number((item as DISPLAY_STACK_NODE).id));
  }
  return ids.filter((x) => Number.isFinite(x)).map((x) => x as SP_COIN_DISPLAY);
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
  isGlobalOverlay: (p: SP_COIN_DISPLAY) => boolean;
  withName: (e: PanelEntry) => PanelEntry;
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
    isGlobalOverlay,
    withName,
    setExchangeContext,
  } = deps;

  const isPendingRewards = (p: SP_COIN_DISPLAY) =>
    Number(p) === Number(SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS);

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
    { name: 'MAIN_RADIO_OVERLAY_PANELS', members: overlays },
  ];

  /* ---------------- open ---------------- */

  const openPanel = (
    panel: SP_COIN_DISPLAY,
    invoker?: string,
    _parent?: SP_COIN_DISPLAY,
  ) => {
    logAction('openPanel', panel, invoker);
    appendDebugTrace(`[callbacks:openPanel] ${(SP_COIN_DISPLAY as any)[panel]}`, { panel: Number(panel), invoker, isGlobal: overlays.some((o) => Number(o) === Number(panel)), inKnown: known.has(Number(panel)) });
    if (!known.has(Number(panel))) return;

    // Pending Rewards: pure visibility toggle (no radio, no stack).
    if (isPendingRewards(panel)) {
      schedule(() => {
        setExchangeContext((prev) => {
          const flat0 = flattenPanelTree(
            (prev as any)?.settings?.spCoinPanelTree,
            known,
          );
          let next = ensurePanelPresent(flat0, SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS);
          next = setVisible(next, SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS, true, withName);
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

        let flat = ensurePanelPresent(flat0, panel);

        if (typeof _parent === 'number' && Number.isFinite(Number(_parent))) {
          flat = ensurePanelPresent(flat, _parent);
          flat = setVisible(flat, _parent, true, withName);
        }

        if (isGlobalOverlay(panel)) {
          // Atomically show target and close all other radio members.
          const next = applyGlobalRadio(flat, overlays, panel, withName);
          safeDiffAndPublish(toVisibilityMap(flat0), toVisibilityMap(next));
          return writeFlatTree(prev as any, next) as any;
        }

        const next = flat.map((e) =>
          e.panel === panel ? { ...withName(e), visible: true } : e,
        );
        safeDiffAndPublish(toVisibilityMap(flat0), toVisibilityMap(next));
        return writeFlatTree(prev as any, next) as any;
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
    appendDebugTrace(`[callbacks:closePanel] ${(SP_COIN_DISPLAY as any)[panel]}`, { panel: Number(panel), invoker, isGlobal: overlays.some((o) => Number(o) === Number(panel)), inKnown: known.has(Number(panel)) });
    if (!known.has(Number(panel))) return;

    // Pending Rewards: pure visibility toggle OFF (no pop/restore).
    if (isPendingRewards(panel)) {
      schedule(() => {
        setExchangeContext((prev) => {
          const flat0 = flattenPanelTree(
            (prev as any)?.settings?.spCoinPanelTree,
            known,
          );
          let next = ensurePanelPresent(flat0, SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS);
          next = setVisible(next, SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS, false, withName);
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

        const panelToClose = panel;
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
            if (!restoredResult.restored) {
              // all closed is allowed
            } else if (!ALLOW_EMPTY_GLOBAL_OVERLAY) {
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
