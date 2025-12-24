// File: @/lib/context/exchangeContext/hooks/useOverlayCloseHandler.ts
'use client';

import { useCallback, useMemo } from 'react';
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
 * that temporarily replace another overlay (e.g. a manage hub).
 */
const LIST_OVERLAYS = new Set<SP_COIN_DISPLAY>([
  SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL,
  SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL,
  SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL,
  SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL,
]);

/**
 * CLOSE_ONLY overlays
 *
 * Panels in this group must behave like true stack/detail overlays:
 * - Header "X" closes ONLY the visible panel.
 * - No hub/radio fallback is performed here.
 *
 * Rationale: the opener/parent was never closed; PanelTree visibility rules will
 * reveal what is underneath.
 */
const CLOSE_ONLY_PANELS = new Set<SP_COIN_DISPLAY>([
  // Manage detail overlays (stack-like): close only, reveal underlying panel.
  SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL,
  SP_COIN_DISPLAY.MANAGE_AGENT_PANEL,
  SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL,
]);

const MANAGE_CONTAINER = SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS;

/**
 * useOverlayCloseHandler
 *
 * Centralized handler for GUI-driven "overlay close" behavior (header X / back).
 */
export function useOverlayCloseHandler() {
  // NOTE: usePanelTree exposes `activeMainOverlay` as the single
  // "radio" overlay in the MAIN_OVERLAY_GROUP.
  const { activeMainOverlay, isVisible, getPanelChildren, closePanel } =
    usePanelTree();

  const manageChildren = useMemo(() => {
    // Children of the MANAGE_SPONSORSHIPS container form a scoped radio group.
    // We rely on the registry via getPanelChildren.
    return getPanelChildren(MANAGE_CONTAINER);
  }, [getPanelChildren]);

  /**
   * Returns the highest-priority CLOSE_ONLY panel that is currently visible.
   */
  const pickVisibleCloseOnly = useCallback((): SP_COIN_DISPLAY | null => {
    for (const p of CLOSE_ONLY_PANELS) {
      if (isVisible(p)) return p;
    }
    return null;
  }, [isVisible]);

  /**
   * Generic close handler used by TRADE_CONTAINER_HEADER close button / back button.
   *
   * Stage 1 policy:
   * - The header "X" should NOT cause radio fallback/selection.
   * - For MANAGE_SPONSORSHIPS, clicking "X" should EXIT the overlay (close the container)
   *   rather than closing a scoped child and letting stack-restore pick a default.
   */
  const handleCloseOverlay = useCallback(() => {
    // ───────────────── Priority 0: CLOSE_ONLY stack/detail panels ─────────────────
    // If any designated stack/detail panel is visible, close ONLY that panel.
    const closeOnly = pickVisibleCloseOnly();
    if (closeOnly) {
      if (DEBUG_ENABLED) {
        debugLog.log?.('handleCloseOverlay: CLOSE_ONLY -> close only', {
          closeOnly,
          activeMainOverlay,
        });
      }

      closePanel(
        closeOnly,
        'useOverlayCloseHandler:handleCloseOverlay(close-only)',
      );
      return;
    }

    const current = activeMainOverlay;
    if (!current) return;

    // ───────────────── Manage overlay: always exit on X ─────────────────
    // If MANAGE_SPONSORSHIPS is active, close the container.
    // We do NOT close a scoped child first, because that can trigger restore logic
    // that incorrectly defaults to an unrelated sub-panel (e.g. MANAGE_PENDING_REWARDS).
    if (current === MANAGE_CONTAINER) {
      const pendingVisible = isVisible(SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS);
      const activeManageChild = manageChildren.find((p) => isVisible(p)) ?? null;

      if (DEBUG_ENABLED) {
        debugLog.log?.('handleCloseOverlay: manage -> close container (exit overlay)', {
          current,
          activeManageChild,
          pendingVisible,
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

    // ✅ No fallback: just close the current overlay.
    closePanel(
      current,
      isList
        ? 'useOverlayCloseHandler:handleCloseOverlay(list)'
        : 'useOverlayCloseHandler:handleCloseOverlay',
    );
  }, [activeMainOverlay, closePanel, isVisible, manageChildren, pickVisibleCloseOnly]);

  return { handleCloseOverlay };
}
