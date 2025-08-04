// File: lib/hooks/inputValidations/validation/isEmptyInput.ts
import { JUNK_ALERTS } from '@/lib/utils/JUNK_ALERTS';

import { createDebugLogger } from '@/lib/utils/debugLogger';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_VALIDATION_STATE === 'true';
const debugLog = createDebugLogger('isEmptyInput', DEBUG_ENABLED);

export function isEmptyInput(input: string | undefined): boolean {
  debugLog.log(`🔍 ENTRY → isEmptyInput called with input: "${input}"`);
  // JUNK_ALERTS(`🔍 ENTRY → isEmptyInput called with input: "${input}"`);

  const trimmed = input?.trim() ?? '';
  const isEmpty = trimmed === '';

  if (isEmpty) {
    debugLog.log('⛔ Detected empty input (undefined or blank)');
  }

  debugLog.log(`✅ EXIT → isEmptyInput result: ${isEmpty}`);

  return isEmpty;
}

