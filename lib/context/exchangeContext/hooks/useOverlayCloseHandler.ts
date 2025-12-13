// File: @/lib/context/exchangeContext/hooks/useOverlayCloseHandler.ts
'use client';

import { useCallback, useEffect, useRef } from 'react';
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
  SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL,
  SP_COIN_DISPLAY.STAKING_SPCOINS_PANEL,
]);

/**
 * useOverlayCloseHandler
 *
 * Centralized handler for "overlay close" behavior:
 *
 * 1. Tracks transitions of `activeMainOverlay` to:
 *    - Capture the "origin" overlay when entering a list overlay
 *    - Restore that origin overlay when leaving a list overlay
 *      (if we would otherwise land on TRADING_STATION_PANEL)
 *
 * 2. Provides `handleCloseOverlay` for headers / back buttons:
 *    - If pending rewards is visible under MANAGE_SPONSORSHIPS_PANEL,
 *      only close MANAGE_PENDING_REWARDS (keep the hub open).
 *    - Otherwise, close the current active overlay.
 *
 * This hook is intentionally small and focused: all the actual
 * visibility updates are delegated to `usePanelTree`.
 */
export function useOverlayCloseHandler() {
  // NOTE: usePanelTree exposes `activeMainOverlay` as the single
  // "radio" overlay in the MAIN_OVERLAY_GROUP.
  const { activeMainOverlay, isVisible, openPanel, closePanel } = usePanelTree();

  // Last overlay we saw (for transition detection)
  const prevOverlayRef = useRef<SP_COIN_DISPLAY | null>(null);

  // Where a list overlay was opened from (if applicable)
  const originOverlayRef = useRef<SP_COIN_DISPLAY | null>(null);

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

          openPanel(
            origin,
            'useOverlayCloseHandler:restoreOriginOverlay',
          );
        }
      }
    }

    prevOverlayRef.current = current;
  }, [activeMainOverlay, openPanel]);

  /**
   * Generic close handler used by headers / back buttons.
   *
   * Behavior:
   * - If MANAGE_SPONSORSHIPS_PANEL is active AND MANAGE_PENDING_REWARDS
   *   is visible, only close MANAGE_PENDING_REWARDS (keep the hub open).
   * - Otherwise, close the current overlay. List overlays rely on the
   *   effect above to restore their origin when appropriate.
   */
  const handleCloseOverlay = useCallback(() => {
    const current = activeMainOverlay;
    if (!current) return;

    const pendingVisible = isVisible(SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS);

    // 🔹 Special-case: Pending Rewards is a "sub-state" of the manage hub.
    // When it's visible, overlay-close should ONLY hide it, not the hub.
    if (
      current === SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL &&
      pendingVisible
    ) {
      if (DEBUG_ENABLED) {
        debugLog.log?.(
          'handleCloseOverlay: pending visible, closing it only',
          { current },
        );
      }

      closePanel(
        SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS,
        'useOverlayCloseHandler:handleCloseOverlay(pending-only)',
      );
      return;
    }

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
  }, [activeMainOverlay, isVisible, closePanel]);

  // Always return a stable object so destructuring never fails
  return { handleCloseOverlay };
}
