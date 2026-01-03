// File: @/lib/context/exchangeContext/hooks/useOverlayCloseHandler.ts
'use client';

import { useCallback } from 'react';

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
 * ✅ One-shot suppression flag to prevent “double close”
 * (e.g. header X triggers both header handler + global overlay handler).
 */
const SUPPRESS_NEXT_OVERLAY_CLOSE_REF: { n: number; why?: string; tag?: string } =
  {
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

  const out = {
    suppressed: true,
    why: SUPPRESS_NEXT_OVERLAY_CLOSE_REF.why,
    tag: SUPPRESS_NEXT_OVERLAY_CLOSE_REF.tag,
  };

  // Clear stale debug metadata when counter reaches 0
  if (SUPPRESS_NEXT_OVERLAY_CLOSE_REF.n <= 0) {
    SUPPRESS_NEXT_OVERLAY_CLOSE_REF.why = undefined;
    SUPPRESS_NEXT_OVERLAY_CLOSE_REF.tag = undefined;
  }

  return out;
}

/**
 * useOverlayCloseHandler
 *
 * New architecture:
 * - Overlay close (backdrop/back/back) is a STACK POP.
 * - This MUST trigger radio-restore behavior in panelTreeCallbacks.
 *
 * ✅ Required fix:
 * - panelTreeCallbacks treats invokers starting with "NAV_CLOSE:" as POP.
 * - Therefore the invoker we pass to closePanel(...) MUST start with "NAV_CLOSE:"
 *   so restorePrevRadioMember() runs when appropriate.
 *
 * NOTE:
 * - We still call the legacy overload closePanel(invoker, arg) (no panel),
 *   which pops the top of settings.displayStack and hides it.
 */
export function useOverlayCloseHandler() {
  const { closePanel } = usePanelTree();

  const handleCloseOverlay = useCallback(
    (e?: React.MouseEvent) => {
      const sup = consumeSuppression();
      if (sup.suppressed) {
        if (DEBUG_ENABLED) {
          debugLog.log?.('handleCloseOverlay: SUPPRESSED (one-shot)', sup);
        }
        return;
      }

      const invoker = 'NAV_CLOSE:useOverlayCloseHandler:handleCloseOverlay(pop)';

      if (DEBUG_ENABLED) {
        debugLog.log?.('handleCloseOverlay: pop top of displayStack', { invoker });
      }

      // ✅ pop-top close (stack-driven)
      closePanel(invoker, e);
    },
    [closePanel],
  );

  return { handleCloseOverlay };
}
