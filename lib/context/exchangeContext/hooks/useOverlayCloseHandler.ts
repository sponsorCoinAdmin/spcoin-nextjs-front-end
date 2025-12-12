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

// Overlays that behave like list-select overlays
const LIST_OVERLAYS = new Set<SP_COIN_DISPLAY>([
  SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL,
  SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL,
  SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL,
  SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL,
]);

// Origin overlays that should be restored when closing a list overlay
const MANAGE_SP_ORIGINS = new Set<SP_COIN_DISPLAY>([
  SP_COIN_DISPLAY.MANAGE_TRADING_SPCOINS_PANEL,
  SP_COIN_DISPLAY.MANAGE_STAKING_SPCOINS_PANEL,
]);

/**
 * useOverlayCloseHandler
 *
 * Centralizes "close overlay" behavior and tracks transitions so that
 * list-select overlays (token/recipient/agent) can bounce back to the
 * overlay they were opened from (e.g., MANAGE_TRADING_SPCOINS_PANEL)
 * instead of always going back to TRADING_STATION_PANEL.
 */
export function useOverlayCloseHandler() {
  // NOTE: usePanelTree does not expose `activeOverlay`, only `activeMainOverlay`.
  // Treat `activeMainOverlay` as the current overlay we care about here.
  const { activeMainOverlay, openPanel, closePanel } = usePanelTree();

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

    const prevIsList = prev ? LIST_OVERLAYS.has(prev) : false;
    const currIsList = current ? LIST_OVERLAYS.has(current) : false;

    // Entering a list overlay from a non-list overlay: capture origin
    if (current && currIsList && !prevIsList && prev) {
      originOverlayRef.current = prev;
      if (DEBUG_ENABLED) {
        debugLog.log?.('captured origin overlay for list-select', {
          origin: prev,
          listOverlay: current,
        });
      }
    }

    // Leaving a list overlay: possibly restore origin
    if (prev && prevIsList && !currIsList) {
      const origin = originOverlayRef.current;
      originOverlayRef.current = null;

      if (origin && MANAGE_SP_ORIGINS.has(origin)) {
        // If we just dropped back to TRADING_STATION_PANEL, override to origin.
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
   * - If active overlay is a list overlay, we just close it; the effect
   *   above will restore the origin overlay when appropriate.
   * - Otherwise, we simply close the current overlay.
   */
  const handleCloseOverlay = useCallback(() => {
    const current = activeMainOverlay;
    if (!current) return;

    const isList = LIST_OVERLAYS.has(current as SP_COIN_DISPLAY);

    if (DEBUG_ENABLED) {
      debugLog.log?.('handleCloseOverlay', { current, isList });
    }

    closePanel(
      current,
      isList
        ? 'useOverlayCloseHandler:handleCloseOverlay(list)'
        : 'useOverlayCloseHandler:handleCloseOverlay',
    );
  }, [activeMainOverlay, closePanel]);

  // Always return a stable object so destructuring never fails
  return { handleCloseOverlay };
}
