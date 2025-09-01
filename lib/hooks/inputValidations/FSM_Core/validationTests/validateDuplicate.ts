// File: lib/hooks/inputValidations/tests/validateDuplicate.ts

import { SP_COIN_DISPLAY } from '@/lib/structure';
import { InputState } from '@/lib/structure/assetSelection';

import { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const debugLog = createDebugLogger('validateDuplicate', DEBUG_ENABLED, LOG_TIME);

/**
 * Detect duplicate selection:
 * - Compares the candidate (debouncedHexInput) to the opposing side’s address (peerAddress).
 * - If equal → DUPLICATE_INPUT_ERROR.
 * - Otherwise ALWAYS advance to PREVIEW_CONTRACT_EXISTS_LOCALLY.
 *
 * NOTE:2
 *  - No local cache check here.
 *  - No NOT_FOUND branch here.
 *  - manualEntry logic happens later in validateResolvedAsset.
 */
export function validateDuplicate(input: ValidateFSMInput): ValidateFSMOutput {
  const { containerType, debouncedHexInput, peerAddress } = input;

  const cand = debouncedHexInput?.toLowerCase?.();
  const peer = peerAddress?.toLowerCase?.();

  const isDuplicate = !!cand && !!peer && cand === peer;

  debugLog.log('📥 validateDuplicate()', {
    containerType: SP_COIN_DISPLAY[containerType],
    debouncedHexInput,
    peerAddress,
    isDuplicate,
  });

  if (isDuplicate) {
    const errorResult: ValidateFSMOutput = {
      nextState: InputState.DUPLICATE_INPUT_ERROR,
      errorMessage: 'Duplicate token: cannot select the same asset for both sides.',
    };
    debugLog.warn('❌ Duplicate token detected → returning:', errorResult);
    return errorResult;
  }

  // ✅ Always proceed to the "exists locally" preview step when not duplicate.
  const result: ValidateFSMOutput = { nextState: InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY };
  debugLog.log('✅ No duplicate found → returning:', result);
  return result;
}
