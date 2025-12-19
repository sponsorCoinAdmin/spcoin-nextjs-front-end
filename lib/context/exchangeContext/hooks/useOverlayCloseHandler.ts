// File: @/lib/context/exchangeContext/hooks/useOverlayCloseHandler.ts
'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_OVERLAY_CLOSE_HANDLER === 'true';

const debugLog = createDebugLogger(
  'useOverlayCloseHandler',
  DEBUG_ENABLED,
  LOG_TIME,
);

/**
 * List-style overlays
 *
 * These are the "scroll/list-select" overlays (token/recipient/agent)
 * that temporarily replace another overlay (e.g. a manage hub) and
 * should bounce back to that origin when closed.
 */
const LIST_OVERLAYS = new Set<SP_COIN_DISPLAY>([
  SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL,
  SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL,
  SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL,
  SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL,
]);

/**
 * Origin overlays for manage flows
 *
 * When a list overlay is launched from one of these panels, closing
 * the list overlay should restore the origin overlay instead of
 * always falling back to TRADING_STATION_PANEL.
 */
const MANAGE_SP_ORIGINS = new Set<SP_COIN_DISPLAY>([
  SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS,
  SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL,
  SP_COIN_DISPLAY.STAKING_SPCOINS_PANEL,
]);

const MANAGE_CONTAINER = SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS;
const MANAGE_DEFAULT_CHILD = SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL;

/**
 * useOverlayCloseHandler
 *
 * Centralized handler for "overlay close" behavior.
 */
export function useOverlayCloseHandler() {
  // NOTE: usePanelTree exposes `activeMainOverlay` as the single
  // "radio" overlay in the MAIN_OVERLAY_GROUP.
  const {
    activeMainOverlay,
    isVisible,
    getPanelChildren,
    openPanel,
    closePanel,
  } = usePanelTree();

  // Last overlay we saw (for transition detection)
  const prevOverlayRef = useRef<SP_COIN_DISPLAY | null>(null);

  // Where a list overlay was opened from (if applicable)
  const originOverlayRef = useRef<SP_COIN_DISPLAY | null>(null);

  const manageChildren = useMemo(() => {
    // Children of the MANAGE_SPONSORSHIPS container form a scoped radio group.
    // We rely on the registry via getPanelChildren.
    return getPanelChildren(MANAGE_CONTAINER);
  }, [getPanelChildren]);

  useEffect(() => {
    const prev = prevOverlayRef.current;
    const current = activeMainOverlay ?? null;

    if (prev === current) return;

    if (DEBUG_ENABLED) {
      debugLog.log?.('overlay change detected', { prev, next: current });
    }

    const prevIsList = !!prev && LIST_OVERLAYS.has(prev);
    const currIsList = !!current && LIST_OVERLAYS.has(current);

    // ───────────────── Entering a list overlay ─────────────────
    // From a non-list overlay → capture that overlay as the "origin".
    if (current && currIsList && !prevIsList && prev) {
      originOverlayRef.current = prev;

      if (DEBUG_ENABLED) {
        debugLog.log?.('captured origin overlay for list-select', {
          origin: prev,
          listOverlay: current,
        });
      }
    }

    // ───────────────── Leaving a list overlay ─────────────────
    // If we leave a list overlay and land on TRADING_STATION_PANEL,
    // but we know we came from a MANAGE_* origin, restore that origin.
    if (prev && prevIsList && !currIsList) {
      const origin = originOverlayRef.current;
      originOverlayRef.current = null;

      if (origin && MANAGE_SP_ORIGINS.has(origin)) {
        // Only override when we would otherwise land on the trading station.
        if (current === SP_COIN_DISPLAY.TRADING_STATION_PANEL) {
          if (DEBUG_ENABLED) {
            debugLog.log?.('restoring origin overlay after list-select close', {
              origin,
              fallback: current,
            });
          }

          openPanel(origin, 'useOverlayCloseHandler:restoreOriginOverlay');
        }
      }
    }

    prevOverlayRef.current = current;
  }, [activeMainOverlay, openPanel]);

  /**
   * Generic close handler used by TRADE_CONTAINER_HEADER close button / back button.
   */
  const handleCloseOverlay = useCallback(() => {
    const current = activeMainOverlay;
    if (!current) return;

    // ───────────────── Special-case: manage container close behavior ─────────────────
    // IMPORTANT:
    //   MANAGE_PENDING_REWARDS is a *sub-state* of the hub (row expander), not a radio
    //   child. So we must NOT close it when closing a scoped child (Sponsors list, etc.).
    //   Only close pending when we are already on the hub.
    if (current === MANAGE_CONTAINER) {
      const pendingVisible = isVisible(SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS);

      // Find the currently-visible manage child (scoped radio).
      const activeManageChild = manageChildren.find((p) => isVisible(p)) ?? null;

      // ✅ Priority 1: If we are on a non-default manage child, return to hub.
      // Do NOT touch pending here — it should remain open if it was open.
      if (activeManageChild && activeManageChild !== MANAGE_DEFAULT_CHILD) {
        if (DEBUG_ENABLED) {
          debugLog.log?.(
            'handleCloseOverlay: manage child -> hub (preserve pending)',
            {
              current,
              activeManageChild,
              defaultChild: MANAGE_DEFAULT_CHILD,
              pendingVisible,
            },
          );
        }

        closePanel(
          activeManageChild,
          'useOverlayCloseHandler:handleCloseOverlay(manage-child->hub)',
        );

        // Ensure hub is visible (and container stays open).
        openPanel(
          MANAGE_DEFAULT_CHILD,
          'useOverlayCloseHandler:handleCloseOverlay(open-manage-hub)',
        );

        // If pending was open, keep it open (no-op if already visible).
        if (pendingVisible) {
          openPanel(
            SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS,
            'useOverlayCloseHandler:handleCloseOverlay(preserve-pending)',
          );
        }

        return;
      }

      // ✅ Priority 2: We are on the hub. Now the close button should collapse
      // pending first (if open), otherwise close the container.
      if (pendingVisible) {
        if (DEBUG_ENABLED) {
          debugLog.log?.('handleCloseOverlay: hub -> close pending only', {
            current,
          });
        }

        closePanel(
          SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS,
          'useOverlayCloseHandler:handleCloseOverlay(pending-only)',
        );
        return;
      }

      // ✅ Priority 3: Hub with no pending → close the container normally.
      if (DEBUG_ENABLED) {
        debugLog.log?.('handleCloseOverlay: closing manage container', {
          current,
          activeManageChild,
        });
      }

      closePanel(
        MANAGE_CONTAINER,
        'useOverlayCloseHandler:handleCloseOverlay(close-manage-container)',
      );
      return;
    }

    // ───────────────── Default behavior for non-manage overlays ─────────────────
    const isList = LIST_OVERLAYS.has(current);

    if (DEBUG_ENABLED) {
      debugLog.log?.('handleCloseOverlay', { current, isList });
    }

    closePanel(
      current,
      isList
        ? 'useOverlayCloseHandler:handleCloseOverlay(list)'
        : 'useOverlayCloseHandler:handleCloseOverlay',
    );
  }, [activeMainOverlay, isVisible, manageChildren, openPanel, closePanel]);

  return { handleCloseOverlay };
}
