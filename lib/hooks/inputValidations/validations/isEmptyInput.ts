// File: lib/hooks/inputValidations/validation/isEmptyInput.ts

import { createDebugLogger } from '@/lib/utils/debugLogger';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_VALIDATION_STATE === 'true';
const debugLog = createDebugLogger('isEmptyInput', DEBUG_ENABLED);

export function isEmptyInput(input: string | undefined): boolean {
  const empty = !input?.trim();
  if (empty) debugLog.log('⛔ Detected empty input');
  return empty;
}
