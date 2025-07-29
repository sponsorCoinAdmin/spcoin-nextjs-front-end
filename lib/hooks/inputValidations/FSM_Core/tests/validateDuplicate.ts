// File: lib/hooks/inputValidations/tests/validateDuplicate.ts

import { InputState } from '@/lib/structure';
import { isDuplicateInput } from '../../validations/isDuplicateInput';
import { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME:boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const debugLog = createDebugLogger('validateDuplicate', DEBUG_ENABLED, LOG_TIME);

export function validateDuplicate({
  containerType,
  debouncedHexInput,
  sellAddress,
  buyAddress,
}: ValidateFSMInput): ValidateFSMOutput {
alert(`Running validateDuplicate(${debouncedHexInput})`);
  debugLog.log(`Running validateDuplicate(${debouncedHexInput})`);
  if (isDuplicateInput(containerType, debouncedHexInput, sellAddress, buyAddress)) {
    return {
      nextState: InputState.DUPLICATE_INPUT_ERROR,
      errorMessage: 'Duplicate address detected',
    };
  }
  return { nextState: InputState.VALIDATE_PREVIEW };
}

