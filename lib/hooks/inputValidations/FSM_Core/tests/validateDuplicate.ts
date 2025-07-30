// File: lib/hooks/inputValidations/tests/validateDuplicate.ts

import { InputState, SP_COIN_DISPLAY } from '@/lib/structure';
import { isDuplicateInput } from '../../validations/isDuplicateInput';
import { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME: boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const debugLog = createDebugLogger('validateDuplicate', DEBUG_ENABLED, LOG_TIME);

/**
 * FSM Test: Detects if the user is selecting a duplicate token (same as sell or buy).
 * Returns DUPLICATE_INPUT_ERROR if duplicate detected, otherwise advances to VALIDATE_PREVIEW.
 */
export function validateDuplicate({
  containerType,
  debouncedHexInput,
  sellAddress,
  buyAddress,
}: ValidateFSMInput): ValidateFSMOutput {
  const isDuplicate = isDuplicateInput(containerType, debouncedHexInput, sellAddress, buyAddress);

  const msg = `Running validateDuplicate(${debouncedHexInput})`
  + `\ncontainerType = ${SP_COIN_DISPLAY[containerType]}`
  + `\nisDuplicate  = ${isDuplicate}`
  + `\nsellAddress = ${sellAddress}`
  + `\nbuyAddress  = ${buyAddress}`;

  // alert(msg);

  debugLog.log(`🧪 ${msg}`);

  if (isDuplicate) {
    debugLog.warn(`❌ Duplicate token detected → returning DUPLICATE_INPUT_ERROR`);
    return {
      nextState: InputState.DUPLICATE_INPUT_ERROR,
      errorMessage: 'Duplicate token: cannot select the same asset for both sides.',
    };
  }

  debugLog.log(`✅ No duplicate found → advancing to VALIDATE_PREVIEW`);
  return {
    nextState: InputState.VALIDATE_PREVIEW,
  };
}
