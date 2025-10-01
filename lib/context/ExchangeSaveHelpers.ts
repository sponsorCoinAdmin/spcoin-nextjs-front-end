// File: lib/context/ExchangeSaveHelpers.ts
import { ExchangeContext } from '@/lib/structure';
import { serializeWithBigInt } from '@/lib/utils/jsonBigInt';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { EXCHANGE_CONTEXT_STORAGE_KEY } from './helpers/storageKeys';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_HELPER === 'true';
const debugLog = createDebugLogger('ExchangeSaveHelpers', DEBUG_ENABLED, LOG_TIME);

/**
 * Save the provided ExchangeContext to localStorage
 * - Mirrors state exactly (no seeding, no stripping, no normalization)
 * - BigInt-safe serialization
 * - No-ops on the server / SSR
 */
export const saveLocalExchangeContext = (contextData: ExchangeContext): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    if (DEBUG_ENABLED) {
      debugLog.log(`📦 Saving exchangeContext to localStorage under key: ${EXCHANGE_CONTEXT_STORAGE_KEY}`);
    }

    // Mirror exactly: do not mutate or normalize anything
    const safeContext: ExchangeContext = contextData;

    const serializedContext = serializeWithBigInt(safeContext);

    if (DEBUG_ENABLED) {
      debugLog.log('🔓 SAVING EXCHANGE CONTEXT TO LOCALSTORAGE (serialized)\n:', serializedContext);

      // Pretty log (for humans) — BigInt -> string
      try {
        const prettyPrinted = JSON.stringify(
          safeContext,
          (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
          2
        );
        debugLog.log('✅ (PRETTY PRINT) SAVED EXCHANGE CONTEXT TO LOCALSTORAGE (parsed)\n:', prettyPrinted);
      } catch (prettyError) {
        debugLog.warn('⚠️ Failed to pretty-print exchangeContext', prettyError);
      }
    }

    window.localStorage.setItem(EXCHANGE_CONTEXT_STORAGE_KEY, serializedContext);
    if (DEBUG_ENABLED) debugLog.log('✅ exchangeContext successfully saved');
  } catch (err) {
    debugLog.error('❌ Failed to save exchangeContext to localStorage', err);
  }
};

/** Optional convenience for manual wipe during testing */
export const clearLocalExchangeContext = (reason = 'manual'): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(EXCHANGE_CONTEXT_STORAGE_KEY);
    if (DEBUG_ENABLED) debugLog.log('🧹 Cleared local exchangeContext', { reason });
  } catch (err) {
    debugLog.error('❌ Failed to clear exchangeContext', err);
  }
};
