import { ExchangeContext } from '@/lib/structure';
import { ETHEREUM } from '@/lib/structure';
import { deserializeWithBigInt } from '@/lib/utils/jsonBigInt';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { sanitizeExchangeContext } from './ExchangeSanitizeHelpers';

const STORAGE_KEY = 'exchangeContext';
const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_HELPER === 'true';
const debugLog = createDebugLogger('ExchangeLoadHelpers', DEBUG_ENABLED, LOG_TIME);

export function loadLocalExchangeContext(): ExchangeContext | null {
  try {
    const serializedContext = localStorage.getItem(STORAGE_KEY);

    if (!serializedContext) {
      debugLog.warn(`\u26A0\uFE0F NO LOADED EXCHANGE CONTEXT FOUND FOR KEY\n${STORAGE_KEY}`);
      return null;
    }

    debugLog.log('\ud83d\udd13 LOADED EXCHANGE CONTEXT FROM LOCALSTORAGE(serialized)\n:', serializedContext);

    let parsed: any;
    try {
      parsed = deserializeWithBigInt(serializedContext);
    } catch (parseError) {
      debugLog.error(`\u274C Failed to deserializeWithBigInt: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      console.error(parseError);
      return null;
    }

    debugLog.log('\u2705 PARSED LOADED EXCHANGE CONTEXT FROM LOCALSTORAGE(parsed)\n:', parsed);

    try {
      const prettyPrinted = JSON.stringify(
        parsed,
        (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
        2
      );
      debugLog.log('\u2705 (PRETTY PRINT) LOADED EXCHANGE CONTEXT FROM LOCALSTORAGE(parsed)\n:', prettyPrinted);
    } catch (stringifyError) {
      debugLog.warn('\u26A0\uFE0F Failed to pretty-print parsed ExchangeContext:', stringifyError);
    }

    const chainId = parsed.network?.chainId ?? ETHEREUM;
    return sanitizeExchangeContext(parsed, chainId);
  } catch (error) {
    debugLog.error(`\u26D4\uFE0F Failed to load exchangeContext: ${error instanceof Error ? error.message : String(error)}`);
    console.error(error);
    return null;
  }
}
