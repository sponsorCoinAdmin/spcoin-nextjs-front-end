// File: @/lib/context/helpers/loadLocalExchangeContext.ts
'use client';

import type { ExchangeContext } from '@/lib/structure';
import { deserializeWithBigInt } from '@/lib/utils/jsonBigInt';
import { createDebugLogger } from '@/lib/utils/debugLogger';

// 🔑 LocalStorage key (keep in sync with ExchangeSaveHelpers)
const LOCAL_STORAGE_KEY = 'spcoin-exchange-context-v1';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_HELPER === 'true';

// Extra toggle just for the big pretty-print dump
const VERBOSE_DUMP =
  process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_HELPER_VERBOSE === 'true';

const debugLog = createDebugLogger(
  'loadLocalExchangeContext',
  DEBUG_ENABLED,
  LOG_TIME,
);

/** Small helper to inspect localStorage around loads. */
function debugLocalStorageSnapshot(stage: string) {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    const size = raw ? raw.length : 0;

    debugLog.log?.(`📦 [${stage}] localStorage snapshot`, {
      key: LOCAL_STORAGE_KEY,
      hasValue: !!raw,
      size,
      head: raw?.slice(0, 180) ?? null,
    });
  } catch (err) {
    debugLog.error?.(`⛔ [${stage}] localStorage snapshot failed`, err);
  }
}

export function loadLocalExchangeContext(): ExchangeContext | null {
  try {
    // Never touch localStorage on the server
    if (typeof window === 'undefined') {
      return null;
    }

    debugLocalStorageSnapshot('before-load');

    const serializedContext = window.localStorage.getItem(LOCAL_STORAGE_KEY);

    if (!serializedContext) {
      debugLog.warn?.(
        `⚠️ NO LOADED EXCHANGE CONTEXT FOUND FOR KEY\n${LOCAL_STORAGE_KEY}`,
      );
      return null;
    }

    debugLog.log?.(
      '🔓 LOADED EXCHANGE CONTEXT FROM LOCALSTORAGE (metadata)',
      {
        key: LOCAL_STORAGE_KEY,
        size: serializedContext.length,
        head: serializedContext.slice(0, 180),
      },
    );

    let parsed: any;
    try {
      parsed = deserializeWithBigInt(serializedContext);
    } catch (parseError) {
      debugLog.error?.(
        '❌ Failed to deserializeWithBigInt',
        parseError instanceof Error ? parseError.message : String(parseError),
      );
      return null;
    }

    debugLog.log?.(
      '✅ PARSED LOADED EXCHANGE CONTEXT FROM LOCALSTORAGE (summary)',
      {
        hasNetwork: !!parsed?.network,
        chainId: parsed?.network?.chainId ?? null,
        appChainId: parsed?.network?.appChainId ?? null,
        hasSettings: !!parsed?.settings,
        hasPanelTree: Array.isArray(parsed?.settings?.spCoinPanelTree),
      },
    );

    // Pretty-print only when the verbose flag is enabled
    if (VERBOSE_DUMP) {
      try {
        const prettyPrinted = JSON.stringify(
          parsed,
          (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
          2,
        );
        debugLog.log?.(
          '✅ (PRETTY PRINT) LOADED EXCHANGE CONTEXT FROM LOCALSTORAGE (parsed)',
          prettyPrinted,
        );
      } catch (stringifyError) {
        debugLog.warn?.(
          '⚠️ Failed to pretty-print parsed ExchangeContext',
          stringifyError,
        );
      }
    }

    debugLocalStorageSnapshot('after-load');

    // 🔄 Do NOT sanitize here; initExchangeContext owns sanitizeExchangeContext
    return parsed as ExchangeContext;
  } catch (error) {
    debugLog.error?.(
      '⛔ Failed to load exchangeContext',
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}
