// File: lib/hooks/inputValidations/utils/debugContextDump.ts

import type { TokenContract } from '@/lib/structure';
import type { InputState } from '@/lib/structure/assetSelection';

import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true';
const debugLog = createDebugLogger('debugContextDump', DEBUG_ENABLED, LOG_TIME);

/**
 * Logs the current FSM context.
 */
export function dumpFSMContext(
  header: string = '',
  inputState: InputState,
  validatedAsset: TokenContract | undefined,
  instanceId: string
) {
  debugLog.log(`🧭 FSMContext Dump: ${header}`, {
    inputState,
    validatedAsset,
    instanceId,
  });
}

/**
 * Logs the current Input Feed context.
 */
export function dumpInputFeedContext(
  header: string = '',
  validHexInput: string,
  debouncedHexInput: string,
  failedHexInput: string = '',
  failedHexCount: number,
  isValid: boolean,
  instanceId: string
) {
  debugLog.log(`📡 InputFeedContext Dump: ${header}`, {
    validHexInput,
    debouncedHexInput,
    failedHexInput,
    failedHexCount,
    isValid,
    instanceId,
  });
}
