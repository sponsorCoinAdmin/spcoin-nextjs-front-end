//File: app/(menu)/Test/Tabs/ExchangeContext/hooks/usePanelControls.ts
'use client';

import { useCallback } from 'react';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/registry/panelRegistry';
import type { SP_COIN_DISPLAY } from '@/lib/structure';

export function usePanelControls() {
  const { isVisible, openPanel, showPanel, hidePanel, closePanel } = usePanelTree();

  // Parent tagging rule: if the caller doesn't provide a tag, synthesize one.
  const makeTag = (method: string, panelId: SP_COIN_DISPLAY, parent?: string) =>
    parent ?? `usePanelControls:${method}(${Number(panelId)})`;

  /**
   * ✅ safeOpen:
   * - uses openPanel (push + show) for stack panels (gated inside usePanelTree)
   * - safe for any panel id
   */
  const safeOpen = useCallback(
    (panelId: SP_COIN_DISPLAY, parent?: string) => {
      openPanel(panelId, makeTag('safeOpen', panelId, parent));
    },
    [openPanel],
  );

  /**
   * ✅ safeHide:
   * - visibility-only close of a specific panel (does NOT pop the stack)
   * - this is what most callers actually want when they pass a panelId
   */
  const safeHide = useCallback(
    (panelId: SP_COIN_DISPLAY, parent?: string) => {
      hidePanel(panelId, makeTag('safeHide', panelId, parent));
    },
    [hidePanel],
  );

  /**
   * ✅ safeShow:
   * - visibility-only open of a specific panel (does NOT push the stack)
   * - useful for non-stack panels and for “just show it” flows
   */
  const safeShow = useCallback(
    (panelId: SP_COIN_DISPLAY, parent?: string) => {
      showPanel(panelId, makeTag('safeShow', panelId, parent));
    },
    [showPanel],
  );

  /**
   * ✅ safeCloseTop:
   * - pop + hide top-of-stack ONLY
   * - no panelId parameter on purpose
   */
  const safeCloseTop = useCallback(
    (parent?: string) => {
      closePanel(makeTag('safeCloseTop', 0 as any, parent), parent);
    },
    [closePanel],
  );

  /**
   * ✅ onTogglePanel:
   * - MAIN_OVERLAY_GROUP and other non-stack overlays should be show/hide only
   * - stack panels should use openPanel to push+show, and hidePanel to hide
   *
   * NOTE: We never call closePanel(panelId, ...) because that is the bug.
   */
  const onTogglePanel = useCallback(
    (panelId: SP_COIN_DISPLAY, parent?: string) => {
      const tag = makeTag('onTogglePanel', panelId, parent);
      const visible = isVisible(panelId);
      const isMainOverlay = MAIN_OVERLAY_GROUP.includes(panelId);

      if (visible) {
        // Always hide the specific panel (visibility-only)
        safeHide(panelId, tag);
        return;
      }

      if (isMainOverlay) {
        // Overlays: show only (radio controller will handle exclusivity)
        safeShow(panelId, tag);
        return;
      }

      // Default: open (push + show if stack, show-only if not stack)
      // openPanel is safe because push is gated internally.
      safeOpen(panelId, tag);
    },
    [isVisible, safeHide, safeShow, safeOpen],
  );

  // Expose safe wrappers.
  // - closePanel here means "hide THIS panel", not "pop stack".
  return {
    isVisible,
    onTogglePanel,

    // explicit APIs
    openPanel: safeOpen,
    showPanel: safeShow,
    hidePanel: safeHide,

    // explicit "pop top-of-stack"
    closeTop: safeCloseTop,
  };
}
