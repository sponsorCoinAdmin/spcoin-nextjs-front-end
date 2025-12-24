// File: @/lib/context/exchangeContext/panelTree/panelTreeDebug.ts

import { SP_COIN_DISPLAY } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';

export const LOG_TIME = false;
export const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_TREE === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_OVERLAYS === 'true';

export const debugLog = createDebugLogger('usePanelTree', DEBUG_ENABLED, LOG_TIME);

export const schedule = (fn: () => void) =>
  typeof queueMicrotask === 'function' ? queueMicrotask(fn) : setTimeout(fn, 0);

export function logAction(
  kind: 'openPanel' | 'closePanel',
  panel: SP_COIN_DISPLAY,
  invoker?: string,
  extra?: Record<string, unknown>,
) {
  if (!DEBUG_ENABLED) return;

  debugLog.log?.('[usePanelTree] action', {
    kind,
    panel: SP_COIN_DISPLAY[panel],
    invoker: invoker ?? 'unknown',
    ...(extra ?? {}),
  });
}
