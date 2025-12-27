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

const nameOf = (p: SP_COIN_DISPLAY | null) =>
  p == null ? null : (SP_COIN_DISPLAY as any)[p] ?? String(p);

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

  const closeWithDebug = useCallback(
    (target: SP_COIN_DISPLAY, invoker: string) => {
      if (DEBUG_ENABLED) {
        debugLog.log?.('handleCloseOverlay: closePanel()', {
          target: nameOf(target),
          invoker,
          activeMainOverlay: nameOf(activeMainOverlay),
        });
      }
      closePanel(target, invoker);
    },
    [activeMainOverlay, closePanel],
  );

  /**
   * Generic close handler used by TRADE_CONTAINER_HEADER close button / back button.
   *
   * Policy (updated):
   * - Header "X" closes ONE layer at a time.
   * - For MANAGE_SPONSORSHIPS: DO NOT close the container if a deeper leaf exists.
   *   Close the most-specific visible child first (e.g. MANAGE_PENDING_REWARDS, then scoped child).
   */
  const handleCloseOverlay = useCallback(() => {
    // ───────────────── Priority 0: CLOSE_ONLY stack/detail panels ─────────────────
    // If any designated stack/detail panel is visible, close ONLY that panel.
    const closeOnly = pickVisibleCloseOnly();
    if (closeOnly) {
      if (DEBUG_ENABLED) {
        debugLog.log?.('handleCloseOverlay: CLOSE_ONLY -> close only', {
          closeOnly: nameOf(closeOnly),
          activeMainOverlay: nameOf(activeMainOverlay),
        });
      }

      closeWithDebug(
        closeOnly,
        'useOverlayCloseHandler:handleCloseOverlay(close-only)',
      );
      return;
    }

    const current = activeMainOverlay;
    if (!current) return;

    // ───────────────── Manage overlay: close ONE level (leaf-first) ─────────────────
    if (current === MANAGE_CONTAINER) {
      const pending = SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS;
      const pendingVisible = isVisible(pending);

      // scoped radio child under manage container
      const activeManageChild = manageChildren.find((p) => isVisible(p)) ?? null;

      if (DEBUG_ENABLED) {
        debugLog.log?.('handleCloseOverlay: manage -> leaf-first', {
          current: nameOf(current),
          pendingVisible,
          activeManageChild: nameOf(activeManageChild),
        });
      }

      // 1) Close deepest leaf first (pending rewards detail)
      if (pendingVisible) {
        closeWithDebug(
          pending,
          'useOverlayCloseHandler:handleCloseOverlay(close-manage-leaf:pending-rewards)',
        );
        return;
      }

      // 2) Otherwise close the currently-visible scoped child (radio member)
      if (activeManageChild) {
        closeWithDebug(
          activeManageChild,
          'useOverlayCloseHandler:handleCloseOverlay(close-manage-leaf:scoped-child)',
        );
        return;
      }

      // 3) Only if nothing inside manage is visible, close the container
      closeWithDebug(
        MANAGE_CONTAINER,
        'useOverlayCloseHandler:handleCloseOverlay(close-manage-container:fallback)',
      );
      return;
    }

    // ───────────────── Default behavior for non-manage overlays ─────────────────
    const isList = LIST_OVERLAYS.has(current);

    if (DEBUG_ENABLED) {
      debugLog.log?.('handleCloseOverlay', {
        current: nameOf(current),
        isList,
      });
    }

    // ✅ No fallback: just close the current overlay.
    closeWithDebug(
      current,
      isList
        ? 'useOverlayCloseHandler:handleCloseOverlay(list)'
        : 'useOverlayCloseHandler:handleCloseOverlay',
    );
  }, [
    activeMainOverlay,
    closeWithDebug,
    isVisible,
    manageChildren,
    pickVisibleCloseOnly,
  ]);

  return { handleCloseOverlay };
}
