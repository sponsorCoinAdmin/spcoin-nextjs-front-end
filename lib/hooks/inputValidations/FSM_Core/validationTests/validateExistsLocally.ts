// File: lib/hooks/inputValidations/tests/validateExistsLocally.ts

import { isAddress } from 'viem';
import { InputState } from '@/lib/structure/assetSelection';
import { isEmptyInput } from '../../validations/isEmptyInput';
import { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME:boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const debugLog = createDebugLogger('validateExistsLocally', DEBUG_ENABLED, LOG_TIME);

export function validateExistsLocally({ debouncedHexInput }: ValidateFSMInput): ValidateFSMOutput {
alert(`ToDo: validateExistsLocally(${debouncedHexInput})`);
  debugLog.log(`ToDo: validateExistsLocally(${debouncedHexInput})`);
  return { nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN };
}
