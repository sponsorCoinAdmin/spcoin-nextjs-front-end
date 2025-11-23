// File: @/lib/hooks/inputValidations/helpers/debugLogInstance.ts
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_VALIDATION_STATE === 'true';

/** Factory: create a validation logger with a custom label (defaults to 'debugLogInstance'). */
export function getValidationDebugLogger(label: string = 'debugLogInstance') {
  return createDebugLogger(label, DEBUG_ENABLED, LOG_TIME);
}

/** Default instance for existing imports. */
export const debugLog = getValidationDebugLogger();
