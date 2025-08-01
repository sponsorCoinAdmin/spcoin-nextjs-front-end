// File: lib/hooks/inputValidations/tests/validateDuplicate.ts

import { InputState, SP_COIN_DISPLAY } from '@/lib/structure';
import { isDuplicateInput } from '../../validations/isDuplicateInput';
import { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME: boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const debugLog = createDebugLogger('validateDuplicate', true, LOG_TIME);

/**
 * FSM Test: Detects if the user is selecting a duplicate token (same as sell or buy).
 * Returns DUPLICATE_INPUT_ERROR if duplicate detected.
 * Advances to VALIDATE_PREVIEW if manualEntry, otherwise to PREVIEW_CONTRACT_EXISTS_LOCALLY.
 */
export function validateDuplicate({
  containerType,
  debouncedHexInput,
  sellAddress,
  buyAddress,
  manualEntry,
}: ValidateFSMInput): ValidateFSMOutput {
  debugLog.log(`📥 validateDuplicate() called with:`, {
    containerType: SP_COIN_DISPLAY[containerType],
    debouncedHexInput,
    sellAddress,
    buyAddress,
    manualEntry,
  });

  const isDuplicate = isDuplicateInput(containerType, debouncedHexInput, sellAddress, buyAddress);

  const msg = `Running validateDuplicate(${debouncedHexInput})`
    + `\ncontainerType = ${SP_COIN_DISPLAY[containerType]}`
    + `\nisDuplicate  = ${isDuplicate}`
    + `\nsellAddress = ${sellAddress}`
    + `\nbuyAddress  = ${buyAddress}`
    + `\nmanualEntry = ${manualEntry}`;

  debugLog.log(`🧪 ${msg}`);
  // alert(`🧪 ${msg}`);

  if (isDuplicate) {
    const errorResult: ValidateFSMOutput = {
      nextState: InputState.DUPLICATE_INPUT_ERROR,
      errorMessage: 'Duplicate token: cannot select the same asset for both sides.',
    };
    debugLog.warn(`❌ Duplicate token detected → returning:`, errorResult);
    return errorResult;
  }

  const nextState = manualEntry
    ? InputState.VALIDATE_PREVIEW   // 🟢 Manual input
    : InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY; // 🔷 Datalist select

  const result: ValidateFSMOutput = { nextState };
  debugLog.log(`✅ No duplicate found → returning:`, result);

  return result;
}
