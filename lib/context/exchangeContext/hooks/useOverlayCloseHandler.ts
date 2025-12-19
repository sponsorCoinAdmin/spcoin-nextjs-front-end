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
const MANAGE_DEFAULT_CHILD = SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL;

/**
 * useOverlayCloseHandler
 *
 * Centralized handler for GUI-driven "overlay close" behavior (header X / back).
 *
 * IMPORTANT POLICY:
 * - NO fallback behavior belongs here (e.g. "if nothing visible, open Trading").
 * - Panel-tree selection is responsible only for visibility + radio-group enforcement
 *   on OPEN. Closing a radio panel simply closes it.
 * - The GUI close/back behavior may implement back-stack / parent-return rules.
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
   */
  const handleCloseOverlay = useCallback(() => {
    // ───────────────── Priority 0: CLOSE_ONLY stack/detail panels ─────────────────
    // If any designated stack/detail panel is visible, close ONLY that panel.
    // Do not consult activeMainOverlay and do not apply hub/radio fallback here.
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

    // ───────────────── Special-case: manage container close behavior ─────────────────
    // IMPORTANT:
    //   MANAGE_PENDING_REWARDS is a *sub-state* of the hub (row expander), not a radio
    //   child. So we must NOT close it when closing a scoped child (Sponsors list, etc.).
    //   Only close pending when we are already on the hub.
    if (current === MANAGE_CONTAINER) {
      const pendingVisible = isVisible(SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS);

      // Find the currently-visible manage child (scoped radio).
      const activeManageChild = manageChildren.find((p) => isVisible(p)) ?? null;

            // ✅ Priority 1: If we are on a non-default manage child, close it.
      // IMPORTANT: do NOT explicitly open the hub here.
      // The PanelTree close rules for scoped radio children are responsible for
      // restoring the default/hub (and preserving any independent sub-panels like pending).
      if (activeManageChild && activeManageChild !== MANAGE_DEFAULT_CHILD) {
        if (DEBUG_ENABLED) {
          debugLog.log?.('handleCloseOverlay: manage child -> close child only', {
            current,
            activeManageChild,
            defaultChild: MANAGE_DEFAULT_CHILD,
            pendingVisible,
          });
        }

        closePanel(
          activeManageChild,
          'useOverlayCloseHandler:handleCloseOverlay(close-manage-child)',
        );
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

    // ✅ No fallback: just close the current overlay.
    closePanel(
      current,
      isList
        ? 'useOverlayCloseHandler:handleCloseOverlay(list)'
        : 'useOverlayCloseHandler:handleCloseOverlay',
    );
  }, [
    activeMainOverlay,
    closePanel,
    isVisible,
    manageChildren,
    openPanel,
    pickVisibleCloseOnly,
  ]);

  return { handleCloseOverlay };
}
