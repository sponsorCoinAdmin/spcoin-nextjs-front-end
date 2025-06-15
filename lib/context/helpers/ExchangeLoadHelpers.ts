// File: lib/context/helpers/loadLocalExchangeContext.ts

import { ExchangeContext } from '@/lib/structure';
import { ETHEREUM } from '@/lib/structure';
import { deserializeWithBigInt } from '@/lib/utils/jsonBigInt';
import { sanitizeExchangeContext } from './ExchangeSanitizeHelpers';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const STORAGE_KEY = 'exchangeContext';
const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_HELPER === 'true';
const debugLog = createDebugLogger('ExchangeHelpers', DEBUG_ENABLED, LOG_TIME);

export function loadLocalExchangeContext(): ExchangeContext | null {
  try {
    const serializedContext = localStorage.getItem(STORAGE_KEY);

    if (!serializedContext) {
      debugLog.warn(`⚠️ NO LOADED EXCHANGE CONTEXT FOUND FOR KEY\n${STORAGE_KEY}`);
      return null;
    }

    debugLog.log('🔓 LOADED EXCHANGE CONTEXT FROM LOCALSTORAGE (serialized)\n:', serializedContext);

    let parsed: any;
    try {
      parsed = deserializeWithBigInt(serializedContext);
    } catch (parseError) {
      debugLog.error(`❌ Failed to deserializeWithBigInt: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      console.error(parseError);
      return null;
    }

    debugLog.log('✅ PARSED LOADED EXCHANGE CONTEXT FROM LOCALSTORAGE (parsed)\n:', parsed);

    try {
      const prettyPrinted = JSON.stringify(
        parsed,
        (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
        2
      );
      debugLog.log('✅ (PRETTY PRINT) LOADED EXCHANGE CONTEXT FROM LOCALSTORAGE (parsed)\n:', prettyPrinted);
    } catch (stringifyError) {
      debugLog.warn('⚠️ Failed to pretty-print parsed ExchangeContext:', stringifyError);
    }

    const chainId = parsed.network?.chainId ?? ETHEREUM;

    const sanitized = sanitizeExchangeContext(parsed, chainId);

    // ✅ OPTIONAL: Add deep log for token balances
    const sellBalance = sanitized.tradeData.sellTokenContract?.balance;
    const buyBalance = sanitized.tradeData.buyTokenContract?.balance;
    debugLog.log(`💰 Restored sellTokenContract.balance: ${sellBalance?.toString()}`);
    debugLog.log(`💰 Restored buyTokenContract.balance: ${buyBalance?.toString()}`);

    return sanitized;
  } catch (error) {
    debugLog.error(`⛔ Failed to load exchangeContext: ${error instanceof Error ? error.message : String(error)}`);
    console.error(error);
    return null;
  }
}
