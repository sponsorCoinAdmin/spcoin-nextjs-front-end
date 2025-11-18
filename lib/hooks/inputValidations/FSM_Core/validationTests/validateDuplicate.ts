// File: lib/hooks/inputValidations/tests/validateDuplicate.ts

import { SP_COIN_DISPLAY } from '@/lib/structure';
import { InputState } from '@/lib/structure/assetSelection';

import type { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_FSM === 'true';
const debugLog = createDebugLogger('validateDuplicate', DEBUG_ENABLED, LOG_TIME);

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
  const result: ValidateFSMOutput = { nextState: InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY };
  debugLog.log('✅ No duplicate found → returning:', result);
  return result;
}
