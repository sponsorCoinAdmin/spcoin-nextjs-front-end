// File: lib/context/helpers/loadLocalExchangeContext.ts
'use client';

import type { ExchangeContext } from '@/lib/structure';
import { CHAIN_ID } from '@/lib/structure'; // ⬅️ enum (barrel re-exports ./enums/networkIds)
import { deserializeWithBigInt } from '@/lib/utils/jsonBigInt';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { sanitizeExchangeContext } from './ExchangeSanitizeHelpers';

const STORAGE_KEY = 'exchangeContext';
const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_HELPER === 'true';
const debugLog = createDebugLogger('ExchangeHelpers/load', DEBUG_ENABLED, LOG_TIME);

export function loadLocalExchangeContext(): ExchangeContext | null {
  try {
    const serializedContext = localStorage.getItem(STORAGE_KEY);

    if (!serializedContext) {
      debugLog.warn(`⚠️ NO LOADED EXCHANGE CONTEXT FOUND FOR KEY\n${STORAGE_KEY}`);
      return null;
    }

    debugLog.log('🔓 LOADED EXCHANGE CONTEXT FROM LOCALSTORAGE(serialized)\n:', serializedContext);

    let parsed: any;
    try {
      parsed = deserializeWithBigInt(serializedContext);
    } catch (parseError) {
      debugLog.error(
        `❌ Failed to deserializeWithBigInt: ${
          parseError instanceof Error ? parseError.message : String(parseError)
        }`
      );
      return null;
    }

    debugLog.log('✅ PARSED LOADED EXCHANGE CONTEXT FROM LOCALSTORAGE(parsed)\n:', parsed);

    try {
      const prettyPrinted = JSON.stringify(
        parsed,
        (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
        2
      );
      debugLog.log('✅ (PRETTY PRINT) LOADED EXCHANGE CONTEXT FROM LOCALSTORAGE(parsed)\n:', prettyPrinted);
    } catch (stringifyError) {
      debugLog.warn('⚠️ Failed to pretty-print parsed ExchangeContext:', stringifyError);
    }

    const raw = Number(parsed?.network?.chainId);
    const chainId = Number.isFinite(raw) ? raw : CHAIN_ID.ETHEREUM; // ⬅️ fallback to mainnet

    debugLog.log('🔧 sanitizeExchangeContext with chainId:', chainId);
    return sanitizeExchangeContext(parsed, chainId);
  } catch (error) {
    debugLog.error(
      `⛔ Failed to load exchangeContext: ${error instanceof Error ? error.message : String(error)}`
    );
    return null;
  }
}
