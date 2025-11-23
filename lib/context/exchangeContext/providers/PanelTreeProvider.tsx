// File: @/lib/debug/panels/panelVisibilityProbe.ts
// (env-gated, zero-cost in prod unless flags are on)

import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_TREE === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_DROP_DOWN === 'true';

const debugLog = createDebugLogger('PanelVisibilityProbe', DEBUG_ENABLED, LOG_TIME);

// Also require a browser environment
const DBG =
  typeof window !== 'undefined' && DEBUG_ENABLED;

export function markPanelOpen(side: 'SELL' | 'BUY') {
  if (!DBG) return;

  (window as any).__lastTokenListOpen = {
    side,
    ts: Date.now(),
    stack: new Error().stack,
  };

  debugLog.log?.('[PanelProbe] OPEN requested', {
    label: `${side}_LIST_SELECT_PANEL`,
    lastTokenListOpen: (window as any).__lastTokenListOpen,
  });
}

export function markPanelClosed(reason: string, detail?: unknown) {
  if (!DBG) return;

  const last = (window as any).__lastTokenListOpen;
  const dt = last ? `${Date.now() - last.ts}ms after open` : 'no prior open mark';

  debugLog.log?.('[PanelProbe] CLOSED', {
    reason,
    elapsed: dt,
    lastOpen: last ?? null,
    detail: detail ?? null,
    closeTrace: new Error().stack,
  });
}

// ✅ Called when visibility is actually applied by your tree
export function markPanelApply(
  label: string,
  visible: boolean,
  reason?: string,
) {
  if (!DBG) return;

  debugLog.log?.('[PanelProbe] APPLY', {
    label,
    visible,
    reason: reason ?? null,
    applyTrace: new Error().stack,
  });
}
