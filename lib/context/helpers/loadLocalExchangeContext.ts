// File: lib/context/helpers/loadLocalExchangeContext.ts
import { ExchangeContext } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { EXCHANGE_CONTEXT_STORAGE_KEY } from './storageKeys';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_HELPER === 'true';
const debugLog = createDebugLogger('ExchangeSaveHelpers', DEBUG_ENABLED, LOG_TIME);

/**
 * Load ExchangeContext from localStorage.
 * - No seeding here.
 * - Returns `undefined` if nothing/invalid.
 * - Does not mutate panels (provider owns seeding).
 */
export function loadLocalExchangeContext(): ExchangeContext | undefined {
  if (typeof window === 'undefined' || !window.localStorage) return undefined;

  try {
    const raw = window.localStorage.getItem(EXCHANGE_CONTEXT_STORAGE_KEY);
    if (DEBUG_ENABLED) debugLog.log('LOAD', { has: !!raw, len: raw?.length ?? 0, key: EXCHANGE_CONTEXT_STORAGE_KEY });

    if (!raw) return undefined;

    // If you have a deserializeWithBigInt, you can swap JSON.parse for it.
    const parsed = JSON.parse(raw) as ExchangeContext;

    if (DEBUG_ENABLED) {
      const panels = (parsed as any)?.settings?.mainPanelNode;
      debugLog.log('PARSED', {
        hasSettings: !!(parsed as any)?.settings,
        hasPanels: Array.isArray(panels),
        count: Array.isArray(panels) ? panels.length : undefined,
        sample: Array.isArray(panels)
          ? panels.slice(0, 3).map((p: any) => ({ panel: p.panel, name: p.name, visible: p.visible }))
          : undefined,
      });
    }

    return parsed;
  } catch (err) {
    debugLog.error('❌ LOAD error', err);
    return undefined;
  }
}
