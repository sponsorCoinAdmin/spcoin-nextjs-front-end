// File: lib/hooks/inputValidations/tests/validateDuplicate.ts

import { InputState, SP_COIN_DISPLAY_NEW } from '@/lib/structure';
import { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const debugLog = createDebugLogger('validateDuplicate', DEBUG_ENABLED, LOG_TIME);

/**
 * Detect duplicate selection:
 * - Compares the candidate (debouncedHexInput) to the opposing side’s address (peerAddress).
 * - If equal → DUPLICATE_INPUT_ERROR.
 * - Otherwise advances based on `manualEntry` (defaults to true if absent).
 */
export function validateDuplicate(input: ValidateFSMInput): ValidateFSMOutput {
  const { containerType, debouncedHexInput, peerAddress } = input;

  const cand = debouncedHexInput?.toLowerCase?.();
  const peer = peerAddress?.toLowerCase?.();

  // `manualEntry` may not exist on ValidateFSMInput in some builds; default to true.
  const manualEntry: boolean = (input as any)?.manualEntry ?? true;

  const isDuplicate = !!cand && !!peer && cand === peer;

  debugLog.log('📥 validateDuplicate()', {
    containerType: SP_COIN_DISPLAY_NEW[containerType],
    debouncedHexInput,
    peerAddress,
    manualEntry,
    isDuplicate,
  });

  alert(
    `📥 validateDuplicate(): ` +
    stringifyBigInt(
      {
        containerType: SP_COIN_DISPLAY_NEW[containerType],
        debouncedHexInput,
        peerAddress,
        manualEntry,
        isDuplicate,
      }
    )
  );

  if (isDuplicate) {
    const errorResult: ValidateFSMOutput = {
      nextState: InputState.DUPLICATE_INPUT_ERROR,
      errorMessage: 'Duplicate token: cannot select the same asset for both sides.',
    };
    debugLog.warn('❌ Duplicate token detected → returning:', errorResult);
    return errorResult;
  }

  const nextState = manualEntry
    ? InputState.VALIDATE_PREVIEW
    : InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY;

  const result: ValidateFSMOutput = { nextState };
  debugLog.log('✅ No duplicate found → returning:', result);
  return result;
}
