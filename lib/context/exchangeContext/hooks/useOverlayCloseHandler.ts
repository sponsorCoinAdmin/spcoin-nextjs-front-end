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
 * ✅ One-shot suppression flag to prevent “double close”
 * (e.g. header X triggers both header handler + global overlay handler).
 */
const SUPPRESS_NEXT_OVERLAY_CLOSE_REF: { n: number; why?: string; tag?: string } = {
  n: 0,
};

/**
 * Call this from header-X (or any close source) to suppress the *next*
 * handleCloseOverlay() attempt.
 */
export function suppressNextOverlayClose(why?: string, tag?: string) {
  SUPPRESS_NEXT_OVERLAY_CLOSE_REF.n += 1;
  SUPPRESS_NEXT_OVERLAY_CLOSE_REF.why = why;
  SUPPRESS_NEXT_OVERLAY_CLOSE_REF.tag = tag;

  if (DEBUG_ENABLED) {
    // eslint-disable-next-line no-console
    console.log('[useOverlayCloseHandler] suppressNextOverlayClose', {
      n: SUPPRESS_NEXT_OVERLAY_CLOSE_REF.n,
      why,
      tag,
    });
  }
}

function consumeSuppression(): { suppressed: boolean; why?: string; tag?: string } {
  if (SUPPRESS_NEXT_OVERLAY_CLOSE_REF.n <= 0) return { suppressed: false };
  SUPPRESS_NEXT_OVERLAY_CLOSE_REF.n -= 1;
  return {
    suppressed: true,
    why: SUPPRESS_NEXT_OVERLAY_CLOSE_REF.why,
    tag: SUPPRESS_NEXT_OVERLAY_CLOSE_REF.tag,
  };
}

/**
 * List-style overlays (token/recipient/agent)
 * These temporarily replace another overlay.
 */
const LIST_OVERLAYS = new Set<SP_COIN_DISPLAY>([
  SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL,
  SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL,
  SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL,
  SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL,
]);

/**
 * Panels that behave like true stack/detail overlays.
 */
const CLOSE_ONLY_PANELS = new Set<SP_COIN_DISPLAY>([
  SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL,
  SP_COIN_DISPLAY.MANAGE_AGENT_PANEL,
  SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL,
]);

const MANAGE_CONTAINER = SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS;

/**
 * useOverlayCloseHandler
 *
 * Centralized handler for GUI-driven "overlay close" behavior (header X / back / backdrop).
 * This handler decides WHAT to close. The actual stack/radio restore belongs in usePanelTree.
 */
export function useOverlayCloseHandler() {
  const { activeMainOverlay, isVisible, getPanelChildren, closePanel } =
    usePanelTree();

  const manageChildren = useMemo(() => {
    return getPanelChildren(MANAGE_CONTAINER);
  }, [getPanelChildren]);

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

  const handleCloseOverlay = useCallback(() => {
    // ✅ if a header already handled close, skip this once
    const sup = consumeSuppression();
    if (sup.suppressed) {
      if (DEBUG_ENABLED) {
        debugLog.log?.('handleCloseOverlay: SUPPRESSED (one-shot)', sup);
      }
      return;
    }

    // Priority 0: close-only detail overlays
    const closeOnly = pickVisibleCloseOnly();
    if (closeOnly) {
      closeWithDebug(
        closeOnly,
        'useOverlayCloseHandler:handleCloseOverlay(close-only)',
      );
      return;
    }

    const current = activeMainOverlay;
    if (!current) return;

    // Manage overlay leaf-first close
    if (current === MANAGE_CONTAINER) {
      const pending = SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS;
      const pendingVisible = isVisible(pending);

      const activeManageChild =
        manageChildren
          .filter((p) => !CLOSE_ONLY_PANELS.has(p))
          .find((p) => isVisible(p)) ?? null;

      if (DEBUG_ENABLED) {
        debugLog.log?.('handleCloseOverlay: manage -> leaf-first', {
          current: nameOf(current),
          pendingVisible,
          activeManageChild: nameOf(activeManageChild),
        });
      }

      if (pendingVisible) {
        closeWithDebug(
          pending,
          'useOverlayCloseHandler:handleCloseOverlay(close-manage-leaf:pending-rewards)',
        );
        return;
      }

      if (activeManageChild) {
        closeWithDebug(
          activeManageChild,
          'useOverlayCloseHandler:handleCloseOverlay(close-manage-leaf:hub-child)',
        );
        return;
      }

      closeWithDebug(
        MANAGE_CONTAINER,
        'useOverlayCloseHandler:handleCloseOverlay(close-manage-container:fallback)',
      );
      return;
    }

    const isList = LIST_OVERLAYS.has(current);

    if (DEBUG_ENABLED) {
      debugLog.log?.('handleCloseOverlay', {
        current: nameOf(current),
        isList,
      });
    }

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
