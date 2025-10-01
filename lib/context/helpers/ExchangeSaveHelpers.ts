// File: lib/context/helpers/ExchangeSaveHelpers.ts
import { ExchangeContext } from '@/lib/structure';
import { serializeWithBigInt, deserializeWithBigInt } from '@/lib/utils/jsonBigInt';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { EXCHANGE_CONTEXT_STORAGE_KEY } from './storageKeys';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_HELPER === 'true';
const debugLog = createDebugLogger('ExchangeSaveHelpers', DEBUG_ENABLED, LOG_TIME);

/** Save: exact mirror, BigInt-safe, no-ops on SSR */
export const saveLocalExchangeContext = (contextData: ExchangeContext): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const serialized = serializeWithBigInt(contextData);
    if (DEBUG_ENABLED) {
      debugLog.log(`📦 saving → ${EXCHANGE_CONTEXT_STORAGE_KEY}`);
      try {
        debugLog.log(
          'pretty:',
          JSON.stringify(contextData, (_k, v) => (typeof v === 'bigint' ? v.toString() : v), 2)
        );
      } catch {}
    }
    window.localStorage.setItem(EXCHANGE_CONTEXT_STORAGE_KEY, serialized);
  } catch (err) {
    debugLog.error('❌ save failed', err);
  }
};

/** Load: returns undefined if empty/bad; BigInt-safe; no-ops on SSR */
export const loadLocalExchangeContext = (): ExchangeContext | undefined => {
  if (typeof window === 'undefined' || !window.localStorage) return undefined;
  try {
    const raw = window.localStorage.getItem(EXCHANGE_CONTEXT_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = deserializeWithBigInt(raw) as ExchangeContext;
    if (DEBUG_ENABLED) debugLog.log('📥 loaded exchangeContext from localStorage');
    return parsed;
  } catch (err) {
    debugLog.error('❌ load failed; ignoring stored value', err);
    return undefined;
  }
};

/** Optional convenience for manual wipe during testing */
export const clearLocalExchangeContext = (reason = 'manual'): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(EXCHANGE_CONTEXT_STORAGE_KEY);
    if (DEBUG_ENABLED) debugLog.log('🧹 cleared local exchangeContext', { reason });
  } catch (err) {
    debugLog.error('❌ clear failed', err);
  }
};
