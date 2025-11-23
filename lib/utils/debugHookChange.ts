// File: @/lib/utils/debugHookChange.ts

import { serializeWithBigInt } from '@/lib/utils/jsonBigInt';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_HOOKS_LOGGING === 'true';
const debugLog = createDebugLogger('ExchangeHelpers', DEBUG_ENABLED, LOG_TIME);

export function debugHookChange<T>(hookName: string, oldValue: T, newValue: T) {
  const oldStr = serializeWithBigInt(oldValue);
  const newStr = serializeWithBigInt(newValue);

  if (oldStr !== newStr) {
    debugLog.log(`⚙️ Executing ${hookName}:\nOLD: ${oldStr}\nNEW: ${newStr}`);
  }
}
