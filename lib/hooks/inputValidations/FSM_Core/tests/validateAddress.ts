// File: lib/hooks/inputValidations/tests/validateAddress.ts

import { isAddress } from 'viem';
import { InputState } from '@/lib/structure';
import { isEmptyInput } from '../../validations/isEmptyInput';
import { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME:boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const debugLog = createDebugLogger('validateAddress', DEBUG_ENABLED, LOG_TIME);

export function validateAddress({ debouncedHexInput }: ValidateFSMInput): ValidateFSMOutput {
// alert(`Running validateAddress(${debouncedHexInput})`);
  debugLog.log(`Running validateAddress(${debouncedHexInput})`);
  if (isEmptyInput(debouncedHexInput)) {
    return { nextState: InputState.EMPTY_INPUT };
  } else if (!isAddress(debouncedHexInput)) {
    return { nextState: InputState.INCOMPLETE_ADDRESS };
  }
  return { nextState: InputState.TEST_DUPLICATE_INPUT };
}

